import { Elysia, t } from "elysia";
import { db } from "../../db";
import { changelog } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export const adminChangelogRoutes = new Elysia({ prefix: "/changelog" })
  .get("/", async () => {
    return await db.select().from(changelog).orderBy(desc(changelog.date));
  })
  .post("/", async ({ body }) => {
    const [created] = await db.insert(changelog).values({
      date: new Date(body.date),
      text: body.text
    }).returning();
    return created;
  }, {
    body: t.Object({
      date: t.String(),
      text: t.String()
    })
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const payload = body as { date?: string; text?: string };
    const updateData: Record<string, unknown> = {};
    if (payload.date !== undefined) updateData.date = new Date(payload.date);
    if (payload.text !== undefined) updateData.text = payload.text;
    const [updated] = await db.update(changelog).set(updateData).where(eq(changelog.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, {
    body: t.Partial(t.Object({
      date: t.String(),
      text: t.String()
    }))
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(changelog).where(eq(changelog.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
