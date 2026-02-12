/**
 * Cabinet API — личные кабинеты для STUDENT, TEACHER, PARENT и др.
 * Доступ: любой аутентифицированный пользователь. user приходит из authMiddleware.
 */
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users, schools, salesCalls } from "../../db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
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
    // Имя и фамилия не могут быть изменены через профиль
    // if (payload.first_name !== undefined) updateData.first_name = payload.first_name;
    // if (payload.last_name !== undefined) updateData.last_name = payload.last_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    // Аватар не может быть изменен через профиль (безопасность)
    // if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.video !== undefined) updateData.video = payload.video;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user!.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })
  .post("/change-password", async ({ user, body, set }) => {
    const { currentPassword, newPassword } = body;
    const [dbUser] = await db.select().from(users).where(eq(users.id, user!.id));
    if (!dbUser) {
      set.status = 404;
      return { error: "User not found" };
    }
    const isValid = await Bun.password.verify(currentPassword, dbUser.password_hash);
    if (!isValid) {
      set.status = 400;
      return { error: "Invalid current password" };
    }
    if (!newPassword || newPassword.length < 6) {
      set.status = 400;
      return { error: "New password must be at least 6 characters" };
    }
    const newHash = await Bun.password.hash(newPassword);
    await db.update(users).set({ password_hash: newHash }).where(eq(users.id, user!.id));
    return { message: "Password changed successfully" };
  }, {
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String({ minLength: 6 }),
    }),
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
  })
  // SALES: управление звонками
  .get("/sales/calls", async ({ user, query }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      return [];
    }
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;
    const outcome = query.outcome as string | undefined;

    let conditions: any[] = [eq(salesCalls.salesManagerId, user!.id)];
    if (dateFrom) {
      conditions.push(gte(salesCalls.datetime, new Date(dateFrom)));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(salesCalls.datetime, toDate));
    }
    if (outcome) {
      conditions.push(eq(salesCalls.outcome, outcome));
    }

    const rows = await db
      .select()
      .from(salesCalls)
      .where(and(...conditions))
      .orderBy(desc(salesCalls.datetime));
    return rows;
  }, {
    query: t.Object({
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
    }),
  })
  .get("/sales/calls/:id", async ({ user, params: { id } }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      return { error: "Forbidden" };
    }
    const [item] = await db
      .select()
      .from(salesCalls)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/sales/calls", async ({ user, body, set }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const { firstName, lastName, phone, datetime, outcome, notes } = body as {
      firstName: string;
      lastName: string;
      phone: string;
      datetime: string | Date;
      outcome: string;
      notes?: string;
    };
    
    let datetimeValue: Date;
    if (datetime instanceof Date) {
      datetimeValue = datetime;
    } else if (typeof datetime === 'string') {
      datetimeValue = new Date(datetime);
    } else {
      set.status = 400;
      return { error: "Invalid datetime format" };
    }
    
    if (isNaN(datetimeValue.getTime())) {
      set.status = 400;
      return { error: "Invalid datetime value" };
    }
    
    const [created] = await db
      .insert(salesCalls)
      .values({
        salesManagerId: user!.id,
        firstName,
        lastName,
        phone,
        datetime: datetimeValue,
        outcome,
        notes: notes || null,
      })
      .returning();
    return created;
  }, {
    body: t.Object({
      firstName: t.String(),
      lastName: t.String(),
      phone: t.String(),
      datetime: t.String(),
      outcome: t.String(),
      notes: t.Optional(t.String()),
    }),
  })
  .patch("/sales/calls/:id", async ({ user, params: { id }, body, set }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const [existing] = await db
      .select()
      .from(salesCalls)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)));
    if (!existing) {
      set.status = 404;
      return { error: "Not found" };
    }
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.datetime !== undefined) {
      const datetimeValue = typeof payload.datetime === 'string' ? new Date(payload.datetime) : payload.datetime;
      if (datetimeValue instanceof Date && !isNaN(datetimeValue.getTime())) {
        updateData.datetime = datetimeValue;
      } else {
        set.status = 400;
        return { error: "Invalid datetime format" };
      }
    }
    if (payload.outcome !== undefined) updateData.outcome = payload.outcome;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    updateData.updated_at = new Date();
    const [updated] = await db
      .update(salesCalls)
      .set(updateData)
      .where(eq(salesCalls.id, parseInt(id)))
      .returning();
    return updated;
  }, {
    body: t.Object({
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      datetime: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
      notes: t.Optional(t.String()),
    }),
  })
  .delete("/sales/calls/:id", async ({ user, params: { id }, set }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const [existing] = await db
      .select()
      .from(salesCalls)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)));
    if (!existing) {
      set.status = 404;
      return { error: "Not found" };
    }
    await db.delete(salesCalls).where(eq(salesCalls.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })
  .get("/sales/stats", async ({ user }) => {
    if (user!.role !== ROLES.SALES && user!.role !== ROLES.SUPERUSER) {
      return { error: "Forbidden" };
    }
    const allCalls = await db
      .select()
      .from(salesCalls)
      .where(eq(salesCalls.salesManagerId, user!.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayCalls = allCalls.filter(
      (call) => call.datetime && new Date(call.datetime) >= today && new Date(call.datetime) < tomorrow
    );
    const weekCalls = allCalls.filter(
      (call) => call.datetime && new Date(call.datetime) >= weekAgo
    );

    const outcomeStats = {
      no_answer: allCalls.filter((c) => c.outcome === "no_answer").length,
      interested: allCalls.filter((c) => c.outcome === "interested").length,
      not_interested: allCalls.filter((c) => c.outcome === "not_interested").length,
      follow_up: allCalls.filter((c) => c.outcome === "follow_up").length,
    };

    return {
      total: allCalls.length,
      today: todayCalls.length,
      last7Days: weekCalls.length,
      outcomes: outcomeStats,
    };
  });
