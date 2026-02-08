import { db } from "./src/db";
import { courseCategories, courseSubCategories, news, teachers, users } from "./src/db/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Categories
  const categories = await db.insert(courseCategories).values([
    {
      name: "English",
      name_en: "English",
      name_ru: "Английский",
      name_tm: "Iňlis dili",
      icon: "language",
      order: 1,
    },
    {
      name: "German",
      name_en: "German",
      name_ru: "Немецкий",
      name_tm: "Nemes dili",
      icon: "language",
      order: 2,
    },
  ]).returning();

  // 2. Subcategories
  await db.insert(courseSubCategories).values([
    {
      categoryId: categories[0].id,
      name: "General English",
      name_en: "General English",
      name_ru: "Общий английский",
      name_tm: "Umumy iňlis dili",
    },
  ]);

  // 3. News
  await db.insert(news).values([
    {
      title: "Welcome to LanG!",
      title_en: "Welcome to LanG!",
      title_ru: "Добро пожаловать в LanG!",
      title_tm: "LanG-e hoş geldiňiz!",
      content: "We are excited to launch our new website.",
      content_en: "We are excited to launch our new website.",
      content_ru: "Мы рады запустить наш новый сайт.",
      content_tm: "Täze saýtymyzy açýandygymyza örän şat.",
    },
  ]);

  // 4. Teachers
  await db.insert(teachers).values([
    {
      firstName: "Batyr",
      lastName: "Developer",
      specialization: "Full Stack",
      experienceYears: 5,
      bio: "Loves Bun and Elysia.",
    },
  ]);

  // 5. Admin User
  const adminPasswordHash = await Bun.password.hash("admin123");
  await db.insert(users).values({
    id: "admin_id_1",
    username: "admin",
    password_hash: adminPasswordHash,
    email: "admin@example.com",
    role: "admin",
  });

  console.log("✅ Seeding complete! Admin: admin / admin123");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
