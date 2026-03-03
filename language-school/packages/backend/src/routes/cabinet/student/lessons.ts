import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { htLessons, htGroups, htGroupStudents, htAttendance, htGames, htGameResults } from "../../../db/schema";
import { eq, asc, desc, and, inArray } from "drizzle-orm";

export const studentLessonRoutes = new Elysia()
  .get("/groups/:groupId/attendance", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);
    const [enrolled] = await db
      .select()
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, user!.id)))
      .limit(1);
    if (!enrolled) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const rows = await db
      .select({
        lessonId: htLessons.id,
        lessonTitle: htLessons.title,
        lessonDate: htLessons.lessonDate,
        homework: htLessons.homework,
        status: htAttendance.status,
        entryTime: htAttendance.entryTime,
        exitTime: htAttendance.exitTime,
      })
      .from(htLessons)
      .leftJoin(htAttendance, and(
        eq(htAttendance.lessonId, htLessons.id),
        eq(htAttendance.userId, user!.id)
      ))
      .where(eq(htLessons.groupId, gid))
      .orderBy(asc(htLessons.lessonDate));
    return rows.map((r) => ({
      lesson_id: r.lessonId,
      lesson_title: r.lessonTitle,
      lesson_date: r.lessonDate?.toISOString(),
      homework: r.homework ?? null,
      status: r.status || "—",
      entry_time: r.entryTime?.toISOString() ?? null,
      exit_time: r.exitTime?.toISOString() ?? null,
    }));
  })
  .get("/groups/:groupId/lessons", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);
    const [enrolled] = await db
      .select()
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, user!.id)))
      .limit(1);
    if (!enrolled) {
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
      })
      .from(htLessons)
      .where(eq(htLessons.groupId, gid))
      .orderBy(asc(htLessons.lessonDate));
    return rows.map((r) => ({
      id: r.id,
      group_id: r.groupId,
      title: r.title,
      description: r.description,
      lesson_date: r.lessonDate?.toISOString(),
      duration_minutes: r.durationMinutes,
      homework: r.homework,
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
      })
      .from(htLessons)
      .where(eq(htLessons.id, parseInt(id)))
      .limit(1);
    if (!row) {
      set.status = 404;
      return { error: "Not found" };
    }
    const [enrolled] = await db
      .select()
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, row.groupId), eq(htGroupStudents.userId, user!.id)))
      .limit(1);
    if (!enrolled) {
      set.status = 403;
      return { error: "Forbidden" };
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
    };
  })
  .get("/groups/:groupId/games", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);
    const [enrolled] = await db
      .select()
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, user!.id)))
      .limit(1);
    if (!enrolled) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const games = await db
      .select({
        id: htGames.id,
        title: htGames.title,
        type: htGames.type,
        data: htGames.data,
        isActive: htGames.isActive,
        lessonTitle: htLessons.title,
      })
      .from(htGames)
      .leftJoin(htLessons, eq(htGames.lessonId, htLessons.id))
      .where(and(eq(htGames.groupId, gid), eq(htGames.isActive, true)))
      .orderBy(desc(htGames.createdAt));
    const gameIds = games.map((g) => g.id);
    const myResults = gameIds.length > 0
      ? await db
          .select({ gameId: htGameResults.gameId })
          .from(htGameResults)
          .where(and(eq(htGameResults.userId, user!.id), inArray(htGameResults.gameId, gameIds)))
      : [];
    const playedGameIds = new Set(myResults.map((r) => r.gameId));
    return games.map((g) => ({
      id: g.id,
      title: g.title,
      game_type: g.type,
      data: g.data,
      is_active: g.isActive,
      lesson_title: g.lessonTitle ?? null,
      is_played: playedGameIds.has(g.id),
    }));
  })
  .post("/games/:id/play", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const gameId = parseInt(id);
    const [game] = await db
      .select({ id: htGames.id, groupId: htGames.groupId })
      .from(htGames)
      .where(eq(htGames.id, gameId))
      .limit(1);
    if (!game) {
      set.status = 404;
      return { error: "Not found" };
    }
    const [enrolled] = await db
      .select()
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, game.groupId!), eq(htGroupStudents.userId, user!.id)))
      .limit(1);
    if (!enrolled) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const score = Math.min(100, Math.max(0, Math.round(body.score ?? 0)));
    await db.insert(htGameResults).values({
      gameId,
      userId: user!.id,
      score,
    });
    return { success: true, score };
  }, {
    body: t.Object({ score: t.Number() }),
  });
