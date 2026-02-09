import { Elysia } from "elysia";
import { db } from "../../../db";
import { courseCategories, courseSubCategories } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";

export const adminSubcategoriesRoutes = new Elysia({ prefix: "/subcategories" })
  .get("/", async () => {
    const rows = await db.select({
      id: courseSubCategories.id,
      categoryId: courseSubCategories.categoryId,
      name: courseSubCategories.name,
      name_tm: courseSubCategories.name_tm,
      name_ru: courseSubCategories.name_ru,
      name_en: courseSubCategories.name_en,
      description: courseSubCategories.description,
      image: courseSubCategories.image,
      order: courseSubCategories.order,
      is_active: courseSubCategories.is_active,
      category_name_tm: courseCategories.name_tm,
      category_name_ru: courseCategories.name_ru,
      category_name_en: courseCategories.name_en,
    }).from(courseSubCategories)
      .leftJoin(courseCategories, eq(courseSubCategories.categoryId, courseCategories.id))
      .orderBy(desc(courseSubCategories.order));
    return rows;
  })
  .get("/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(courseSubCategories).where(eq(courseSubCategories.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/", async ({ body }) => {
    const p = body as any;
    const [created] = await db.insert(courseSubCategories).values({
      categoryId: p.category_id ?? p.categoryId,
      name: p.name_ru || p.name_tm || p.name_en || "",
      name_tm: p.name_tm,
      name_ru: p.name_ru,
      name_en: p.name_en,
      description: p.description,
      image: p.image,
      order: p.order ?? 0,
      is_active: p.is_active ?? true,
    }).returning();
    return created;
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.name_tm !== undefined) updateData.name_tm = payload.name_tm;
    if (payload.name_ru !== undefined) updateData.name_ru = payload.name_ru;
    if (payload.name_en !== undefined) updateData.name_en = payload.name_en;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.order !== undefined) updateData.order = payload.order;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courseSubCategories).set(updateData).where(eq(courseSubCategories.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .put("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.name_tm !== undefined) updateData.name_tm = payload.name_tm;
    if (payload.name_ru !== undefined) updateData.name_ru = payload.name_ru;
    if (payload.name_en !== undefined) updateData.name_en = payload.name_en;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.order !== undefined) updateData.order = payload.order;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courseSubCategories).set(updateData).where(eq(courseSubCategories.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(courseSubCategories).where(eq(courseSubCategories.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
