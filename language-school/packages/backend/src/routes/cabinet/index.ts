/**
 * Cabinet API — личные кабинеты для STUDENT, TEACHER, PARENT и др.
 * Доступ: любой аутентифицированный пользователь. user приходит из authMiddleware.
 */
import { Elysia } from "elysia";
import { db } from "../../db";
import { users, schools } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ROLES } from "../../constants/roles";

export const cabinetRoutes = new Elysia({ prefix: "/cabinet" })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/profile", async ({ user }) => {
    const [row] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        avatar: users.avatar,
        video: users.video,
        role: users.role,
        school_id: users.school_id,
        parent_id: users.parent_id,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.id, user!.id));
    if (!row) return { error: "Not found" };
    return row;
  })
  .patch("/profile", async ({ user, body, set }) => {
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (payload.first_name !== undefined) updateData.first_name = payload.first_name;
    if (payload.last_name !== undefined) updateData.last_name = payload.last_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.video !== undefined) updateData.video = payload.video;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user!.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })
  // PARENT: список детей (пользователи с parent_id = current user)
  .get("/children", async ({ user }) => {
    if (user!.role !== ROLES.PARENT && user!.role !== ROLES.SUPERUSER) {
      return [];
    }
    const children = await db
      .select({
        id: users.id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.parent_id, user!.id));
    return children;
  });
