import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { users, htLessons, htGroups, htAttendance, htGrades, htExamGrades, htGames } from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

export const headTeacherLessonRoutes = new Elysia()
  .get("/teachers", async (context: any) => {
    const { user } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const rows = u?.role === ROLES.SUPERUSER
      ? await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
          .from(users).where(eq(users.role, ROLES.TEACHER))
      : await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
          .from(users).where(and(eq(users.role, ROLES.TEACHER), eq(users.school_id, u!.school_id!)));
    return rows.map((r) => ({
      id: r.id,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
      username: r.username,
    }));
  })
  .get("/lessons", async (context: any) => {
    const { user, query } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const groupId = query.group_id ? parseInt(String(query.group_id)) : null;
    const baseSelect = () => db.select({
      id: htLessons.id,
      groupId: htLessons.groupId,
      title: htLessons.title,
      description: htLessons.description,
      lessonDate: htLessons.lessonDate,
      durationMinutes: htLessons.durationMinutes,
      groupName: htGroups.name,
    }).from(htLessons)
      .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id));
    const rows = groupId
      ? await baseSelect().where(eq(htLessons.groupId, groupId)).orderBy(desc(htLessons.lessonDate))
      : u?.role === ROLES.SUPERUSER
        ? await baseSelect().orderBy(desc(htLessons.lessonDate))
        : await baseSelect().where(eq(htGroups.schoolId, u!.school_id!)).orderBy(desc(htLessons.lessonDate));
    return rows.map((r) => ({
      id: r.id,
      group_id: r.groupId,
      group_name: r.groupName,
      title: r.title,
      description: r.description,
      lesson_date: r.lessonDate?.toISOString(),
      duration_minutes: r.durationMinutes,
    }));
  })
  .get("/lessons/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select({
      id: htLessons.id,
      groupId: htLessons.groupId,
      title: htLessons.title,
      description: htLessons.description,
      lessonDate: htLessons.lessonDate,
      durationMinutes: htLessons.durationMinutes,
      homework: htLessons.homework,
      materials: htLessons.materials,
      lessonPlan: htLessons.lessonPlan,
      lessonNotes: htLessons.lessonNotes,
      schoolId: htGroups.schoolId,
    }).from(htLessons)
      .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
      .where(eq(htLessons.id, parseInt(id)))
      .limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    return {
      id: row.id,
      group_id: row.groupId,
      title: row.title,
      description: row.description,
      lesson_date: row.lessonDate?.toISOString(),
      duration_minutes: row.durationMinutes,
      homework: row.homework,
      materials: row.materials,
      lesson_plan: row.lessonPlan,
      lesson_notes: row.lessonNotes,
    };
  })
  .post("/lessons", async (context: any) => {
    const { user, body } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [group] = await db.select().from(htGroups).where(eq(htGroups.id, body.group_id)).limit(1);
    if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
      throw new Error("Group not found or access denied");
    }
    const [created] = await db.insert(htLessons).values({
      groupId: body.group_id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      lessonDate: new Date(body.lesson_date),
      durationMinutes: body.duration_minutes || 90,
      homework: body.homework?.trim() || null,
      materials: body.materials ? JSON.stringify(body.materials) : null,
    }).returning();
    return {
      id: created.id,
      group_id: created.groupId,
      title: created.title,
      lesson_date: created.lessonDate?.toISOString(),
      duration_minutes: created.durationMinutes,
      created_at: created.createdAt?.toISOString(),
    };
  }, {
    body: t.Object({
      group_id: t.Number(),
      title: t.String(),
      description: t.Optional(t.String()),
      lesson_date: t.String(),
      duration_minutes: t.Optional(t.Number()),
      homework: t.Optional(t.String()),
      materials: t.Optional(t.Any()),
    }),
  })
  .patch("/lessons/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select({ id: htLessons.id, groupId: htLessons.groupId, schoolId: htGroups.schoolId })
      .from(htLessons).leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
      .where(eq(htLessons.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.title !== undefined) updateData.title = String(payload.title).trim();
    if (payload.description !== undefined) updateData.description = (payload.description as string)?.trim() || null;
    if (payload.lesson_date !== undefined) updateData.lessonDate = new Date(payload.lesson_date as string);
    if (payload.duration_minutes !== undefined) updateData.durationMinutes = payload.duration_minutes as number;
    if (payload.homework !== undefined) updateData.homework = (payload.homework as string)?.trim() || null;
    if (payload.materials !== undefined) updateData.materials = payload.materials ? JSON.stringify(payload.materials) : null;
    if (payload.lesson_plan !== undefined) updateData.lessonPlan = (payload.lesson_plan as string)?.trim() || null;
    if (payload.lesson_notes !== undefined) updateData.lessonNotes = (payload.lesson_notes as string)?.trim() || null;
    const [updated] = await db.update(htLessons).set(updateData as any).where(eq(htLessons.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      lesson_date: updated.lessonDate?.toISOString(),
      duration_minutes: updated.durationMinutes,
      updated_at: updated.updatedAt?.toISOString(),
    };
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      lesson_date: t.Optional(t.String()),
      duration_minutes: t.Optional(t.Number()),
      homework: t.Optional(t.String()),
      materials: t.Optional(t.Any()),
      lesson_plan: t.Optional(t.String()),
      lesson_notes: t.Optional(t.String()),
    }),
  })
  .delete("/lessons/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select({ id: htLessons.id, schoolId: htGroups.schoolId })
      .from(htLessons).leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
      .where(eq(htLessons.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    await db.delete(htLessons).where(eq(htLessons.id, parseInt(id)));
    return { message: "Deleted" };
  })
  .post("/attendance", async (context: any) => {
    const { body } = context;
    const { lesson_id, user_id, status, notes } = body;
    const [row] = await db.insert(htAttendance).values({
      lessonId: lesson_id,
      userId: user_id,
      status,
      notes,
    }).onConflictDoUpdate({
      target: [htAttendance.lessonId, htAttendance.userId],
      set: { status, notes, updatedAt: new Date() }
    }).returning();
    return row;
  }, {
    body: t.Object({
      lesson_id: t.Number(),
      user_id: t.String(),
      status: t.String(),
      notes: t.Optional(t.String()),
    })
  })
  .post("/grades", async (context: any) => {
    const { body } = context;
    const [row] = await db.insert(htGrades).values({
      groupId: body.group_id,
      userId: body.user_id,
      lessonId: body.lesson_id,
      type: body.type,
      grade: body.grade,
      comment: body.comment,
    }).returning();
    return row;
  }, {
    body: t.Object({
      group_id: t.Number(),
      user_id: t.String(),
      lesson_id: t.Optional(t.Number()),
      type: t.String(),
      grade: t.String(),
      comment: t.Optional(t.String()),
    })
  })
  .post("/exam-grades", async (context: any) => {
    const { body } = context;
    const { group_id, user_id, scheme_item_id, writing, listening, reading, speaking } = body;
    const totalScore = (Number(writing || 0) + Number(listening || 0) + Number(reading || 0) + Number(speaking || 0)).toString();
    const [row] = await db.insert(htExamGrades).values({
      groupId: group_id,
      userId: user_id,
      schemeItemId: scheme_item_id,
      writing: writing?.toString(),
      listening: listening?.toString(),
      reading: reading?.toString(),
      speaking: speaking?.toString(),
      totalScore,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [htExamGrades.userId, htExamGrades.groupId, htExamGrades.schemeItemId],
      set: {
        writing: writing?.toString(),
        listening: listening?.toString(),
        reading: reading?.toString(),
        speaking: speaking?.toString(),
        totalScore,
        updatedAt: new Date(),
      }
    }).returning();
    return row;
  }, {
    body: t.Object({
      group_id: t.Number(),
      user_id: t.String(),
      scheme_item_id: t.Number(),
      writing: t.Optional(t.Number()),
      listening: t.Optional(t.Number()),
      reading: t.Optional(t.Number()),
      speaking: t.Optional(t.Number()),
    })
  })
  .delete("/games/:id", async ({ params: { id } }) => {
    await db.delete(htGames).where(eq(htGames.id, parseInt(id)));
    return { success: true };
  })
  .post("/games", async (context: any) => {
    const { body } = context;
    const [row] = await db.insert(htGames).values({
      groupId: body.group_id,
      lessonId: body.lesson_id,
      title: body.title,
      type: body.type,
      data: body.data ? JSON.stringify(body.data) : null,
    }).returning();
    return row;
  }, {
    body: t.Object({
      group_id: t.Number(),
      lesson_id: t.Optional(t.Number()),
      title: t.String(),
      type: t.String(),
      data: t.Optional(t.Any()),
    })
  });
