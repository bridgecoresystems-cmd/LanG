import { Elysia, t } from "elysia";
import { db } from "../db";
import { teachers } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/teachers", async ({ query }) => {
    const lang = query.lang || "ru";
    const allTeachers = await db.select().from(teachers);
    
    return allTeachers.map(t => ({
      id: t.id,
      first_name: t.firstName,
      last_name: t.lastName,
      full_name: `${t.firstName} ${t.lastName}`,
      username: "",
      email: "",
      specialization: (t as any)[`specialization_${lang}`] || t.specialization,
      bio: (t as any)[`bio_${lang}`] || t.bio,
      avatar: t.avatar,
      avatar_url: t.avatar,
      experience_years: t.experienceYears,
      views: t.views,
      likes: t.likes,
    }));
  }, {
    query: t.Object({ lang: t.Optional(t.String()) })
  })
  .get("/teachers/:id", async ({ params, query }) => {
    const lang = query.lang || "ru";
    const [t] = await db.select().from(teachers).where(eq(teachers.id, parseInt(params.id))).limit(1);
    if (!t) return { error: "Not found" };
    return {
      id: t.id,
      first_name: t.firstName,
      last_name: t.lastName,
      full_name: `${t.firstName} ${t.lastName}`,
      username: "",
      email: "",
      specialization: (t as any)[`specialization_${lang}`] || t.specialization,
      bio: (t as any)[`bio_${lang}`] || t.bio,
      avatar: t.avatar,
      avatar_url: t.avatar,
      experience_years: t.experienceYears,
      views: t.views,
      likes: t.likes,
    };
  }, {
    params: t.Object({ id: t.String() }),
    query: t.Object({ lang: t.Optional(t.String()) })
  });
