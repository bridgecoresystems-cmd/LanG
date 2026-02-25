import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { htGroups, htCourses, users, htGroupStudents, htLessons, htAttendance, htGrades, htExamGrades, htGames, htExamSchemeItems } from "../../../db/schema";
import { eq, ne, desc, and, inArray } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

export const headTeacherGroupRoutes = new Elysia()
  .get("/groups", async (context: any) => {
    const { user, query } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const rows = u?.role === ROLES.SUPERUSER
      ? await db.select({
          id: htGroups.id,
          name: htGroups.name,
          courseId: htGroups.courseId,
          teacherId: htGroups.teacherId,
          schoolId: htGroups.schoolId,
          maxStudents: htGroups.maxStudents,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
          startDate: htGroups.startDate,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          courseName: htCourses.name,
          teacherFirstName: users.first_name,
          teacherLastName: users.last_name,
          teacherUsername: users.username,
        }).from(htGroups)
          .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
          .leftJoin(users, eq(htGroups.teacherId, users.id))
          .orderBy(desc(htGroups.createdAt))
      : await db.select({
          id: htGroups.id,
          name: htGroups.name,
          courseId: htGroups.courseId,
          teacherId: htGroups.teacherId,
          schoolId: htGroups.schoolId,
          maxStudents: htGroups.maxStudents,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
          startDate: htGroups.startDate,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          courseName: htCourses.name,
          teacherFirstName: users.first_name,
          teacherLastName: users.last_name,
          teacherUsername: users.username,
        }).from(htGroups)
          .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
          .leftJoin(users, eq(htGroups.teacherId, users.id))
          .where(eq(htGroups.schoolId, u!.school_id!))
          .orderBy(desc(htGroups.createdAt));
    let filtered = rows.map((r) => ({
      id: r.id,
      name: r.name,
      course_id: r.courseId,
      course_name: r.courseName,
      teacher_id: r.teacherId,
      teacher_name: [r.teacherFirstName, r.teacherLastName].filter(Boolean).join(" ") || r.teacherUsername,
      max_students: r.maxStudents,
      time_slot: r.timeSlot,
      week_days: r.weekDays,
      start_date: r.startDate?.toISOString()?.slice(0, 10),
      end_date: r.endDate?.toISOString()?.slice(0, 10),
      is_active: r.isActive,
    }));
    const courseId = query.course ? parseInt(String(query.course)) : null;
    const teacherId = query.teacher as string | undefined;
    const isActive = query.is_active;
    if (courseId) filtered = filtered.filter((r) => r.course_id === courseId);
    if (teacherId) filtered = filtered.filter((r) => r.teacher_id === teacherId);
    if (isActive === "true") filtered = filtered.filter((r) => r.is_active);
    if (isActive === "false") filtered = filtered.filter((r) => !r.is_active);
    return filtered;
  })
  .get("/groups/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      set.status = 400;
      return { error: "Invalid group ID" };
    }
    const rows = await db.select({
      id: htGroups.id,
      name: htGroups.name,
      courseId: htGroups.courseId,
      teacherId: htGroups.teacherId,
      schoolId: htGroups.schoolId,
      examSchemeId: htGroups.examSchemeId,
      maxStudents: htGroups.maxStudents,
      timeSlot: htGroups.timeSlot,
      weekDays: htGroups.weekDays,
      startDate: htGroups.startDate,
      endDate: htGroups.endDate,
      isActive: htGroups.isActive,
      courseName: htCourses.name,
      teacherFirstName: users.first_name,
      teacherLastName: users.last_name,
    }).from(htGroups)
      .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
      .leftJoin(users, eq(htGroups.teacherId, users.id))
      .where(eq(htGroups.id, groupId));
    if (rows.length === 0) {
      set.status = 404;
      return { error: "Not found" };
    }
    const row = rows[0];
    if (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const studentRows = await db.select({ userId: htGroupStudents.userId }).from(htGroupStudents).where(eq(htGroupStudents.groupId, groupId));
    return {
      id: row.id,
      name: row.name,
      course_id: row.courseId,
      course_name: row.courseName,
      teacher_id: row.teacherId,
      teacher_name: [row.teacherFirstName, row.teacherLastName].filter(Boolean).join(" ") || null,
      exam_scheme_id: row.examSchemeId,
      max_students: row.maxStudents,
      time_slot: row.timeSlot,
      week_days: row.weekDays,
      start_date: row.startDate?.toISOString()?.slice(0, 10),
      end_date: row.endDate?.toISOString()?.slice(0, 10),
      is_active: row.isActive,
      student_ids: studentRows.map((r) => r.userId),
    };
  })
  .post("/groups", async (context: any) => {
    const { user, body } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const name = (body.name as string)?.trim();
    const courseId = body.course_id as number;
    const teacherId = body.teacher_id as string | undefined;
    const examSchemeId = body.exam_scheme_id as number | undefined;
    const maxStudents = (body.max_students as number) ?? 15;
    const timeSlot = body.time_slot as string | undefined;
    const weekDays = body.week_days as string | undefined;
    const startDate = body.start_date ? new Date(body.start_date as string) : null;
    const endDate = body.end_date ? new Date(body.end_date as string) : null;
    if (!name || !courseId) throw new Error("name and course_id are required");
    const [created] = await db.insert(htGroups).values({
      name,
      courseId,
      teacherId: teacherId || null,
      examSchemeId: examSchemeId || null,
      schoolId: u?.school_id ?? null,
      maxStudents,
      timeSlot: timeSlot || null,
      weekDays: weekDays || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: (body.is_active as boolean) !== false,
    }).returning();
    return {
      id: created.id,
      name: created.name,
      course_id: created.courseId,
      teacher_id: created.teacherId,
      max_students: created.maxStudents,
      is_active: created.isActive,
      created_at: created.createdAt?.toISOString(),
    };
  }, {
    body: t.Object({
      name: t.String(),
      course_id: t.Number(),
      teacher_id: t.Optional(t.String()),
      exam_scheme_id: t.Optional(t.Number()),
      max_students: t.Optional(t.Number()),
      time_slot: t.Optional(t.String()),
      week_days: t.Optional(t.String()),
      start_date: t.Optional(t.String()),
      end_date: t.Optional(t.String()),
      is_active: t.Optional(t.Boolean()),
    }),
  })
  .patch("/groups/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.name !== undefined) updateData.name = String(payload.name).trim();
    if (payload.course_id !== undefined) updateData.courseId = payload.course_id as number;
    if (payload.teacher_id !== undefined) updateData.teacherId = payload.teacher_id || null;
    if (payload.exam_scheme_id !== undefined) updateData.examSchemeId = payload.exam_scheme_id || null;
    if (payload.max_students !== undefined) updateData.maxStudents = payload.max_students as number;
    if (payload.time_slot !== undefined) updateData.timeSlot = payload.time_slot || null;
    if (payload.week_days !== undefined) updateData.weekDays = payload.week_days || null;
    if (payload.start_date !== undefined) updateData.startDate = payload.start_date ? new Date(payload.start_date as string) : null;
    if (payload.end_date !== undefined) updateData.endDate = payload.end_date ? new Date(payload.end_date as string) : null;
    if (payload.is_active !== undefined) updateData.isActive = payload.is_active as boolean;
    const [updated] = await db.update(htGroups).set(updateData as any).where(eq(htGroups.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return {
      id: updated.id,
      name: updated.name,
      course_id: updated.courseId,
      teacher_id: updated.teacherId,
      max_students: updated.maxStudents,
      is_active: updated.isActive,
      updated_at: updated.updatedAt?.toISOString(),
    };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      course_id: t.Optional(t.Number()),
      teacher_id: t.Optional(t.Nullable(t.String())),
      exam_scheme_id: t.Optional(t.Nullable(t.Number())),
      max_students: t.Optional(t.Number()),
      time_slot: t.Optional(t.Nullable(t.String())),
      week_days: t.Optional(t.Nullable(t.String())),
      start_date: t.Optional(t.Nullable(t.String())),
      end_date: t.Optional(t.Nullable(t.String())),
      is_active: t.Optional(t.Boolean()),
    }),
  })
  .delete("/groups/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    await db.delete(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)));
    await db.delete(htGroups).where(eq(htGroups.id, parseInt(id)));
    return { message: "Deleted" };
  })
  .post("/groups/:id/generate-schedule", async ({ params: { id }, set }) => {
    const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!group || !group.startDate || !group.timeSlot || !group.weekDays) {
      set.status = 400;
      return { error: "Missing required fields for schedule generation" };
    }
    const timeSlotMap: Record<string, { hour: number, duration: number }> = {
      'A': { hour: 8, duration: 180 },
      'B': { hour: 13, duration: 240 },
      'C': { hour: 17, duration: 120 },
    };
    const weekDaysMap: Record<string, number[]> = {
      '1': [1, 3, 5],
      '2': [2, 4, 6],
    };
    let config = timeSlotMap[group.timeSlot];
    if (!config && group.timeSlot && /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(group.timeSlot)) {
      const m = group.timeSlot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (m) {
        const startMin = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        const endMin = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
        config = { hour: parseInt(m[1], 10), duration: Math.max(60, endMin - startMin) };
      }
    }
    let targetDays = weekDaysMap[group.weekDays];
    if (!targetDays && group.weekDays) {
      const dayMap: Record<string, number> = { 'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6 };
      const parts = group.weekDays.toLowerCase().split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      const days = parts.map((p) => dayMap[p.slice(0, 2)]).filter((d) => d != null);
      if (days.length > 0) targetDays = [...new Set(days)].sort((a, b) => a - b);
    }
    if (!config || !targetDays) {
      set.status = 400;
      return { error: "Invalid time slot or week days" };
    }
    const lessonsCreated = [];
    let currentDate = new Date(group.startDate);
    const endDate = group.endDate ? new Date(group.endDate) : new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    let lessonNum = 1;
    while (currentDate <= endDate) {
      const day = currentDate.getDay();
      if (targetDays.includes(day)) {
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(config.hour, 0, 0, 0);
        const [lesson] = await db.insert(htLessons).values({
          groupId: group.id,
          title: `Lesson ${lessonNum++}`,
          lessonDate,
          durationMinutes: config.duration,
        }).returning();
        lessonsCreated.push(lesson);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return { message: `Generated ${lessonsCreated.length} lessons`, count: lessonsCreated.length };
  })
  .get("/groups/:id/available-students", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const inThisGroup = await db.select({ userId: htGroupStudents.userId }).from(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)));
    const inThisGroupIds = new Set(inThisGroup.map((r) => r.userId));
    const schoolId = group.schoolId ?? u?.school_id;
    let students: { id: string; first_name: string | null; last_name: string | null; username: string | null; school_id?: number | null }[] = [];
    if (u?.role === ROLES.SUPERUSER) {
      students = await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
        .from(users).where(eq(users.role, ROLES.STUDENT));
    } else if (schoolId != null) {
      const allStudents = await db.select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        username: users.username,
        school_id: users.school_id,
      }).from(users).where(eq(users.role, ROLES.STUDENT));
      students = allStudents.filter((s) => s.school_id === schoolId);
    }
    const filtered = students.filter((s) => !inThisGroupIds.has(s.id));
    const otherGroupEnrollments = await db.select({
      userId: htGroupStudents.userId,
      groupId: htGroupStudents.groupId,
      groupName: htGroups.name,
    }).from(htGroupStudents)
      .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
      .where(and(eq(htGroups.courseId, group.courseId), ne(htGroupStudents.groupId, parseInt(id))));
    const otherGroupByUser = new Map<string, string>();
    for (const e of otherGroupEnrollments) {
      if (e.groupId !== parseInt(id)) otherGroupByUser.set(e.userId, e.groupName || "");
    }
    return filtered.map((s) => ({
      id: s.id,
      full_name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.username,
      username: s.username,
      current_group_name: otherGroupByUser.get(s.id) || null,
    }));
  })
  .post("/groups/:id/add-students", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const studentIds = (body.student_ids as string[]) || [];
    if (studentIds.length === 0) {
      set.status = 400;
      return { error: "student_ids is required" };
    }
    const currentCount = (await db.select().from(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)))).length;
    const uniqueNew = [...new Set(studentIds)];
    if (currentCount + uniqueNew.length > group.maxStudents) {
      set.status = 400;
      return { error: `Group is full. Max students: ${group.maxStudents}` };
    }
    for (const sid of uniqueNew) {
      const inOther = await db.select({ groupId: htGroupStudents.groupId }).from(htGroupStudents)
        .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
        .where(and(eq(htGroupStudents.userId, sid), eq(htGroups.courseId, group.courseId)));
      for (const o of inOther) {
        if (o.groupId !== parseInt(id)) {
          await db.delete(htGroupStudents).where(and(eq(htGroupStudents.groupId, o.groupId), eq(htGroupStudents.userId, sid)));
        }
      }
      try {
        await db.insert(htGroupStudents).values({ groupId: parseInt(id), userId: sid });
      } catch { }
    }
    return { message: "Added", count: uniqueNew.length };
  }, { body: t.Object({ student_ids: t.Array(t.String()) }) })
  .post("/groups/:id/remove-students", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
    if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const studentIds = (body.student_ids as string[]) || [];
    for (const sid of studentIds) {
      await db.delete(htGroupStudents).where(and(eq(htGroupStudents.groupId, parseInt(id)), eq(htGroupStudents.userId, sid)));
    }
    return { message: "Removed", count: studentIds.length };
  }, { body: t.Object({ student_ids: t.Array(t.String()) }) })
  .get("/groups/:id/attendance", async (context: any) => {
    const { params: { id } } = context;
    const rows = await db.select({
      id: htAttendance.id,
      lessonId: htAttendance.lessonId,
      userId: htAttendance.userId,
      status: htAttendance.status,
      notes: htAttendance.notes,
      lessonDate: htLessons.lessonDate,
    }).from(htAttendance)
      .innerJoin(htLessons, eq(htAttendance.lessonId, htLessons.id))
      .where(eq(htLessons.groupId, parseInt(id)));
    return rows;
  })
  .get("/groups/:id/students", async (context: any) => {
    const { params: { id } } = context;
    const rows = await db.select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      username: users.username,
      avatar: users.avatar,
    }).from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .where(eq(htGroupStudents.groupId, parseInt(id)));
    return rows;
  })
  .get("/groups/:id/grades", async (context: any) => {
    const { params: { id } } = context;
    const rows = await db.select().from(htGrades).where(eq(htGrades.groupId, parseInt(id)));
    return rows;
  })
  .get("/groups/:id/exam-grades", async (context: any) => {
    const { params: { id } } = context;
    const rows = await db.select().from(htExamGrades).where(eq(htExamGrades.groupId, parseInt(id)));
    return rows;
  })
  .get("/groups/:id/games", async (context: any) => {
    const { params: { id } } = context;
    const rows = await db.select().from(htGames).where(eq(htGames.groupId, parseInt(id)));
    return rows;
  });
