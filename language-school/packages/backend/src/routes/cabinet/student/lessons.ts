import { Elysia } from "elysia";
import { db } from "../../../db/index";
import { htLessons, htGroups, htGroupStudents } from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const studentLessonRoutes = new Elysia()
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
      .orderBy(desc(htLessons.lessonDate));
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
  });
