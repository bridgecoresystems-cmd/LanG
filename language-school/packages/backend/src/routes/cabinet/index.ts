import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { users, schools, salesCalls, userRoles } from "../../db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { ROLES } from "../../constants/roles";
import { headTeacherUserRoutes } from "./head-teacher/users";
import { headTeacherCourseRoutes } from "./head-teacher/courses";
import { headTeacherExamRoutes } from "./head-teacher/exams";
import { headTeacherGroupRoutes } from "./head-teacher/groups";
import { headTeacherMailingRoutes } from "./head-teacher/mailing";
import { headTeacherLessonRoutes } from "./head-teacher/lessons";
import { getTeacherMyGroups, getTeacherGroupIds } from "./teacher";
import { teacherLessonRoutes } from "./teacher/lessons";
import { teacherExamRoutes } from "./teacher/exams";
import { getStudentMyGroups, getStudentGroupIds } from "./student";
import { studentLessonRoutes } from "./student/lessons";
import { studentPaymentRoutes } from "./student/payments";
import { studentExamRoutes } from "./student/exams";
import { chatRoutes } from "./chat";
import { getScheduleForGroups } from "./schedule";
import { rfidRoutes } from "../rfid";
import { mailingMessages, mailingRecipients } from "../../db/schema";

// Хелпер для проверки роли (основная или дополнительная)
async function hasRole(userId: string, role: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === role || user?.role === ROLES.SUPERUSER) {
    return true;
  }
  const additionalRoles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return additionalRoles.some(r => r.role === role);
}

import { accountantRoutes } from "./accountant/payments";
import { tariffRoutes } from "./accountant/tariffs";
import { debtRoutes } from "./accountant/debts";

export const cabinetRoutes = new Elysia({ prefix: "/cabinet" })
  .onBeforeHandle((context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .use(accountantRoutes)
  .use(tariffRoutes)
  .use(debtRoutes)
  .use(chatRoutes)
  .get("/profile", async (context: any) => {
    const { user } = context;
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
        can_export_excel: users.can_export_excel,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.id, user!.id));
    if (!row) return { error: "Not found" };
    const additionalRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, user!.id));
    return {
      ...row,
      additional_roles: additionalRoles.map(r => r.role),
    };
  })
  .get("/mailing", async (context: any) => {
    const { user } = context;
    const rows = await db
      .select({
        id: mailingMessages.id,
        title: mailingMessages.title,
        content: mailingMessages.content,
        sentAt: mailingMessages.sentAt,
        isRead: mailingRecipients.isRead,
        readAt: mailingRecipients.readAt,
        receivedAt: mailingRecipients.receivedAt,
      })
      .from(mailingRecipients)
      .innerJoin(mailingMessages, eq(mailingRecipients.messageId, mailingMessages.id))
      .where(eq(mailingRecipients.recipientId, user!.id))
      .orderBy(desc(mailingMessages.sentAt));
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      is_read: r.isRead,
      sent_at: r.sentAt?.toISOString(),
      read_at: r.readAt?.toISOString(),
      received_at: r.receivedAt?.toISOString(),
    }));
  })
  .post("/mailing/:id/read", async (context: any) => {
    const { user, params: { id } } = context;
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(mailingRecipients.messageId, parseInt(id)), eq(mailingRecipients.recipientId, user!.id)));
    return { success: true };
  })
  .post("/mailing/read-all", async (context: any) => {
    const { user } = context;
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(mailingRecipients.recipientId, user!.id));
    return { success: true };
  })
  .patch("/profile", async (context: any) => {
    const { user, body, set } = context;
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.video !== undefined) updateData.video = payload.video;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user!.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })
  .post("/change-password", async (context: any) => {
    const { user, body, set } = context;
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
    const password_hash = await Bun.password.hash(newPassword, { algorithm: "bcrypt" });
    await db.update(users).set({ password_hash }).where(eq(users.id, user!.id));
    return { message: "Password changed successfully" };
  }, {
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String(),
    }),
  })
  .get("/children", async (context: any) => {
    const { user } = context;
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.parent_id, user!.id));
    return rows.map((r) => ({
      ...r,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
    }));
  })
  .get("/my-groups", async (context: any) => {
    const { user } = context;
    const [u] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user!.id))
      .limit(1);
    if (u?.role === ROLES.TEACHER) {
      return getTeacherMyGroups(user!.id);
    }
    if (u?.role === ROLES.STUDENT) {
      return getStudentMyGroups(user!.id);
    }
    return [];
  })
  .get("/schedule", async (context: any) => {
    const { user, query } = context;
    const [u] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user!.id))
      .limit(1);
    const days = Math.min(90, Math.max(1, parseInt(String(query.days || 7)) || 7));
    const groupId = query.group_id ? parseInt(String(query.group_id)) : null;

    let groupIds: number[] = [];
    if (u?.role === ROLES.TEACHER) {
      groupIds = await getTeacherGroupIds(user!.id);
    } else if (u?.role === ROLES.STUDENT) {
      groupIds = await getStudentGroupIds(user!.id);
    } else {
      return [];
    }

    return getScheduleForGroups(groupIds, days, groupId);
  }, {
    query: t.Object({
      days: t.Optional(t.String()),
      group_id: t.Optional(t.String()),
    }),
  })
  .group("/teacher", (app) =>
    app
      .onBeforeHandle(async (context: any) => {
        const { user, set } = context;
        const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
        const isTeacher = u?.role === ROLES.TEACHER || (await hasRole(user!.id, ROLES.TEACHER));
        if (!isTeacher) {
          set.status = 403;
          return { error: "Forbidden" };
        }
      })
      .use(teacherLessonRoutes)
      .use(teacherExamRoutes)
  )
  .group("/student", (app) =>
    app
      .onBeforeHandle(async (context: any) => {
        const { user, set } = context;
        const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
        const isStudent = u?.role === ROLES.STUDENT;
        if (!isStudent) {
          set.status = 403;
          return { error: "Forbidden" };
        }
      })
      .use(studentLessonRoutes)
      .use(studentPaymentRoutes)
      .use(studentExamRoutes)
  )
  .use(rfidRoutes)
  .get("/sales/calls", async (context: any) => {
    const { user, query } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return [];
    const dateFrom = query.from ? new Date(query.from as string) : undefined;
    const dateTo = query.to ? new Date(query.to as string) : undefined;
    const outcome = query.outcome as string | undefined;
    let q = db
      .select({
        id: salesCalls.id,
        firstName: salesCalls.firstName,
        lastName: salesCalls.lastName,
        phone: salesCalls.phone,
        datetime: salesCalls.datetime,
        outcome: salesCalls.outcome,
        notes: salesCalls.notes,
        created_at: salesCalls.created_at,
      })
      .from(salesCalls)
      .where(eq(salesCalls.salesManagerId, user!.id))
      .orderBy(desc(salesCalls.datetime));
    const rows = await q;
    let filtered = rows;
    if (dateFrom) filtered = filtered.filter(r => new Date(r.datetime) >= dateFrom);
    if (dateTo) filtered = filtered.filter(r => new Date(r.datetime) <= dateTo);
    if (outcome) filtered = filtered.filter(r => r.outcome === outcome);
    return filtered;
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
    }),
  })
  .get("/sales/calls/:id", async (context: any) => {
    const { user, params: { id } } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return { error: "Forbidden" };
    const [row] = await db
      .select()
      .from(salesCalls)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)))
      .limit(1);
    return row || { error: "Not found" };
  })
  .post("/sales/calls", async (context: any) => {
    const { user, body, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const { firstName, lastName, phone, datetime, outcome, notes } = body;
    const [created] = await db.insert(salesCalls).values({
      salesManagerId: user!.id,
      firstName,
      lastName,
      phone,
      datetime: new Date(datetime),
      outcome,
      notes,
    }).returning();
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
  .patch("/sales/calls/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const payload = body as any;
    const updateData: any = { updated_at: new Date() };
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.datetime !== undefined) updateData.datetime = new Date(payload.datetime);
    if (payload.outcome !== undefined) updateData.outcome = payload.outcome;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    const [updated] = await db
      .update(salesCalls)
      .set(updateData)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)))
      .returning();
    return updated || { error: "Not found" };
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
  .delete("/sales/calls/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    await db.delete(salesCalls).where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)));
    return { message: "Deleted" };
  })
  .get("/sales/stats", async (context: any) => {
    const { user } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return { error: "Forbidden" };
    const rows = await db
      .select({ outcome: salesCalls.outcome })
      .from(salesCalls)
      .where(eq(salesCalls.salesManagerId, user!.id));
    const stats = {
      total: rows.length,
      no_answer: rows.filter(r => r.outcome === 'no_answer').length,
      interested: rows.filter(r => r.outcome === 'interested').length,
      not_interested: rows.filter(r => r.outcome === 'not_interested').length,
      follow_up: rows.filter(r => r.outcome === 'follow_up').length,
    };
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const dailyRows = await db
      .select({ datetime: salesCalls.datetime, outcome: salesCalls.outcome })
      .from(salesCalls)
      .where(and(eq(salesCalls.salesManagerId, user!.id), gte(salesCalls.datetime, weekAgo)));
    const dailyStats: Record<string, any> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyStats[dateStr] = { total: 0, interested: 0 };
    }
    dailyRows.forEach(r => {
      const dateStr = r.datetime.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        if (r.outcome === 'interested') dailyStats[dateStr].interested++;
      }
    });
    const outcomeStats = [
      { label: "Нет ответа", value: stats.no_answer, color: "#9e9e9e" },
      { label: "Интересно", value: stats.interested, color: "#4caf50" },
      { label: "Не интересно", value: stats.not_interested, color: "#f44336" },
      { label: "Перезвонить", value: stats.follow_up, color: "#2196f3" },
    ];
    return {
      summary: stats,
      daily: Object.entries(dailyStats).map(([date, data]) => ({ date, ...data as any })).reverse(),
      outcomes: outcomeStats,
    };
  })
  .group("/head-teacher", (app) =>
    app
      .onBeforeHandle(async (context: any) => {
        const { user, set } = context;
        const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
        const allowedRoles = [ROLES.SUPERUSER, ROLES.HEAD_TEACHER, ROLES.TEACHER];
        if (!allowedRoles.includes(u?.role as any)) {
          const isHt = await hasRole(user!.id, ROLES.HEAD_TEACHER);
          const isTeacher = await hasRole(user!.id, ROLES.TEACHER);
          if (!isHt && !isTeacher) {
            set.status = 403;
            return { error: "Forbidden" };
          }
        }
      })
      .use(headTeacherUserRoutes)
      .use(headTeacherCourseRoutes)
      .use(headTeacherExamRoutes)
      .use(headTeacherGroupRoutes)
      .use(headTeacherMailingRoutes)
      .use(headTeacherLessonRoutes)
  );
