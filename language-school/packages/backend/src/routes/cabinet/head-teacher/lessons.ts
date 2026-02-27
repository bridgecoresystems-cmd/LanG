import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { users, htLessons, htGroups, htAttendance, htGrades, htExamGrades, htGames, htGameResults, htGroupStudents } from "../../../db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
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
    const { lesson_id, user_id, status, notes, entry_time, exit_time } = body;
    const [row] = await db.insert(htAttendance).values({
      lessonId: lesson_id,
      userId: user_id,
      status,
      notes,
      entryTime: entry_time ? new Date(entry_time) : null,
      exitTime: exit_time ? new Date(exit_time) : null,
    }).onConflictDoUpdate({
      target: [htAttendance.lessonId, htAttendance.userId],
      set: { 
        status, 
        notes, 
        entryTime: entry_time ? new Date(entry_time) : htAttendance.entryTime,
        exitTime: exit_time ? new Date(exit_time) : htAttendance.exitTime,
        updatedAt: new Date() 
      }
    }).returning();
    return row;
  }, {
    body: t.Object({
      lesson_id: t.Number(),
      user_id: t.String(),
      status: t.String(),
      notes: t.Optional(t.String()),
      entry_time: t.Optional(t.String()),
      exit_time: t.Optional(t.String()),
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
  .get("/games/:id", async (context: any) => {
    const { params: { id }, set } = context;
    const gid = parseInt(id);
    const [game] = await db
      .select({
        id: htGames.id,
        groupId: htGames.groupId,
        lessonId: htGames.lessonId,
        title: htGames.title,
        type: htGames.type,
        data: htGames.data,
        isActive: htGames.isActive,
        createdAt: htGames.createdAt,
        lessonTitle: htLessons.title,
      })
      .from(htGames)
      .leftJoin(htLessons, eq(htGames.lessonId, htLessons.id))
      .where(eq(htGames.id, gid))
      .limit(1);
    if (!game) {
      set.status = 404;
      return { error: "Not found" };
    }
    const totalStudents = await db
      .select({ userId: htGroupStudents.userId })
      .from(htGroupStudents)
      .where(eq(htGroupStudents.groupId, game.groupId!));
    const studentIds = totalStudents.map((s) => s.userId);
    const results = await db
      .select({
        userId: htGameResults.userId,
        score: htGameResults.score,
      })
      .from(htGameResults)
      .where(eq(htGameResults.gameId, gid));
    const byUser = new Map<string, { attempts: number; bestScore: number }>();
    for (const r of results) {
      const cur = byUser.get(r.userId) ?? { attempts: 0, bestScore: 0 };
      cur.attempts += 1;
      if (r.score > cur.bestScore) cur.bestScore = r.score;
      byUser.set(r.userId, cur);
    }
    const userRows = studentIds.length > 0
      ? await db.select({
          id: users.id,
          firstName: users.first_name,
          lastName: users.last_name,
          username: users.username,
        }).from(users).where(inArray(users.id, studentIds))
      : [];
    const userMap = new Map(userRows.map((u: any) => [u.id, u]));
    const studentStats = studentIds.map((uid) => {
      const u = userMap.get(uid);
      const stats = byUser.get(uid) ?? { attempts: 0, bestScore: 0 };
      return {
        user_id: uid,
        full_name: u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username : "—",
        username: u?.username ?? "—",
        attempts_count: stats.attempts,
        best_score: stats.bestScore,
      };
    });
    const playedCount = byUser.size;
    const totalCount = studentIds.length;
    const playPercentage = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;
    let dataParsed: any[] = [];
    try {
      dataParsed = game.data ? JSON.parse(game.data) : [];
    } catch (_) {}
    return {
      id: game.id,
      group_id: game.groupId,
      lesson_id: game.lessonId,
      title: game.title,
      type: game.type,
      data: dataParsed,
      is_active: game.isActive,
      created_at: game.createdAt?.toISOString(),
      lesson_title: game.lessonTitle ?? null,
      total_students: totalCount,
      played_count: playedCount,
      play_percentage: playPercentage,
      student_stats: studentStats,
    };
  })
  .patch("/games/:id", async (context: any) => {
    const { params: { id }, body } = context;
    const [updated] = await db
      .update(htGames)
      .set({ isActive: body.is_active })
      .where(eq(htGames.id, parseInt(id)))
      .returning();
    return updated ?? { error: "Not found" };
  }, {
    body: t.Object({ is_active: t.Boolean() }),
  })
  .put("/games/:id", async (context: any) => {
    const { params: { id }, body } = context;
    const gid = parseInt(id);
    const [row] = await db.select().from(htGames).where(eq(htGames.id, gid)).limit(1);
    if (!row) return { error: "Not found" };
    const [updated] = await db
      .update(htGames)
      .set({
        title: body.title,
        lessonId: body.lesson_id ?? null,
        type: body.type,
        data: body.data ? JSON.stringify(body.data) : null,
      })
      .where(eq(htGames.id, gid))
      .returning();
    return updated ?? { error: "Not found" };
  }, {
    body: t.Object({
      title: t.String(),
      lesson_id: t.Optional(t.Nullable(t.Number())),
      type: t.String(),
      data: t.Optional(t.Any()),
    }),
  })
  .delete("/games/:id", async ({ params: { id } }) => {
    await db.delete(htGames).where(eq(htGames.id, parseInt(id)));
    return { success: true };
  })
  .post("/games", async (context: any) => {
    const { body } = context;
    const [row] = await db.insert(htGames).values({
      groupId: body.group_id,
      lessonId: body.lesson_id ?? null,
      title: body.title,
      type: body.type,
      data: body.data ? JSON.stringify(body.data) : null,
    }).returning();
    return row;
  }, {
    body: t.Object({
      group_id: t.Number(),
      lesson_id: t.Optional(t.Nullable(t.Number())),
      title: t.String(),
      type: t.String(),
      data: t.Optional(t.Any()),
    })
  });
