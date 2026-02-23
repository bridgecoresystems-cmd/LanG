import { pgTable, text, timestamp, integer, boolean, serial, decimal, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { users, htGroups, htLessons } from "./schema";

// --- Посещаемость (Attendance) ---
export const htAttendance = pgTable("ht_attendance", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => htLessons.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // present, absent, late, excused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("ht_attendance_lesson_user_unique").on(t.lessonId, t.userId)
]);

// --- Оценки / Экзамены (Grades) ---
export const htGrades = pgTable("ht_grade", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => htGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // exam, homework, test, participation
  title: text("title").notNull(),
  grade: text("grade").notNull(), // A, B, C, 100, etc.
  maxGrade: text("max_grade"),
  weight: integer("weight").default(1).notNull(),
  comment: text("comment"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Игры (Games) ---
export const htGames = pgTable("ht_game", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => htGroups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // quiz, flashcards, word-search, etc.
  config: text("config"), // JSON configuration
  isPublic: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Результаты игр (Game Results) ---
export const htGameResults = pgTable("ht_game_result", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => htGames.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  data: text("data"), // JSON detailed results
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
