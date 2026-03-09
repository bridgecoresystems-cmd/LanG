import { Elysia, t } from "elysia";
import { db } from "../../../db";
import { contactMessages, courseCategories, courseSubCategories, courses, news, newsSubscribers } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";

const newsBody = t.Object({
  title_tm: t.Optional(t.String()),
  title_ru: t.Optional(t.String()),
  title_en: t.Optional(t.String()),
  content_tm: t.Optional(t.String()),
  content_ru: t.Optional(t.String()),
  content_en: t.Optional(t.String()),
  preview: t.Optional(t.String()),
  image: t.Optional(t.String()),
  is_featured: t.Optional(t.Boolean()),
});

export const adminNewsRoutes = new Elysia({ prefix: "/news" })
  .get("/subscribers", async ({ set }) => {
    try {
      return await db.select().from(newsSubscribers).orderBy(desc(newsSubscribers.createdAt));
    } catch (e) {
      console.error("Error fetching subscribers:", e);
      set.status = 200;
      return [];
    }
  })
  .delete("/subscribers/:id", async ({ params: { id } }) => {
    await db.delete(newsSubscribers).where(eq(newsSubscribers.id, parseInt(id)));
    return { success: true };
  })
  .get("/", async () => {
    return await db.select().from(news).orderBy(desc(news.created_at));
  })
  .get("/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(news).where(eq(news.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/", async ({ body }) => {
    const payload = body as any;
    const insertData = {
      title: payload.title || payload.title_ru || payload.title_tm || "",
      title_tm: payload.title_tm ?? null,
      title_ru: payload.title_ru ?? null,
      title_en: payload.title_en ?? null,
      content: payload.content || payload.content_ru || payload.content_tm || "",
      content_tm: payload.content_tm ?? null,
      content_ru: payload.content_ru ?? null,
      content_en: payload.content_en ?? null,
      preview: payload.preview ?? null,
      image: payload.image ?? null,
      is_featured: payload.is_featured ?? false,
    };
    const [created] = await db.insert(news).values(insertData).returning();
    return created;
  }, { body: newsBody })
  .patch("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, any> = {};
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.content_tm !== undefined) updateData.content_tm = payload.content_tm;
    if (payload.content_ru !== undefined) updateData.content_ru = payload.content_ru;
    if (payload.content_en !== undefined) updateData.content_en = payload.content_en;
    if (payload.preview !== undefined) updateData.preview = payload.preview;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.is_featured !== undefined) updateData.is_featured = payload.is_featured;
    updateData.updated_at = new Date();
    const [updated] = await db.update(news).set(updateData).where(eq(news.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, { body: t.Partial(newsBody) })
  .put("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, any> = {};
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.content_tm !== undefined) updateData.content_tm = payload.content_tm;
    if (payload.content_ru !== undefined) updateData.content_ru = payload.content_ru;
    if (payload.content_en !== undefined) updateData.content_en = payload.content_en;
    if (payload.preview !== undefined) updateData.preview = payload.preview;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.is_featured !== undefined) updateData.is_featured = payload.is_featured;
    updateData.updated_at = new Date();
    const [updated] = await db.update(news).set(updateData).where(eq(news.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, { body: t.Partial(newsBody) })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(news).where(eq(news.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
