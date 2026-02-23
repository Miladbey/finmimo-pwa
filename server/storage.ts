import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "finmimo-secret-key";

export async function createUser(email: string, password: string, displayName: string) {
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, displayName })
    .returning();

  await db.insert(schema.userProfiles).values({ userId: user.id });
  await db.insert(schema.streaks).values({ userId: user.id });

  return user;
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return user;
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getUser(userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  return user;
}

export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId));
  return profile;
}

export async function updateUserProfile(userId: string, data: { dailyGoalMinutes?: number; focusArea?: string }) {
  const [profile] = await db
    .update(schema.userProfiles)
    .set(data)
    .where(eq(schema.userProfiles.userId, userId))
    .returning();
  return profile;
}

export async function getPaths() {
  return db.select().from(schema.paths).orderBy(asc(schema.paths.orderIndex));
}

export async function getPathById(id: string) {
  const [path] = await db.select().from(schema.paths).where(eq(schema.paths.id, id));
  if (!path) return null;

  const pathSkills = await db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.pathId, id))
    .orderBy(asc(schema.skills.orderIndex));

  return { ...path, skills: pathSkills };
}

export async function getSkillById(id: string) {
  const [skill] = await db.select().from(schema.skills).where(eq(schema.skills.id, id));
  if (!skill) return null;

  const skillLessons = await db
    .select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.skillId, id), eq(schema.lessons.isPublished, true)))
    .orderBy(asc(schema.lessons.orderIndex));

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.skillId, id));

  return { ...skill, lessons: skillLessons, project };
}

export async function getLessonById(id: string) {
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id));
  if (!lesson) return null;

  const lessonExercises = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.lessonId, id))
    .orderBy(asc(schema.exercises.orderIndex));

  return { ...lesson, exercises: lessonExercises };
}

export async function gradeAttempt(userId: string, exerciseId: string, answerJson: any) {
  const [exercise] = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId));
  if (!exercise) throw new Error("Exercise not found");

  const answer = exercise.answerJson as any;
  let isCorrect = false;

  if (exercise.type === "multiple_choice") {
    isCorrect = answerJson.selected === answer.correct;
  } else if (exercise.type === "true_false") {
    isCorrect = answerJson.selected === answer.correct;
  } else if (exercise.type === "numeric") {
    const val = parseFloat(answerJson.value);
    isCorrect = val >= answer.min && val <= answer.max;
  }

  const [attempt] = await db
    .insert(schema.attempts)
    .values({ userId, exerciseId, answerJson, isCorrect })
    .returning();

  if (isCorrect) {
    await awardXp(userId, "correct_answer", 2);
  }

  return {
    ...attempt,
    isCorrect,
    explanation: exercise.explanation,
    hint: !isCorrect ? exercise.hint : null,
    correctAnswer: isCorrect ? null : answer,
  };
}

export async function completeLesson(userId: string, lessonId: string) {
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId));
  if (!lesson) throw new Error("Lesson not found");

  const existing = await db
    .select()
    .from(schema.progress)
    .where(and(eq(schema.progress.userId, userId), eq(schema.progress.lessonId, lessonId)));

  if (existing.length === 0) {
    await db.insert(schema.progress).values({
      userId,
      skillId: lesson.skillId,
      lessonId,
      status: "completed",
      masteryScore: 1.0,
    });
  } else {
    await db
      .update(schema.progress)
      .set({ status: "completed", masteryScore: 1.0, updatedAt: new Date() })
      .where(and(eq(schema.progress.userId, userId), eq(schema.progress.lessonId, lessonId)));
  }

  await awardXp(userId, "lesson_complete", 5);
  await updateStreak(userId);
  await checkAchievements(userId);

  return { success: true };
}

export async function awardXp(userId: string, type: string, amount: number) {
  await db.insert(schema.xpEvents).values({ userId, type, amount });
  await db
    .update(schema.userProfiles)
    .set({
      totalXp: sql`${schema.userProfiles.totalXp} + ${amount}`,
    })
    .where(eq(schema.userProfiles.userId, userId));
}

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const [streak] = await db
    .select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId));

  if (!streak) return;

  if (streak.lastActiveDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newCurrent = 1;
  let newFreezeCount = streak.freezeCount;

  if (streak.lastActiveDate === yesterdayStr) {
    newCurrent = streak.current + 1;
  } else if (streak.lastActiveDate) {
    const daysDiff = Math.floor(
      (new Date(today).getTime() - new Date(streak.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff === 2 && streak.freezeCount > 0) {
      newCurrent = streak.current + 1;
      newFreezeCount = streak.freezeCount - 1;
    }
  }

  const newLongest = Math.max(streak.longest, newCurrent);

  await db
    .update(schema.streaks)
    .set({
      current: newCurrent,
      longest: newLongest,
      lastActiveDate: today,
      freezeCount: newFreezeCount,
      updatedAt: new Date(),
    })
    .where(eq(schema.streaks.userId, userId));
}

export async function getStreak(userId: string) {
  const [streak] = await db
    .select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId));
  return streak;
}

export async function getUserStats(userId: string) {
  const profile = await getUserProfile(userId);
  const streak = await getStreak(userId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayXp = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.xpEvents.amount}), 0)` })
    .from(schema.xpEvents)
    .where(
      and(
        eq(schema.xpEvents.userId, userId),
        sql`${schema.xpEvents.createdAt} >= ${todayStart}`
      )
    );

  const completedLessons = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.progress)
    .where(
      and(eq(schema.progress.userId, userId), eq(schema.progress.status, "completed"))
    );

  const todayLessons = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.progress)
    .where(
      and(
        eq(schema.progress.userId, userId),
        eq(schema.progress.status, "completed"),
        sql`${schema.progress.updatedAt} >= ${todayStart}`
      )
    );

  const userAchievementsList = await db
    .select({
      achievement: schema.achievements,
      unlockedAt: schema.userAchievements.unlockedAt,
    })
    .from(schema.userAchievements)
    .innerJoin(schema.achievements, eq(schema.userAchievements.achievementId, schema.achievements.id))
    .where(eq(schema.userAchievements.userId, userId));

  return {
    profile,
    streak,
    todayXp: Number(todayXp[0]?.total || 0),
    totalXp: profile?.totalXp || 0,
    completedLessons: Number(completedLessons[0]?.count || 0),
    todayLessons: Number(todayLessons[0]?.count || 0),
    achievements: userAchievementsList,
  };
}

export async function getUserProgress(userId: string) {
  return db
    .select()
    .from(schema.progress)
    .where(eq(schema.progress.userId, userId));
}

export async function getPracticeQueue(userId: string) {
  const incorrectAttempts = await db
    .select({ exerciseId: schema.attempts.exerciseId })
    .from(schema.attempts)
    .where(and(eq(schema.attempts.userId, userId), eq(schema.attempts.isCorrect, false)))
    .orderBy(desc(schema.attempts.createdAt))
    .limit(20);

  const exerciseIds = [...new Set(incorrectAttempts.map((a) => a.exerciseId))];

  let practiceExercises: any[] = [];

  if (exerciseIds.length > 0) {
    practiceExercises = await db
      .select()
      .from(schema.exercises)
      .where(inArray(schema.exercises.id, exerciseIds))
      .limit(10);
  }

  if (practiceExercises.length < 10) {
    const completedLessons = await db
      .select({ lessonId: schema.progress.lessonId })
      .from(schema.progress)
      .where(and(eq(schema.progress.userId, userId), eq(schema.progress.status, "completed")));

    if (completedLessons.length > 0) {
      const existingIds = practiceExercises.map((e) => e.id);
      const additional = await db
        .select()
        .from(schema.exercises)
        .where(
          inArray(
            schema.exercises.lessonId,
            completedLessons.map((c) => c.lessonId)
          )
        )
        .limit(10 - practiceExercises.length);

      practiceExercises.push(
        ...additional.filter((e) => !existingIds.includes(e.id))
      );
    }
  }

  return practiceExercises.slice(0, 10);
}

export async function submitProject(userId: string, projectId: string, dataJson: any) {
  const [submission] = await db
    .insert(schema.projectSubmissions)
    .values({ projectId, userId, dataJson })
    .returning();

  await awardXp(userId, "project_complete", 20);
  await checkAchievements(userId);

  return submission;
}

export async function getUserSubmissions(userId: string) {
  return db
    .select()
    .from(schema.projectSubmissions)
    .where(eq(schema.projectSubmissions.userId, userId))
    .orderBy(desc(schema.projectSubmissions.createdAt));
}

export async function getProjectById(id: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  return project;
}

async function checkAchievements(userId: string) {
  const stats = await getUserStats(userId);
  const allAchievements = await db.select().from(schema.achievements);
  const earned = stats.achievements.map((a) => a.achievement.key);

  for (const achievement of allAchievements) {
    if (earned.includes(achievement.key)) continue;

    let shouldAward = false;
    if (achievement.key === "first_lesson" && stats.completedLessons >= 1) shouldAward = true;
    if (achievement.key === "streak_3" && (stats.streak?.current || 0) >= 3) shouldAward = true;
    if (achievement.key === "streak_7" && (stats.streak?.current || 0) >= 7) shouldAward = true;
    if (achievement.key === "xp_100" && stats.totalXp >= 100) shouldAward = true;
    if (achievement.key === "first_project") {
      const subs = await getUserSubmissions(userId);
      if (subs.length >= 1) shouldAward = true;
    }

    if (shouldAward) {
      await db.insert(schema.userAchievements).values({
        userId,
        achievementId: achievement.id,
      });
    }
  }
}

export async function getNextLesson(userId: string) {
  const allPaths = await getPaths();
  if (allPaths.length === 0) return null;

  const userProgress = await getUserProgress(userId);
  const completedLessonIds = new Set(
    userProgress.filter((p) => p.status === "completed").map((p) => p.lessonId)
  );

  for (const path of allPaths) {
    const pathData = await getPathById(path.id);
    if (!pathData) continue;

    for (const skill of pathData.skills) {
      const skillData = await getSkillById(skill.id);
      if (!skillData) continue;

      for (const lesson of skillData.lessons) {
        if (!completedLessonIds.has(lesson.id)) {
          return { path, skill, lesson };
        }
      }
    }
  }
  return null;
}

export async function completePracticeSession(userId: string) {
  await awardXp(userId, "practice_session", 15);
  await updateStreak(userId);
  return { success: true };
}
