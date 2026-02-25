import { db } from "../../db/index";
import { htGroups, htCourses, htLessons, users } from "../../db/schema";
import { eq, and, inArray, gte, lte, asc } from "drizzle-orm";

export async function getScheduleForGroups(
  groupIds: number[],
  days: number,
  filterGroupId: number | null
) {
  if (groupIds.length === 0) return [];

  let ids = groupIds;
  if (filterGroupId !== null) {
    if (!groupIds.includes(filterGroupId)) return [];
    ids = [filterGroupId];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  const activeGroupIds: number[] = [];
  for (const gid of ids) {
    const [g] = await db
      .select({
        startDate: htGroups.startDate,
        endDate: htGroups.endDate,
        isActive: htGroups.isActive,
      })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);
    if (!g || !g.isActive) continue;
    if (g.startDate && new Date(g.startDate) > today) continue;
    if (g.endDate && new Date(g.endDate) < today) continue;
    activeGroupIds.push(gid);
  }

  if (activeGroupIds.length === 0) return [];

  const lessons = await db
    .select({
      id: htLessons.id,
      title: htLessons.title,
      description: htLessons.description,
      lessonDate: htLessons.lessonDate,
      durationMinutes: htLessons.durationMinutes,
      homework: htLessons.homework,
      groupId: htLessons.groupId,
      groupName: htGroups.name,
      courseName: htCourses.name,
      teacherFirstName: users.first_name,
      teacherLastName: users.last_name,
      teacherUsername: users.username,
    })
    .from(htLessons)
    .innerJoin(htGroups, eq(htLessons.groupId, htGroups.id))
    .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
    .leftJoin(users, eq(htGroups.teacherId, users.id))
    .where(
      and(
        inArray(htLessons.groupId, activeGroupIds),
        gte(htLessons.lessonDate, today),
        lte(htLessons.lessonDate, endDate)
      )
    )
    .orderBy(asc(htLessons.lessonDate));

  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    lesson_date: l.lessonDate?.toISOString(),
    duration_minutes: l.durationMinutes,
    homework: l.homework,
    group: l.groupId,
    group_name: l.groupName,
    course_name: l.courseName,
    teacher_name:
      [l.teacherFirstName, l.teacherLastName].filter(Boolean).join(" ") ||
      l.teacherUsername ||
      null,
  }));
}
