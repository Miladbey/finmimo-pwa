import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const existingPaths = await db.select().from(schema.paths);
  if (existingPaths.length > 0) {
    console.log("Database already seeded, skipping...");
    await pool.end();
    return;
  }

  const [path] = await db
    .insert(schema.paths)
    .values({
      title: "Personal Finance Foundations",
      description:
        "Master the building blocks of personal finance: budgeting, saving, debt management, investing basics, and long-term planning.",
      orderIndex: 0,
      iconName: "trending-up",
      colorHex: "#00B87C",
    })
    .returning();

  const skillsData = [
    {
      title: "Budgeting Basics",
      description: "Learn to track income and expenses, build a budget, and stick to it.",
      orderIndex: 0,
      iconName: "pie-chart",
    },
    {
      title: "Saving & Emergency Funds",
      description: "Build a safety net and develop saving habits that last.",
      orderIndex: 1,
      iconName: "shield",
    },
    {
      title: "Debt & Credit Fundamentals",
      description: "Understand how debt works, manage credit wisely, and plan payoff strategies.",
      orderIndex: 2,
      iconName: "credit-card",
    },
    {
      title: "Investing Fundamentals",
      description: "Explore stocks, bonds, index funds, and the power of compound growth.",
      orderIndex: 3,
      iconName: "bar-chart-2",
    },
    {
      title: "Risk & Long-term Planning",
      description: "Manage financial risk, plan for retirement, and set long-term goals.",
      orderIndex: 4,
      iconName: "target",
    },
  ];

  const insertedSkills = await db
    .insert(schema.skills)
    .values(skillsData.map((s) => ({ ...s, pathId: path.id })))
    .returning();

  const lessonsMap: Record<string, { title: string; content: any[] }[]> = {
    "Budgeting Basics": [
      {
        title: "What Is a Budget?",
        content: [
          { type: "read", text: "A budget is a plan for your money. It tells each dollar where to go so you're in control of your finances, not the other way around." },
          { type: "read", text: "Think of it like a roadmap: without one, you might still reach your destination, but you'll waste time and gas along the way." },
        ],
      },
      {
        title: "Income vs Expenses",
        content: [
          { type: "read", text: "Income is money coming in: salary, freelance work, side gigs. Expenses are money going out: rent, food, subscriptions, entertainment." },
          { type: "read", text: "The golden rule: spend less than you earn. The gap between income and expenses is your financial breathing room." },
        ],
      },
      {
        title: "Fixed vs Variable Costs",
        content: [
          { type: "read", text: "Fixed costs stay the same each month: rent, insurance, car payments. Variable costs fluctuate: groceries, dining out, entertainment." },
          { type: "read", text: "Knowing the difference helps you identify where you have the most flexibility to cut spending." },
        ],
      },
      {
        title: "The 50/30/20 Rule",
        content: [
          { type: "read", text: "A popular budgeting framework: 50% of after-tax income goes to needs, 30% to wants, and 20% to savings and debt repayment." },
          { type: "read", text: "It's a guideline, not a strict rule. Adjust percentages based on your situation and goals." },
        ],
      },
      {
        title: "Tracking Your Spending",
        content: [
          { type: "read", text: "You can't manage what you don't measure. Track every expense for at least one month to see where your money actually goes." },
          { type: "read", text: "Use apps, spreadsheets, or even pen and paper. The method matters less than consistency." },
        ],
      },
      {
        title: "Building Your First Budget",
        content: [
          { type: "read", text: "Step 1: List all income sources. Step 2: List all expenses. Step 3: Categorize expenses. Step 4: Set limits. Step 5: Track and adjust." },
          { type: "read", text: "Your first budget won't be perfect. Revise it monthly as you learn your actual spending patterns." },
        ],
      },
    ],
    "Saving & Emergency Funds": [
      {
        title: "Why Save?",
        content: [
          { type: "read", text: "Saving gives you options. It protects you from emergencies, lets you seize opportunities, and reduces financial stress." },
          { type: "read", text: "Even small amounts add up. Saving $5 a day means $1,825 a year." },
        ],
      },
      {
        title: "Pay Yourself First",
        content: [
          { type: "read", text: "Treat savings like a non-negotiable bill. Before paying anything else, move money into savings. Automate it if possible." },
          { type: "read", text: "This flips the typical approach: instead of saving what's left, you spend what's left after saving." },
        ],
      },
      {
        title: "Emergency Fund Basics",
        content: [
          { type: "read", text: "An emergency fund covers unexpected expenses: car repairs, medical bills, job loss. Aim for 3-6 months of essential expenses." },
          { type: "read", text: "Start with a mini goal: $500 or $1,000. Then build up gradually." },
        ],
      },
      {
        title: "Where to Keep Savings",
        content: [
          { type: "read", text: "High-yield savings accounts offer better interest than regular checking. They're FDIC insured and accessible when needed." },
          { type: "read", text: "Keep your emergency fund separate from daily spending to reduce temptation." },
        ],
      },
      {
        title: "Saving Strategies",
        content: [
          { type: "read", text: "The envelope method, round-up savings, no-spend challenges, and the 52-week challenge are all effective techniques." },
          { type: "read", text: "The best strategy is the one you'll actually stick with. Experiment to find your fit." },
        ],
      },
      {
        title: "Setting Savings Goals",
        content: [
          { type: "read", text: "Specific goals motivate action. Instead of 'save more,' try 'save $3,000 for an emergency fund by December.'" },
          { type: "read", text: "Break big goals into monthly or weekly targets. Celebrate milestones along the way." },
        ],
      },
    ],
    "Debt & Credit Fundamentals": [
      {
        title: "Understanding Debt",
        content: [
          { type: "read", text: "Debt is money you owe. Not all debt is bad: a mortgage can build wealth, while credit card debt often destroys it." },
          { type: "read", text: "The key factor is interest rate. Low-interest debt on appreciating assets is very different from high-interest consumer debt." },
        ],
      },
      {
        title: "How Interest Works",
        content: [
          { type: "read", text: "Interest is the cost of borrowing money. It compounds over time, meaning you pay interest on interest." },
          { type: "read", text: "A $5,000 credit card balance at 20% APR costs about $1,000 per year in interest alone if unpaid." },
        ],
      },
      {
        title: "Credit Scores Explained",
        content: [
          { type: "read", text: "Your credit score (300-850) reflects your borrowing history. Higher scores mean better loan terms and lower interest rates." },
          { type: "read", text: "Key factors: payment history (35%), amounts owed (30%), length of history (15%), new credit (10%), credit mix (10%)." },
        ],
      },
      {
        title: "Debt Snowball Method",
        content: [
          { type: "read", text: "Pay minimum on all debts, then throw extra money at the smallest balance first. Once paid off, roll that payment into the next smallest." },
          { type: "read", text: "The psychological wins of paying off small debts keep you motivated." },
        ],
      },
      {
        title: "Debt Avalanche Method",
        content: [
          { type: "read", text: "Pay minimum on all debts, then attack the highest interest rate first. This saves the most money mathematically." },
          { type: "read", text: "Choose avalanche if you're motivated by math, snowball if you need quick wins." },
        ],
      },
      {
        title: "Using Credit Wisely",
        content: [
          { type: "read", text: "Use credit cards as tools, not crutches. Pay the full balance each month to avoid interest charges." },
          { type: "read", text: "Keep utilization below 30% of your credit limit. Set up autopay for at least the minimum payment." },
        ],
      },
    ],
    "Investing Fundamentals": [
      {
        title: "Why Invest?",
        content: [
          { type: "read", text: "Investing puts your money to work. While savings preserve wealth, investing grows it by earning returns over time." },
          { type: "read", text: "Historically, the stock market has returned about 7-10% annually over long periods, far outpacing inflation." },
        ],
      },
      {
        title: "Stocks & Bonds",
        content: [
          { type: "read", text: "Stocks represent ownership in companies. Bonds are loans you make to governments or corporations that pay interest." },
          { type: "read", text: "Stocks offer higher potential returns but more risk. Bonds are generally more stable but offer lower returns." },
        ],
      },
      {
        title: "Index Funds & ETFs",
        content: [
          { type: "read", text: "Index funds track a market index like the S&P 500. They provide instant diversification at very low cost." },
          { type: "read", text: "ETFs trade like stocks throughout the day. Both index funds and ETFs are recommended for most beginner investors." },
        ],
      },
      {
        title: "Compound Growth",
        content: [
          { type: "read", text: "Compound growth means your returns earn returns. $1,000 at 8% becomes $2,159 in 10 years, $4,661 in 20 years, and $10,063 in 30 years." },
          { type: "read", text: "Time is your greatest advantage. Starting early, even with small amounts, dramatically impacts your final balance." },
        ],
      },
      {
        title: "Dollar-Cost Averaging",
        content: [
          { type: "read", text: "DCA means investing a fixed amount at regular intervals regardless of market price. You buy more shares when prices are low, fewer when high." },
          { type: "read", text: "This removes emotion from investing and reduces the risk of buying everything at a market peak." },
        ],
      },
      {
        title: "Diversification",
        content: [
          { type: "read", text: "Don't put all your eggs in one basket. Spread investments across different asset classes, sectors, and geographies." },
          { type: "read", text: "Diversification reduces risk without necessarily reducing expected returns. It's the closest thing to a free lunch in finance." },
        ],
      },
    ],
    "Risk & Long-term Planning": [
      {
        title: "Understanding Risk",
        content: [
          { type: "read", text: "All investments carry risk. The key is understanding and managing it, not avoiding it entirely." },
          { type: "read", text: "Risk and return are related: higher potential returns generally come with higher risk." },
        ],
      },
      {
        title: "Risk Tolerance",
        content: [
          { type: "read", text: "Your risk tolerance depends on your time horizon, financial situation, and emotional comfort with volatility." },
          { type: "read", text: "Young investors with decades ahead can generally tolerate more risk. Near-retirees typically shift to more conservative allocations." },
        ],
      },
      {
        title: "Insurance Basics",
        content: [
          { type: "read", text: "Insurance transfers financial risk to a company. Health, auto, renters/homeowners, and life insurance protect against major losses." },
          { type: "read", text: "The goal isn't to insure everything, but to protect against losses you couldn't afford to cover yourself." },
        ],
      },
      {
        title: "Retirement Accounts",
        content: [
          { type: "read", text: "401(k) and IRA accounts offer tax advantages for retirement savings. Employer matches are essentially free money." },
          { type: "read", text: "Traditional accounts give you a tax break now; Roth accounts give you tax-free withdrawals in retirement." },
        ],
      },
      {
        title: "Setting Financial Goals",
        content: [
          { type: "read", text: "Short-term (1-3 years), medium-term (3-10 years), and long-term (10+ years) goals each require different strategies." },
          { type: "read", text: "Write your goals down with specific amounts and timelines. Review and adjust them at least annually." },
        ],
      },
      {
        title: "Building a Financial Plan",
        content: [
          { type: "read", text: "A financial plan ties everything together: budgeting, saving, debt management, investing, insurance, and goals." },
          { type: "read", text: "Start simple and iterate. The perfect plan you never make is worse than a basic plan you follow." },
        ],
      },
    ],
  };

  const exercisesMap: Record<string, { lessonTitle: string; exercises: any[] }[]> = {
    "Budgeting Basics": [
      {
        lessonTitle: "What Is a Budget?",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What is the primary purpose of a budget?",
            options: ["To restrict all spending", "To plan where your money goes", "To earn more money", "To avoid paying taxes"],
            answer: { correct: 1 },
            explanation: "A budget is a plan for your money. It helps you allocate your income intentionally rather than restricting all spending.",
            hint: "Think about what a roadmap does for a journey.",
          },
          {
            type: "true_false",
            prompt: "A budget means you can never spend money on things you enjoy.",
            options: null,
            answer: { correct: false },
            explanation: "Budgets include categories for wants and entertainment. The goal is intentional spending, not deprivation.",
            hint: "Think about the 50/30/20 rule.",
          },
        ],
      },
      {
        lessonTitle: "Income vs Expenses",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "Which of the following is NOT typically considered income?",
            options: ["Salary", "Freelance payment", "Credit card balance", "Side gig earnings"],
            answer: { correct: 2 },
            explanation: "A credit card balance is debt, not income. Income is money you earn through work or investments.",
            hint: "Income is money flowing IN to you.",
          },
        ],
      },
      {
        lessonTitle: "The 50/30/20 Rule",
        exercises: [
          {
            type: "numeric",
            prompt: "In the 50/30/20 rule, what percentage goes to needs?",
            options: null,
            answer: { correct: 50, min: 50, max: 50 },
            explanation: "The 50/30/20 rule allocates 50% to needs, 30% to wants, and 20% to savings/debt.",
            hint: "It's the largest portion in the framework.",
          },
          {
            type: "multiple_choice",
            prompt: "Which category does 'dining out' fall under in the 50/30/20 rule?",
            options: ["Needs (50%)", "Wants (30%)", "Savings (20%)", "None of the above"],
            answer: { correct: 1 },
            explanation: "Dining out is a want, not a need. You could eat at home for less money.",
            hint: "Could you survive without it?",
          },
        ],
      },
      {
        lessonTitle: "Tracking Your Spending",
        exercises: [
          {
            type: "true_false",
            prompt: "You should track your spending for at least one full month to get an accurate picture.",
            options: null,
            answer: { correct: true },
            explanation: "One month gives you a complete cycle of regular expenses and helps identify spending patterns.",
            hint: "Bills and expenses follow a monthly cycle.",
          },
        ],
      },
    ],
    "Saving & Emergency Funds": [
      {
        lessonTitle: "Why Save?",
        exercises: [
          {
            type: "numeric",
            prompt: "If you save $5 every day for a year, how much will you have? (in dollars)",
            options: null,
            answer: { correct: 1825, min: 1825, max: 1825 },
            explanation: "$5 × 365 days = $1,825. Small daily amounts add up significantly over a year.",
            hint: "Multiply $5 by the number of days in a year.",
          },
        ],
      },
      {
        lessonTitle: "Pay Yourself First",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What does 'pay yourself first' mean?",
            options: ["Buy whatever you want before bills", "Save money before paying other expenses", "Pay your credit card first", "Keep cash at home"],
            answer: { correct: 1 },
            explanation: "Pay yourself first means prioritizing savings as a non-negotiable expense before spending on other things.",
            hint: "Think about what 'paying yourself' really represents.",
          },
        ],
      },
      {
        lessonTitle: "Emergency Fund Basics",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "How many months of essential expenses should an emergency fund typically cover?",
            options: ["1 month", "3-6 months", "12 months", "24 months"],
            answer: { correct: 1 },
            explanation: "Financial experts generally recommend 3-6 months of essential expenses as an emergency fund target.",
            hint: "It's a range that balances accessibility with adequate coverage.",
          },
          {
            type: "true_false",
            prompt: "A new smartphone is a good reason to use your emergency fund.",
            options: null,
            answer: { correct: false },
            explanation: "Emergency funds are for unexpected, necessary expenses like medical bills or job loss, not planned purchases.",
            hint: "Is a new phone truly unexpected and necessary?",
          },
        ],
      },
    ],
    "Debt & Credit Fundamentals": [
      {
        lessonTitle: "Understanding Debt",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "Which type of debt is generally considered 'good debt'?",
            options: ["Credit card debt", "Payday loans", "A mortgage on a home", "Store financing"],
            answer: { correct: 2 },
            explanation: "A mortgage is often considered good debt because it can build equity in an appreciating asset at relatively low interest rates.",
            hint: "Which option involves an asset that typically grows in value?",
          },
        ],
      },
      {
        lessonTitle: "How Interest Works",
        exercises: [
          {
            type: "numeric",
            prompt: "A $5,000 credit card balance at 20% APR costs approximately how much in interest per year? (in dollars)",
            options: null,
            answer: { correct: 1000, min: 950, max: 1050 },
            explanation: "$5,000 × 20% = $1,000 per year in interest charges.",
            hint: "Multiply the balance by the annual rate.",
          },
        ],
      },
      {
        lessonTitle: "Credit Scores Explained",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What is the most important factor in your credit score?",
            options: ["Length of credit history", "Payment history", "Credit mix", "New credit inquiries"],
            answer: { correct: 1 },
            explanation: "Payment history accounts for 35% of your FICO score, making it the single most important factor.",
            hint: "It's worth 35% of your score.",
          },
          {
            type: "numeric",
            prompt: "Payment history accounts for what percentage of your FICO credit score?",
            options: null,
            answer: { correct: 35, min: 35, max: 35 },
            explanation: "Payment history is 35% of your FICO score. Always pay at least the minimum on time.",
            hint: "It's the largest component.",
          },
        ],
      },
      {
        lessonTitle: "Debt Snowball Method",
        exercises: [
          {
            type: "true_false",
            prompt: "The debt snowball method targets the highest interest rate debt first.",
            options: null,
            answer: { correct: false },
            explanation: "The snowball method targets the smallest balance first for psychological wins. The avalanche method targets highest interest rates.",
            hint: "Think about what 'snowball' implies - starting small and building momentum.",
          },
        ],
      },
    ],
    "Investing Fundamentals": [
      {
        lessonTitle: "Why Invest?",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What is the approximate historical average annual return of the stock market?",
            options: ["1-3%", "4-6%", "7-10%", "15-20%"],
            answer: { correct: 2 },
            explanation: "Historically, the stock market has returned roughly 7-10% annually over long periods before adjusting for inflation.",
            hint: "It's in the single digits but higher than savings accounts.",
          },
        ],
      },
      {
        lessonTitle: "Stocks & Bonds",
        exercises: [
          {
            type: "true_false",
            prompt: "Bonds generally offer higher returns than stocks over long periods.",
            options: null,
            answer: { correct: false },
            explanation: "Stocks typically outperform bonds over long periods but come with more short-term volatility.",
            hint: "Higher risk generally means higher potential returns.",
          },
          {
            type: "multiple_choice",
            prompt: "What does owning a stock represent?",
            options: ["A loan to a company", "Ownership in a company", "A savings account", "A type of insurance"],
            answer: { correct: 1 },
            explanation: "Stocks represent ownership (equity) in a company. You become a partial owner and share in profits and losses.",
            hint: "Stockholders are also called shareholders.",
          },
        ],
      },
      {
        lessonTitle: "Compound Growth",
        exercises: [
          {
            type: "numeric",
            prompt: "If $1,000 grows at 8% annually for 10 years, approximately how much will it be worth? (nearest dollar)",
            options: null,
            answer: { correct: 2159, min: 2100, max: 2200 },
            explanation: "$1,000 × (1.08)^10 ≈ $2,159. This demonstrates the power of compound growth over time.",
            hint: "Use the formula: amount × (1 + rate)^years",
          },
        ],
      },
      {
        lessonTitle: "Dollar-Cost Averaging",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What is the main benefit of dollar-cost averaging?",
            options: ["Guaranteed profits", "Removes emotion from investing", "Higher returns than lump sum", "Eliminates all risk"],
            answer: { correct: 1 },
            explanation: "DCA removes the emotional component of trying to time the market by investing consistently regardless of price.",
            hint: "Think about what automatic, regular investing prevents you from doing.",
          },
        ],
      },
    ],
    "Risk & Long-term Planning": [
      {
        lessonTitle: "Understanding Risk",
        exercises: [
          {
            type: "true_false",
            prompt: "Higher potential returns generally come with higher risk.",
            options: null,
            answer: { correct: true },
            explanation: "This is a fundamental principle of investing. The risk-return tradeoff means more reward potential requires accepting more uncertainty.",
            hint: "Think about the difference in returns between savings accounts and stocks.",
          },
        ],
      },
      {
        lessonTitle: "Risk Tolerance",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "Which investor can typically afford to take on more risk?",
            options: ["A 60-year-old near retirement", "A 25-year-old just starting their career", "Someone with no emergency fund", "Someone with high credit card debt"],
            answer: { correct: 1 },
            explanation: "A 25-year-old has decades to recover from market downturns, allowing them to take on more risk for potentially higher returns.",
            hint: "Who has the most time for their investments to recover?",
          },
        ],
      },
      {
        lessonTitle: "Retirement Accounts",
        exercises: [
          {
            type: "multiple_choice",
            prompt: "What makes a 401(k) employer match special?",
            options: ["It's taxed at a lower rate", "It's essentially free money", "It's guaranteed to grow", "It has no contribution limits"],
            answer: { correct: 1 },
            explanation: "An employer match is additional compensation your employer contributes to your retirement. Not taking full advantage of it means leaving free money on the table.",
            hint: "Your employer is giving you something for contributing.",
          },
          {
            type: "true_false",
            prompt: "Roth IRA contributions are taxed when you withdraw them in retirement.",
            options: null,
            answer: { correct: false },
            explanation: "Roth contributions are made with after-tax dollars, so qualified withdrawals in retirement are tax-free.",
            hint: "You pay taxes on Roth contributions NOW, not later.",
          },
        ],
      },
    ],
  };

  const projectsData = [
    {
      skillTitle: "Budgeting Basics",
      title: "Monthly Budget Builder",
      description: "Create your personal monthly budget by entering your income and expenses.",
      schemaJson: {
        fields: [
          { key: "monthlyIncome", label: "Monthly After-Tax Income", type: "number", required: true },
          { key: "rent", label: "Rent / Mortgage", type: "number", required: true },
          { key: "utilities", label: "Utilities", type: "number", required: true },
          { key: "insurance", label: "Insurance", type: "number", required: true },
          { key: "groceries", label: "Groceries", type: "number", required: true },
          { key: "transportation", label: "Transportation", type: "number", required: true },
          { key: "dining", label: "Dining Out", type: "number", required: false },
          { key: "entertainment", label: "Entertainment", type: "number", required: false },
          { key: "subscriptions", label: "Subscriptions", type: "number", required: false },
          { key: "savings", label: "Savings Goal", type: "number", required: true },
        ],
        computations: ["totalExpenses", "remainingIncome", "needsPercent", "wantsPercent", "savingsPercent"],
      },
    },
    {
      skillTitle: "Saving & Emergency Funds",
      title: "Emergency Fund Plan",
      description: "Calculate how much you need for an emergency fund and create a timeline to reach your goal.",
      schemaJson: {
        fields: [
          { key: "monthlyExpenses", label: "Monthly Essential Expenses", type: "number", required: true },
          { key: "targetMonths", label: "Target Months of Coverage", type: "number", required: true },
          { key: "currentSavings", label: "Current Savings", type: "number", required: true },
          { key: "monthlySavingAmount", label: "Amount You Can Save Monthly", type: "number", required: true },
        ],
        computations: ["targetAmount", "amountNeeded", "monthsToGoal"],
      },
    },
    {
      skillTitle: "Debt & Credit Fundamentals",
      title: "Debt Payoff Simulator",
      description: "Compare snowball vs avalanche payoff strategies for your debts.",
      schemaJson: {
        fields: [
          { key: "debt1Name", label: "Debt 1 Name", type: "text", required: true },
          { key: "debt1Balance", label: "Debt 1 Balance", type: "number", required: true },
          { key: "debt1Rate", label: "Debt 1 Interest Rate (%)", type: "number", required: true },
          { key: "debt1MinPayment", label: "Debt 1 Min Payment", type: "number", required: true },
          { key: "debt2Name", label: "Debt 2 Name", type: "text", required: false },
          { key: "debt2Balance", label: "Debt 2 Balance", type: "number", required: false },
          { key: "debt2Rate", label: "Debt 2 Interest Rate (%)", type: "number", required: false },
          { key: "debt2MinPayment", label: "Debt 2 Min Payment", type: "number", required: false },
          { key: "extraMonthly", label: "Extra Monthly Payment", type: "number", required: true },
        ],
        computations: ["snowballMonths", "avalancheMonths", "snowballInterest", "avalancheInterest"],
      },
    },
    {
      skillTitle: "Investing Fundamentals",
      title: "Investing Simulator",
      description: "Compare dollar-cost averaging vs lump sum investing outcomes.",
      schemaJson: {
        fields: [
          { key: "totalAmount", label: "Total Amount to Invest", type: "number", required: true },
          { key: "monthlyContribution", label: "Monthly DCA Amount", type: "number", required: true },
          { key: "annualReturn", label: "Expected Annual Return (%)", type: "number", required: true },
          { key: "years", label: "Investment Period (Years)", type: "number", required: true },
        ],
        computations: ["lumpSumResult", "dcaResult", "difference"],
      },
    },
    {
      skillTitle: "Risk & Long-term Planning",
      title: "Retirement Projection",
      description: "Project your retirement savings based on your current contributions and timeline.",
      schemaJson: {
        fields: [
          { key: "currentAge", label: "Current Age", type: "number", required: true },
          { key: "retirementAge", label: "Target Retirement Age", type: "number", required: true },
          { key: "currentSavings", label: "Current Retirement Savings", type: "number", required: true },
          { key: "monthlyContribution", label: "Monthly Contribution", type: "number", required: true },
          { key: "annualReturn", label: "Expected Annual Return (%)", type: "number", required: true },
        ],
        computations: ["projectedBalance", "yearsToRetirement", "totalContributed", "totalGrowth"],
      },
    },
  ];

  for (const skill of insertedSkills) {
    const skillLessons = lessonsMap[skill.title] || [];
    for (let i = 0; i < skillLessons.length; i++) {
      const lessonData = skillLessons[i];
      const [lesson] = await db
        .insert(schema.lessons)
        .values({
          skillId: skill.id,
          title: lessonData.title,
          orderIndex: i,
          contentJson: lessonData.content,
          isPublished: true,
        })
        .returning();

      const skillExercises = exercisesMap[skill.title] || [];
      const matchingExercises = skillExercises.find((e) => e.lessonTitle === lessonData.title);
      if (matchingExercises) {
        for (let j = 0; j < matchingExercises.exercises.length; j++) {
          const ex = matchingExercises.exercises[j];
          await db.insert(schema.exercises).values({
            lessonId: lesson.id,
            type: ex.type,
            prompt: ex.prompt,
            optionsJson: ex.options,
            answerJson: ex.answer,
            explanation: ex.explanation,
            hint: ex.hint,
            tagsJson: [skill.title.toLowerCase()],
            orderIndex: j,
          });
        }
      }
    }

    const projectData = projectsData.find((p) => p.skillTitle === skill.title);
    if (projectData) {
      await db.insert(schema.projects).values({
        skillId: skill.id,
        title: projectData.title,
        description: projectData.description,
        schemaJson: projectData.schemaJson,
      });
    }
  }

  await db.insert(schema.achievements).values([
    { key: "first_lesson", title: "First Steps", description: "Complete your first lesson", iconName: "award" },
    { key: "streak_3", title: "On Fire", description: "Maintain a 3-day streak", iconName: "zap" },
    { key: "first_project", title: "Builder", description: "Complete your first project", iconName: "tool" },
    { key: "streak_7", title: "Dedicated Learner", description: "Maintain a 7-day streak", iconName: "trending-up" },
    { key: "xp_100", title: "Century Club", description: "Earn 100 XP", iconName: "star" },
  ]);

  console.log("Seed completed successfully!");
  await pool.end();
}

seed().catch(console.error);
