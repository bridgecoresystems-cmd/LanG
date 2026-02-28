import { pgTable, text, timestamp, integer, boolean, serial, decimal, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";

// --- Enums ---
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);
export const gradeTypeEnum = pgEnum("grade_type", ["homework", "test", "participation", "exam"]);
export const gameTypeEnum = pgEnum("game_type", ["matching", "sprint", "memory"]);

// --- Schools (for DIRECTOR, HEAD_TEACHER scope) ---

export const schools = pgTable("school", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  name_tm: text("name_tm"),
  name_ru: text("name_ru"),
  name_en: text("name_en"),
  address: text("address"),
  phone: text("phone"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// --- Auth & Users ---

export const users = pgTable("user", {
  id: text("id").primaryKey(), // Lucia uses string IDs
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  email: text("email").unique(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  role: text("role").default("student").notNull(), // Основная роль
  phone: text("phone"),
  rfid_uid: text("rfid_uid"), // Mifare UID для браслета (RC522), оплата гемов
  avatar: text("avatar"),
  video: text("video"),
  is_active: boolean("is_active").default(true).notNull(),
  can_export_excel: boolean("can_export_excel").default(false).notNull(), // Право на экспорт в Excel
  can_view_all_schools: boolean("can_view_all_schools").default(false).notNull(), // Для бухгалтеров: видеть все школы
  created_at: timestamp("created_at").defaultNow().notNull(),
  // DIRECTOR, HEAD_TEACHER — привязаны к school_id
  school_id: integer("school_id").references(() => schools.id, { onDelete: "set null" }),
  // PARENT — связь: у STUDENT parent_id → родитель
  parent_id: text("parent_id").references(() => users.id, { onDelete: "set null" }),
});

// Ученик может быть в нескольких школах. users.school_id = основная, user_school = дополнительные.
export const userSchools = pgTable(
  "user_school",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_school_unique").on(t.userId, t.schoolId)]
);

// Дополнительные роли пользователя (many-to-many)
export const userRoles = pgTable("user_role", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // Дополнительная роль (не может быть SUPERUSER)
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

// --- Changelog ---

export const changelog = pgTable("changelog", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  text: text("text").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
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

// --- Mailing (Head Teacher) ---

export const mailingMessages = pgTable("mailing_message", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  recipientType: text("recipient_type").notNull(), // all, students, parents, teachers
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  isSent: boolean("is_sent").default(false).notNull(),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mailingRecipients = pgTable("mailing_recipient", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id")
    .notNull()
    .references(() => mailingMessages.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

// --- Head Teacher: Courses, Groups, Lessons ---

export const htCourses = pgTable("ht_course", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  level: text("level").notNull(),
  description: text("description"),
  durationMonths: integer("duration_months").default(3).notNull(),
  tariffId: integer("tariff_id").references(() => tariffs.id, { onDelete: "set null" }),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Экзамены и Схемы (Exam Types & Schemes) ---
export const htExamTypes = pgTable("ht_exam_type", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  writingWeight: integer("writing_weight").default(25).notNull(),
  listeningWeight: integer("listening_weight").default(25).notNull(),
  readingWeight: integer("reading_weight").default(25).notNull(),
  speakingWeight: integer("speaking_weight").default(25).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const htExamSchemes = pgTable("ht_exam_scheme", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const htExamSchemeItems = pgTable("ht_exam_scheme_item", {
  id: serial("id").primaryKey(),
  schemeId: integer("scheme_id")
    .notNull()
    .references(() => htExamSchemes.id, { onDelete: "cascade" }),
  examTypeId: integer("exam_type_id")
    .notNull()
    .references(() => htExamTypes.id, { onDelete: "cascade" }),
  weightPercentage: integer("weight_percentage").notNull(), // Напр. 20%
  order: integer("order").default(1).notNull(),
});

export const htGroups = pgTable("ht_group", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id")
    .notNull()
    .references(() => htCourses.id, { onDelete: "cascade" }),
  examSchemeId: integer("exam_scheme_id")
    .references(() => htExamSchemes.id, { onDelete: "set null" }),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "set null" }),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "set null" }),
  maxStudents: integer("max_students").default(15).notNull(),
  timeSlot: text("time_slot"), // A, B, C
  weekDays: text("week_days"), // 1 = Mon/Wed/Fri, 2 = Tue/Thu/Sat
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }),
  schedule: text("schedule"), // JSON
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const htGroupStudents = pgTable(
  "ht_group_student",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => htGroups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tariffId: integer("tariff_id").references(() => tariffs.id, { onDelete: "set null" }),
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ht_group_student_unique").on(t.groupId, t.userId)]
);

export const htLessons = pgTable("ht_lesson", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => htGroups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  lessonDate: timestamp("lesson_date", { withTimezone: true, mode: "date" }).notNull(),
  durationMinutes: integer("duration_minutes").default(90).notNull(),
  homework: text("homework"),
  materials: text("materials"), // JSON array
  lessonPlan: text("lesson_plan"), // Конспект урока (для завуча)
  lessonNotes: text("lesson_notes"), // Заметки учителя по уроку
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  entryTime: timestamp("entry_time"), // Время прихода (из RFID)
  exitTime: timestamp("exit_time"),   // Время ухода (из RFID)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("ht_attendance_lesson_user_unique").on(t.lessonId, t.userId)
]);

// Лог всех сканирований RFID (входы, выходы, покупки)
export const rfidLogs = pgTable("rfid_log", {
  id: serial("id").primaryKey(),
  rfidUid: text("rfid_uid").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  deviceId: text("device_id").notNull(), // ID сканера (напр. "gate_1", "canteen_1")
  action: text("action").notNull(), // "entry", "exit", "payment"
  amount: decimal("amount", { precision: 10, scale: 2 }), // Для оплаты в кантине
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Оценки (Grades - для обычных уроков) ---
export const htGrades = pgTable("ht_grade", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => htLessons.id, { onDelete: "cascade" }),
  groupId: integer("group_id")
    .notNull()
    .references(() => htGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // homework, test, participation
  grade: text("grade").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Экзаменационные оценки (Exam Grades) ---
export const htExamGrades = pgTable("ht_exam_grade", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => htGroups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  schemeItemId: integer("scheme_item_id")
    .notNull()
    .references(() => htExamSchemeItems.id, { onDelete: "cascade" }),
  writing: decimal("writing", { precision: 5, scale: 2 }),
  listening: decimal("listening", { precision: 5, scale: 2 }),
  reading: decimal("reading", { precision: 5, scale: 2 }),
  speaking: decimal("speaking", { precision: 5, scale: 2 }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("ht_exam_grade_unique").on(t.userId, t.groupId, t.schemeItemId)
]);

// --- Игры (Games) ---
export const htGames = pgTable("ht_game", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => htGroups.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id")
    .references(() => htLessons.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // matching, sprint, memory
  data: text("data"), // JSON configuration (words, translations)
  isActive: boolean("is_active").default(true).notNull(),
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

// --- Sales Calls ---

export const salesCalls = pgTable("sales_call", {
  id: serial("id").primaryKey(),
  salesManagerId: text("sales_manager_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  datetime: timestamp("datetime").notNull(),
  outcome: text("outcome").notNull(), // no_answer, interested, not_interested, follow_up
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// --- Payments (Bookkeeper) ---

export const payments = pgTable("payment", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "set null" }),
  groupId: integer("group_id").references(() => htGroups.id, { onDelete: "set null" }),
  payerName: text("payer_name"), // For manual entry if not a student
  payerPhone: text("payer_phone"), // For manual entry
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // cash, card, bank
  purpose: text("purpose").notNull(), // "Course English", "Translation"
  comment: text("comment"),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "set null" }),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  isPartial: boolean("is_partial").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Tariffs (Bookkeeper) ---

export const tariffs = pgTable("tariff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // course_adult, course_kid, translation, certificate, other
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
