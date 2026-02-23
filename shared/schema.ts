import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(10),
  focusArea: text("focus_area"),
  level: integer("level").notNull().default(1),
  totalXp: integer("total_xp").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paths = pgTable("paths", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  iconName: text("icon_name").notNull().default("book"),
  colorHex: text("color_hex").notNull().default("#00B87C"),
});

export const skills = pgTable("skills", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  pathId: varchar("path_id")
    .notNull()
    .references(() => paths.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  iconName: text("icon_name").notNull().default("star"),
});

export const lessons = pgTable("lessons", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id")
    .notNull()
    .references(() => skills.id),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  contentJson: jsonb("content_json").notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
});

export const exercises = pgTable("exercises", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id")
    .notNull()
    .references(() => lessons.id),
  type: text("type").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: jsonb("options_json"),
  answerJson: jsonb("answer_json").notNull(),
  explanation: text("explanation").notNull(),
  hint: text("hint"),
  tagsJson: jsonb("tags_json").default([]),
  orderIndex: integer("order_index").notNull().default(0),
});

export const attempts = pgTable("attempts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  exerciseId: varchar("exercise_id")
    .notNull()
    .references(() => exercises.id),
  answerJson: jsonb("answer_json").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  skillId: varchar("skill_id")
    .notNull()
    .references(() => skills.id),
  lessonId: varchar("lesson_id")
    .notNull()
    .references(() => lessons.id),
  status: text("status").notNull().default("not_started"),
  masteryScore: real("mastery_score").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streaks = pgTable("streaks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  current: integer("current").notNull().default(0),
  longest: integer("longest").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  freezeCount: integer("freeze_count").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const xpEvents = pgTable("xp_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id")
    .notNull()
    .references(() => skills.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  schemaJson: jsonb("schema_json").notNull(),
});

export const projectSubmissions = pgTable("project_submissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  dataJson: jsonb("data_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull().default("award"),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  achievementId: varchar("achievement_id")
    .notNull()
    .references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  displayName: true,
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Path = typeof paths.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type XPEvent = typeof xpEvents.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
