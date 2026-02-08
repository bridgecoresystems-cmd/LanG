import { pgTable, text, timestamp, integer, boolean, serial, decimal } from "drizzle-orm/pg-core";

// --- Auth & Users ---

export const users = pgTable("user", {
  id: text("id").primaryKey(), // Lucia uses string IDs
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  email: text("email").unique(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  role: text("role").default("student").notNull(), // student, teacher, director, admin, etc.
  phone: text("phone"),
  avatar: text("avatar"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

// --- Landing & Courses ---

export const courseCategories = pgTable("course_category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // We can add i18n later or use JSONB
  name_tm: text("name_tm"),
  name_ru: text("name_ru"),
  name_en: text("name_en"),
  description: text("description"),
  description_tm: text("description_tm"),
  description_ru: text("description_ru"),
  description_en: text("description_en"),
  image: text("image"),
  icon: text("icon").default("school").notNull(),
  order: integer("order").default(0).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
});

export const courseSubCategories = pgTable("course_subcategory", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => courseCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  name_tm: text("name_tm"),
  name_ru: text("name_ru"),
  name_en: text("name_en"),
  description: text("description"),
  image: text("image"),
  order: integer("order").default(0).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
});

export const courses = pgTable("course", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => courseCategories.id),
  subcategoryId: integer("subcategory_id")
    .notNull()
    .references(() => courseSubCategories.id),
  title: text("title").notNull(),
  title_tm: text("title_tm"),
  title_ru: text("title_ru"),
  title_en: text("title_en"),
  description: text("description").notNull(),
  description_tm: text("description_tm"),
  description_ru: text("description_ru"),
  description_en: text("description_en"),
  image: text("image"),
  duration_weeks: integer("duration_weeks").default(0).notNull(),
  hours_per_week: integer("hours_per_week").default(0).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discount_price: decimal("discount_price", { precision: 10, scale: 2 }),
  is_active: boolean("is_active").default(true).notNull(),
});

// --- Contact Messages ---

export const contactMessages = pgTable("contact_message", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  likes: integer("likes").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// --- News ---

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  title_tm: text("title_tm"),
  title_ru: text("title_ru"),
  title_en: text("title_en"),
  content: text("content").notNull(),
  content_tm: text("content_tm"),
  content_ru: text("content_ru"),
  content_en: text("content_en"),
  preview: text("preview"),
  image: text("image"),
  views: integer("views").default(0).notNull(),
  is_featured: boolean("is_featured").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// --- Teachers ---

export const teachers = pgTable("teacher", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  specialization: text("specialization"),
  specialization_tm: text("specialization_tm"),
  specialization_ru: text("specialization_ru"),
  specialization_en: text("specialization_en"),
  experienceYears: integer("experience_years").default(0).notNull(),
  bio: text("bio"),
  bio_tm: text("bio_tm"),
  bio_ru: text("bio_ru"),
  bio_en: text("bio_en"),
  avatar: text("avatar"),
  video: text("video"),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  hireDate: timestamp("hire_date"),
});
