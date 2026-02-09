/**
 * Admin Schools — CRUD школ. Имя, адрес, телефон.
 */
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { schools } from "../../db/schema";
import { asc, eq } from "drizzle-orm";

export const adminSchoolsRoutes = new Elysia({ prefix: "/schools" })
  .get("/", async () => {
    return db
      .select()
      .from(schools)
      .orderBy(asc(schools.name));
  })
  .get("/:id", async ({ params: { id } }) => {
    const [row] = await db.select().from(schools).where(eq(schools.id, parseInt(id)));
    if (!row) return { error: "Not found" };
    return row;
  })
  .post(
    "/",
    async ({ body }) => {
      const [created] = await db
        .insert(schools)
        .values({
          name: body.name.trim(),
          name_tm: body.name_tm?.trim() || null,
          name_ru: body.name_ru?.trim() || null,
          name_en: body.name_en?.trim() || null,
          address: body.address?.trim() || null,
          phone: body.phone?.trim() || null,
          is_active: body.is_active ?? true,
        })
        .returning();
      return created;
    },
    {
      body: t.Object({
        name: t.String(),
        name_tm: t.Optional(t.String()),
        name_ru: t.Optional(t.String()),
        name_en: t.Optional(t.String()),
        address: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body }) => {
      const [existing] = await db.select().from(schools).where(eq(schools.id, parseInt(id)));
      if (!existing) return { error: "Not found" };
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name.trim();
      if (body.name_tm !== undefined) updates.name_tm = body.name_tm?.trim() || null;
      if (body.name_ru !== undefined) updates.name_ru = body.name_ru?.trim() || null;
      if (body.name_en !== undefined) updates.name_en = body.name_en?.trim() || null;
      if (body.address !== undefined) updates.address = body.address?.trim() || null;
      if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
      if (body.is_active !== undefined) updates.is_active = body.is_active;
      if (Object.keys(updates).length === 0) return existing;
      const [updated] = await db.update(schools).set(updates).where(eq(schools.id, parseInt(id))).returning();
      return updated;
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          name_tm: t.String(),
          name_ru: t.String(),
          name_en: t.String(),
          address: t.String(),
          phone: t.String(),
          is_active: t.Boolean(),
        })
      ),
    }
  )
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(schools).where(eq(schools.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
