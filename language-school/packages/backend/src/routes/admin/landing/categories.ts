import { Elysia, t } from "elysia";
import { db } from "../../../db";
import { courseCategories } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const adminCategoriesRoutes = new Elysia({ prefix: "/categories" })
  .get("/", async () => {
    return await db.select().from(courseCategories);
  })
  .get("/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(courseCategories).where(eq(courseCategories.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/", async ({ body }) => {
    return await db.insert(courseCategories).values(body).returning();
  }, {
    body: t.Object({
      name: t.String(),
      name_tm: t.Optional(t.String()),
      name_ru: t.Optional(t.String()),
      name_en: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      image: t.Optional(t.String()),
      order: t.Optional(t.Number()),
      is_active: t.Optional(t.Boolean())
    })
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    return await db.update(courseCategories)
      .set(body)
      .where(eq(courseCategories.id, parseInt(id)))
      .returning();
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      name_tm: t.String(),
      name_ru: t.String(),
      name_en: t.String(),
      icon: t.String(),
      image: t.String(),
      order: t.Number(),
      is_active: t.Boolean()
    }))
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(courseCategories).where(eq(courseCategories.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
