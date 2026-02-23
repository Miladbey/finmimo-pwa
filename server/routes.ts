import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { signupSchema, loginSchema } from "@shared/schema";
import * as storage from "./storage";

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const payload = storage.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }

  (req as any).userId = payload.userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const data = signupSchema.parse(req.body);
      const user = await storage.createUser(data.email, data.password, data.displayName);
      const token = storage.generateToken(user.id);
      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.loginUser(data.email, data.password);
      const token = storage.generateToken(user.id);
      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        token,
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Login failed" });
    }
  });

  app.get("/api/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const stats = await storage.getUserStats(userId);
      const nextLesson = await storage.getNextLesson(userId);
      const userProgress = await storage.getUserProgress(userId);

      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        ...stats,
        nextLesson,
        progress: userProgress,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/me/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const profile = await storage.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/paths", async (_req: Request, res: Response) => {
    try {
      const paths = await storage.getPaths();
      res.json(paths);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/paths/:id", async (req: Request, res: Response) => {
    try {
      const path = await storage.getPathById(req.params.id);
      if (!path) return res.status(404).json({ message: "Path not found" });
      res.json(path);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/skills/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const skill = await storage.getSkillById(req.params.id);
      if (!skill) return res.status(404).json({ message: "Skill not found" });

      const userId = (req as any).userId;
      const userProgress = await storage.getUserProgress(userId);
      const lessonProgress = new Map(
        userProgress
          .filter((p) => p.skillId === req.params.id)
          .map((p) => [p.lessonId, p])
      );

      const lessonsWithProgress = skill.lessons.map((l) => ({
        ...l,
        progress: lessonProgress.get(l.id) || null,
      }));

      res.json({ ...skill, lessons: lessonsWithProgress });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lessons/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const lesson = await storage.getLessonById(req.params.id);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/attempts", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { exerciseId, answer } = req.body;
      const result = await storage.gradeAttempt(userId, exerciseId, answer);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/lessons/:id/complete", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const result = await storage.completeLesson(userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/practice/queue", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const queue = await storage.getPracticeQueue(userId);
      res.json(queue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/practice/complete", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const result = await storage.completePracticeSession(userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects/:id/submit", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const submission = await storage.submitProject(userId, req.params.id, req.body.data);
      res.json(submission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/submissions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/tutor", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;

      const advicePatterns = [
        /what should i (invest|buy|sell)/i,
        /best (stock|coin|crypto|etf|fund)/i,
        /give me (picks|recommendations|tips)/i,
        /should i (buy|sell|hold)/i,
        /what (stock|coin|crypto) (to|should)/i,
        /recommend.*(stock|fund|investment)/i,
        /which.*(stock|fund|etf).*(buy|invest)/i,
      ];

      const isAdviceRequest = advicePatterns.some((p) => p.test(message));

      if (isAdviceRequest) {
        return res.json({
          reply:
            "I appreciate your curiosity! However, I'm an educational tutor and cannot provide personalized investment recommendations or financial advice. Instead, I can help you learn how to evaluate investment options, understand risk factors, and develop your own analytical framework. Would you like me to teach you about any of these topics?",
          isGuardrailed: true,
        });
      }

      let contextInfo = "";
      if (context?.lessonTitle) contextInfo += `Current lesson: ${context.lessonTitle}. `;
      if (context?.skillTitle) contextInfo += `Current skill: ${context.skillTitle}. `;
      if (context?.exercisePrompt) contextInfo += `Current exercise: ${context.exercisePrompt}. `;

      const educationalResponses: Record<string, string> = {
        budget: "A budget is your financial roadmap. It helps you plan where every dollar goes. The key components are: income tracking, expense categorization (needs vs wants), and setting savings goals. Would you like me to walk through the 50/30/20 framework?",
        save: "Saving is about building financial security. Start with an emergency fund covering 3-6 months of expenses. Use the 'pay yourself first' method by automating savings before spending. Even $5/day adds up to $1,825/year!",
        debt: "Understanding debt is crucial. Focus on the difference between 'good debt' (mortgages, education) and 'bad debt' (high-interest credit cards). Two popular payoff strategies are the snowball method (smallest balance first) and avalanche method (highest interest first).",
        invest: "Investing basics start with understanding asset classes: stocks (ownership in companies), bonds (loans to entities), and index funds (diversified baskets of investments). Key principles include diversification, dollar-cost averaging, and the power of compound growth.",
        risk: "Risk management in finance means understanding the relationship between potential returns and potential losses. Your risk tolerance depends on your time horizon, financial situation, and comfort level. Diversification is one of the best tools for managing investment risk.",
        credit: "Your credit score (300-850) is based on: payment history (35%), amounts owed (30%), length of history (15%), new credit (10%), and credit mix (10%). Always pay at least the minimum on time and keep credit utilization below 30%.",
        compound: "Compound growth is when your returns earn their own returns. For example, $1,000 at 8% annual return becomes $2,159 in 10 years and $10,063 in 30 years. This is why starting to invest early, even with small amounts, is so powerful.",
      };

      const lowerMsg = message.toLowerCase();
      let reply = "That's a great question! Let me explain this concept in the context of personal finance. ";

      for (const [keyword, response] of Object.entries(educationalResponses)) {
        if (lowerMsg.includes(keyword)) {
          reply = response;
          break;
        }
      }

      if (contextInfo) {
        reply += `\n\nBased on what you're currently studying (${context?.skillTitle || "personal finance"}), let me know if you'd like me to go deeper into any specific concept or provide practice questions.`;
      }

      reply += "\n\nDisclaimer: This is educational content only, not financial advice. Always consult a licensed financial advisor for personalized guidance.";

      res.json({ reply, isGuardrailed: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
