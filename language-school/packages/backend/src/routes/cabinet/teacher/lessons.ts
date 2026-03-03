import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { users, htLessons, htGroups, htGroupStudents, htAttendance } from "../../../db/schema";
import { eq, asc, desc, and, inArray, count, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const teacherLessonRoutes = new Elysia()
  .get("/groups/:groupId/students", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);
    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);
    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const parentUsers = alias(users, "parent");
    const rows = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        parent_first_name: parentUsers.first_name,
        parent_last_name: parentUsers.last_name,
        parent_phone: parentUsers.phone,
      })
      .from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .leftJoin(parentUsers, eq(users.parent_id, parentUsers.id))
      .where(eq(htGroupStudents.groupId, gid));
    return rows.map((r) => ({
      id: r.id,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "—",
      phone: r.phone || null,
      parent_full_name: [r.parent_first_name, r.parent_last_name].filter(Boolean).join(" ").trim() || null,
      parent_phone: r.parent_phone || null,
    }));
  })
  .get("/groups/:groupId/lessons", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);
    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);
    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const rows = await db
      .select({
        id: htLessons.id,
        groupId: htLessons.groupId,
        title: htLessons.title,
        description: htLessons.description,
        lessonDate: htLessons.lessonDate,
        durationMinutes: htLessons.durationMinutes,
        homework: htLessons.homework,
        lessonPlan: htLessons.lessonPlan,
        lessonNotes: htLessons.lessonNotes,
      })
      .from(htLessons)
      .where(eq(htLessons.groupId, gid))
      .orderBy(asc(htLessons.lessonDate));

    // Total students in group
    const [studentCountRow] = await db
      .select({ cnt: count() })
      .from(htGroupStudents)
      .where(eq(htGroupStudents.groupId, gid));
    const totalStudents = Number(studentCountRow?.cnt ?? 0);

    // Attendance counts per lesson (present + late = attended)
    const lessonIds = rows.map((r) => r.id);
    const attendedMap: Record<number, number> = {};
    if (lessonIds.length > 0) {
      const attendanceCounts = await db
        .select({ lessonId: htAttendance.lessonId, cnt: count() })
        .from(htAttendance)
        .where(
          and(
            inArray(htAttendance.lessonId, lessonIds),
            or(eq(htAttendance.status, "present"), eq(htAttendance.status, "late"))
          )
        )
        .groupBy(htAttendance.lessonId);
      for (const a of attendanceCounts) {
        if (a.lessonId) attendedMap[a.lessonId] = Number(a.cnt);
      }
    }

    return rows.map((r) => ({
      id: r.id,
      group_id: r.groupId,
      title: r.title,
      description: r.description,
      lesson_date: r.lessonDate?.toISOString(),
      duration_minutes: r.durationMinutes,
      homework: r.homework,
      lesson_plan: r.lessonPlan,
      lesson_notes: r.lessonNotes,
      attended_count: attendedMap[r.id] ?? null,
      total_students: totalStudents,
    }));
  })
  .get("/lessons/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [row] = await db
      .select({
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
        teacherId: htGroups.teacherId,
      })
      .from(htLessons)
      .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
      .where(eq(htLessons.id, parseInt(id)))
      .limit(1);
    if (!row || row.teacherId !== user!.id) {
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
  .patch("/lessons/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [row] = await db
      .select({ id: htLessons.id, teacherId: htGroups.teacherId })
      .from(htLessons)
      .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
      .where(eq(htLessons.id, parseInt(id)))
      .limit(1);
    if (!row || row.teacherId !== user!.id) {
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
    const [updated] = await db
      .update(htLessons)
      .set(updateData as any)
      .where(eq(htLessons.id, parseInt(id)))
      .returning();
    if (!updated) return { error: "Not found" };
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      lesson_date: updated.lessonDate?.toISOString(),
      duration_minutes: updated.durationMinutes,
      homework: updated.homework,
      lesson_plan: updated.lessonPlan,
      lesson_notes: updated.lessonNotes,
      updated_at: updated.updatedAt?.toISOString(),
    };
  }, {
    body: t.Object({
      title: t.Optional(t.Union([t.String(), t.Null()])),
      description: t.Optional(t.Union([t.String(), t.Null()])),
      lesson_date: t.Optional(t.Union([t.String(), t.Null()])),
      duration_minutes: t.Optional(t.Number()),
      homework: t.Optional(t.Union([t.String(), t.Null()])),
      materials: t.Optional(t.Any()),
      lesson_plan: t.Optional(t.Union([t.String(), t.Null()])),
      lesson_notes: t.Optional(t.Union([t.String(), t.Null()])),
    }),
  });
