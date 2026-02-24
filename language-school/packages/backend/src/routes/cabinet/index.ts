import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { users, schools, salesCalls, userRoles, userSchools, htCourses, htGroups, htGroupStudents, htLessons, htGrades } from "../../db/schema";
import { eq, ne, desc, and, gte, gt, lte, or, inArray, asc } from "drizzle-orm";
import { ROLES } from "../../constants/roles";
import { headTeacherUserRoutes } from "./head-teacher/users";
import { headTeacherCourseRoutes } from "./head-teacher/courses";
import { headTeacherExamRoutes } from "./head-teacher/exams";
import { headTeacherGroupRoutes } from "./head-teacher/groups";
import { headTeacherMailingRoutes } from "./head-teacher/mailing";
import { headTeacherLessonRoutes } from "./head-teacher/lessons";

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

export const cabinetRoutes = new Elysia({ prefix: "/cabinet" })
  .onBeforeHandle((context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
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
    const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
    if (u?.role === ROLES.TEACHER) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          courseName: htCourses.name,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
        })
        .from(htGroups)
        .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .where(eq(htGroups.teacherId, user!.id))
        .orderBy(desc(htGroups.createdAt));
      return rows;
    } else if (u?.role === ROLES.STUDENT) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          courseName: htCourses.name,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
          startDate: htGroups.startDate,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          teacherFirstName: users.first_name,
          teacherLastName: users.last_name,
          teacherUsername: users.username,
          schoolName: schools.name,
        })
        .from(htGroupStudents)
        .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
        .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .leftJoin(users, eq(htGroups.teacherId, users.id))
        .leftJoin(schools, eq(htGroups.schoolId, schools.id))
        .where(eq(htGroupStudents.userId, user!.id))
        .orderBy(desc(htGroups.createdAt));

      const now = new Date();
      const enriched = await Promise.all(rows.map(async (r) => {
        const groupId = r.id;
        const allLessons = await db.select({ id: htLessons.id, lessonDate: htLessons.lessonDate, title: htLessons.title })
          .from(htLessons).where(eq(htLessons.groupId, groupId));
        const totalLessons = allLessons.length;
        const completedLessons = allLessons.filter((l) => l.lessonDate && new Date(l.lessonDate) < now).length;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const nextLessonRows = await db.select({ id: htLessons.id, title: htLessons.title, lessonDate: htLessons.lessonDate })
          .from(htLessons)
          .where(and(eq(htLessons.groupId, groupId), gt(htLessons.lessonDate, now)))
          .orderBy(asc(htLessons.lessonDate))
          .limit(1);
        const nextLesson = nextLessonRows[0] ? {
          id: nextLessonRows[0].id,
          title: nextLessonRows[0].title,
          date: nextLessonRows[0].lessonDate?.toISOString(),
        } : null;

        const gradeRows = await db.select({ grade: htGrades.grade })
          .from(htGrades)
          .where(and(eq(htGrades.groupId, groupId), eq(htGrades.userId, user!.id)));
        let averageGrade: number | null = null;
        if (gradeRows.length > 0) {
          const nums = gradeRows.map((g) => parseFloat(g.grade || "0")).filter((n) => !isNaN(n));
          if (nums.length > 0) {
            averageGrade = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
          }
        }

        const startDate = r.startDate ? new Date(r.startDate) : null;
        const endDate = r.endDate ? new Date(r.endDate) : null;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let isActive = r.isActive ?? true;
        if (startDate && today < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) isActive = false;
        if (endDate && today > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) isActive = false;

        const teacherName = [r.teacherFirstName, r.teacherLastName].filter(Boolean).join(" ") || r.teacherUsername || null;

        return {
          id: r.id,
          name: r.name,
          course_name: r.courseName,
          teacher_name: teacherName,
          school_name: r.schoolName || null,
          start_date: r.startDate?.toISOString()?.slice(0, 10) || null,
          end_date: r.endDate?.toISOString()?.slice(0, 10) || null,
          time_slot: r.timeSlot,
          week_days: r.weekDays,
          is_active: isActive,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress,
          next_lesson: nextLesson,
          average_grade: averageGrade,
          total_paid: 0,
        };
      }));
      return enriched;
    }
    return [];
  })
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
