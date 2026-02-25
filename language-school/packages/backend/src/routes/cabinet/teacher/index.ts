import { db } from "../../../db/index";
import { htGroups, htCourses, htGroupStudents, htLessons } from "../../../db/schema";
import { eq, and, desc, gt, asc } from "drizzle-orm";

export async function getTeacherMyGroups(userId: string) {
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
      maxStudents: htGroups.maxStudents,
    })
    .from(htGroups)
    .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
    .where(eq(htGroups.teacherId, userId))
    .orderBy(desc(htGroups.createdAt));

  const now = new Date();
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const groupId = r.id;
      const studentCount = (
        await db.select().from(htGroupStudents).where(eq(htGroupStudents.groupId, groupId))
      ).length;
      const allLessons = await db
        .select({ id: htLessons.id, lessonDate: htLessons.lessonDate, title: htLessons.title })
        .from(htLessons)
        .where(eq(htLessons.groupId, groupId));
      const totalLessons = allLessons.length;
      const completedLessons = allLessons.filter(
        (l) => l.lessonDate && new Date(l.lessonDate) < now
      ).length;
      const progress =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const nextLessonRows = await db
        .select({ id: htLessons.id, title: htLessons.title, lessonDate: htLessons.lessonDate })
        .from(htLessons)
        .where(and(eq(htLessons.groupId, groupId), gt(htLessons.lessonDate, now)))
        .orderBy(asc(htLessons.lessonDate))
        .limit(1);
      const nextLesson = nextLessonRows[0]
        ? {
            id: nextLessonRows[0].id,
            title: nextLessonRows[0].title,
            date: nextLessonRows[0].lessonDate?.toISOString(),
          }
        : null;

      const startDate = r.startDate ? new Date(r.startDate) : null;
      const endDate = r.endDate ? new Date(r.endDate) : null;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let isActive = r.isActive ?? true;
      if (
        startDate &&
        today < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      )
        isActive = false;
      if (
        endDate &&
        today > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      )
        isActive = false;

      return {
        id: r.id,
        name: r.name,
        course_name: r.courseName,
        time_slot: r.timeSlot,
        week_days: r.weekDays,
        start_date: r.startDate?.toISOString()?.slice(0, 10) || null,
        end_date: r.endDate?.toISOString()?.slice(0, 10) || null,
        is_active: isActive,
        students_count: studentCount,
        max_students: r.maxStudents ?? 15,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress,
        next_lesson: nextLesson,
      };
    })
  );
  return enriched;
}

export async function getTeacherGroupIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ id: htGroups.id })
    .from(htGroups)
    .where(eq(htGroups.teacherId, userId));
  return rows.map((r) => r.id);
}
