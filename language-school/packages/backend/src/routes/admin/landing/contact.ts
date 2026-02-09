import { Elysia, t } from "elysia";
import { db } from "../../../db";
import { contactMessages } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";

export const adminContactRoutes = new Elysia({ prefix: "/contact-messages" })
  .get("/", async ({ query }) => {
    const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.created_at));
    const status = query.status as string | undefined;
    if (status) {
      return rows.filter(r => r.status === status);
    }
    return rows;
  }, {
    query: t.Object({ status: t.Optional(t.String()) })
  })
  .get("/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.message !== undefined) updateData.message = payload.message;
    if (payload.status !== undefined) updateData.status = payload.status;
    const [updated] = await db.update(contactMessages).set(updateData).where(eq(contactMessages.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    if (updated.status === "approved") {
      const { broadcastToPublic } = await import("../../../ws/contact-broadcast");
      broadcastToPublic({
        type: "message_approved",
        message: {
          id: updated.id,
          name: updated.name,
          message: updated.message,
          likes: updated.likes || 0,
          created_at: updated.created_at,
        },
      });
    }
    return updated;
  })
  .post("/:id/toggle-approval", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    const newStatus = item.status === "approved" ? "pending" : "approved";
    const [updated] = await db.update(contactMessages).set({ status: newStatus }).where(eq(contactMessages.id, parseInt(id))).returning();
    if (updated && newStatus === "approved") {
      const { broadcastToPublic } = await import("../../../ws/contact-broadcast");
      broadcastToPublic({
        type: "message_approved",
        message: {
          id: updated.id,
          name: updated.name,
          message: updated.message,
          likes: updated.likes || 0,
          created_at: updated.created_at,
        },
      });
    }
    return updated;
  })
  .post("/:id/like", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    const newLikes = (item.likes || 0) + 1;
    const [updated] = await db.update(contactMessages).set({ likes: newLikes }).where(eq(contactMessages.id, parseInt(id))).returning();
    return updated;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
