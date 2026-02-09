import { Elysia } from "elysia";
import { db } from "../../../db";
import { courseCategories, courseSubCategories, courses } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const adminCoursesRoutes = new Elysia({ prefix: "/courses" })
  .get("/", async () => {
    const rows = await db.select({
      id: courses.id,
      categoryId: courses.categoryId,
      subcategoryId: courses.subcategoryId,
      title: courses.title,
      title_tm: courses.title_tm,
      title_ru: courses.title_ru,
      title_en: courses.title_en,
      description: courses.description,
      image: courses.image,
      duration_weeks: courses.duration_weeks,
      hours_per_week: courses.hours_per_week,
      price: courses.price,
      discount_price: courses.discount_price,
      is_active: courses.is_active,
      category_name_tm: courseCategories.name_tm,
      category_name_ru: courseCategories.name_ru,
      category_name_en: courseCategories.name_en,
      subcategory_name_tm: courseSubCategories.name_tm,
      subcategory_name_ru: courseSubCategories.name_ru,
      subcategory_name_en: courseSubCategories.name_en,
    }).from(courses)
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .leftJoin(courseSubCategories, eq(courses.subcategoryId, courseSubCategories.id));
    return rows;
  })
  .get("/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(courses).where(eq(courses.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/", async ({ body }) => {
    const payload = body as any;
    const [created] = await db.insert(courses).values({
      categoryId: payload.category_id,
      subcategoryId: payload.subcategory_id,
      title: payload.title || payload.title_ru || payload.title_tm || "",
      title_tm: payload.title_tm,
      title_ru: payload.title_ru,
      title_en: payload.title_en,
      description: payload.description || payload.description_ru || payload.description_tm || "",
      description_tm: payload.description_tm,
      description_ru: payload.description_ru,
      description_en: payload.description_en,
      image: payload.image,
      duration_weeks: payload.duration_weeks ?? 0,
      hours_per_week: payload.hours_per_week ?? 0,
      price: payload.price ?? "0",
      discount_price: payload.discount_price,
      is_active: payload.is_active ?? true,
    }).returning();
    return created;
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.subcategory_id !== undefined) updateData.subcategoryId = payload.subcategory_id;
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.description_tm !== undefined) updateData.description_tm = payload.description_tm;
    if (payload.description_ru !== undefined) updateData.description_ru = payload.description_ru;
    if (payload.description_en !== undefined) updateData.description_en = payload.description_en;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.duration_weeks !== undefined) updateData.duration_weeks = payload.duration_weeks;
    if (payload.hours_per_week !== undefined) updateData.hours_per_week = payload.hours_per_week;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.discount_price !== undefined) updateData.discount_price = payload.discount_price;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courses).set(updateData).where(eq(courses.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .put("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.subcategory_id !== undefined) updateData.subcategoryId = payload.subcategory_id;
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.description_tm !== undefined) updateData.description_tm = payload.description_tm;
    if (payload.description_ru !== undefined) updateData.description_ru = payload.description_ru;
    if (payload.description_en !== undefined) updateData.description_en = payload.description_en;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.duration_weeks !== undefined) updateData.duration_weeks = payload.duration_weeks;
    if (payload.hours_per_week !== undefined) updateData.hours_per_week = payload.hours_per_week;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.discount_price !== undefined) updateData.discount_price = payload.discount_price;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courses).set(updateData).where(eq(courses.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(courses).where(eq(courses.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
