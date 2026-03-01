import { db } from "../../../db/index";
import {
  htGroups,
  htCourses,
  htGroupStudents,
  htLessons,
  htGrades,
  users,
  schools,
  payments,
  tariffs,
} from "../../../db/schema";
import { eq, and, desc, gt, asc, sum, inArray } from "drizzle-orm";

export async function getStudentMyGroups(userId: string) {
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
      tariffPrice: tariffs.price,
      studentDiscount: htGroupStudents.discount,
    })
    .from(htGroupStudents)
    .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
    .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
    .leftJoin(users, eq(htGroups.teacherId, users.id))
    .leftJoin(schools, eq(htGroups.schoolId, schools.id))
    .leftJoin(tariffs, eq(htGroupStudents.tariffId, tariffs.id))
    .where(eq(htGroupStudents.userId, userId))
    .orderBy(desc(htGroups.createdAt));

  // Batch-запрос: сумма платежей по каждой группе для этого студента
  const groupIds = rows.map((r) => r.id);
  const paidMap: Record<number, number> = {};
  if (groupIds.length > 0) {
    const paymentRows = await db
      .select({ groupId: payments.groupId, totalPaid: sum(payments.total) })
      .from(payments)
      .where(and(eq(payments.studentId, userId), inArray(payments.groupId, groupIds)))
      .groupBy(payments.groupId);
    for (const p of paymentRows) {
      if (p.groupId != null) paidMap[p.groupId] = Number(p.totalPaid ?? 0);
    }
  }

  const now = new Date();
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const groupId = r.id;
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

      const gradeRows = await db
        .select({ grade: htGrades.grade })
        .from(htGrades)
        .where(and(eq(htGrades.groupId, groupId), eq(htGrades.userId, userId)));
      let averageGrade: number | null = null;
      if (gradeRows.length > 0) {
        const nums = gradeRows.map((g) => parseFloat(g.grade || "0")).filter((n) => !isNaN(n));
        if (nums.length > 0) {
          averageGrade =
            Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
        }
      }

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

      const teacherName =
        [r.teacherFirstName, r.teacherLastName].filter(Boolean).join(" ") ||
        r.teacherUsername ||
        null;

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
        total_paid: paidMap[r.id] ?? 0,
        tariff_price: r.tariffPrice != null ? Number(r.tariffPrice) : null,
        student_discount: r.studentDiscount != null ? Number(r.studentDiscount) : 0,
      };
    })
  );
  return enriched;
}

export async function getStudentGroupIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ groupId: htGroupStudents.groupId })
    .from(htGroupStudents)
    .where(eq(htGroupStudents.userId, userId));
  return rows.map((r) => r.groupId);
}
