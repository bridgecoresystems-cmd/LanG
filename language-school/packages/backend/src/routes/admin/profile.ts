import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const adminProfileRoutes = new Elysia()
  .get("/profile", async ({ user }) => {
    if (!user) return { error: "Unauthorized" };
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!dbUser) return { error: "User not found" };
    const { password_hash, ...profile } = dbUser;
    return profile;
  })
  .patch("/profile", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (payload.first_name !== undefined) updateData.first_name = payload.first_name;
    if (payload.last_name !== undefined) updateData.last_name = payload.last_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })
  .post("/change-password", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const { currentPassword, newPassword } = body;

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));

    if (!dbUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    const isValid = await Bun.password.verify(currentPassword, dbUser.password_hash);
    if (!isValid) {
      set.status = 400;
      return { error: "Invalid current password" };
    }

    const newHash = await Bun.password.hash(newPassword);

    await db.update(users)
      .set({ password_hash: newHash })
      .where(eq(users.id, user.id));

    return { message: "Password changed successfully" };
  }, {
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String()
    })
  });
