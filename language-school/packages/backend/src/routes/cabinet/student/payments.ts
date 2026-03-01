import { Elysia } from "elysia";
import { db } from "../../../db/index";
import { payments, users, htGroups, htCourses, schools } from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const studentPaymentRoutes = new Elysia()
  .get("/payments", async (context: any) => {
    const { user } = context;
    const rows = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        discount: payments.discount,
        total: payments.total,
        method: payments.method,
        purpose: payments.purpose,
        isPartial: payments.isPartial,
        createdAt: payments.createdAt,
        groupId: payments.groupId,
        groupName: htGroups.name,
        courseName: htCourses.name,
        schoolId: payments.schoolId,
        schoolName: schools.name,
      })
      .from(payments)
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .where(eq(payments.studentId, user!.id))
      .orderBy(desc(payments.createdAt));

    return rows.map((r) => ({
      id: r.id,
      amount: parseFloat(r.amount),
      discount: parseFloat(r.discount || "0"),
      total: parseFloat(r.total),
      method: r.method,
      purpose: r.purpose,
      is_partial: r.isPartial,
      created_at: r.createdAt?.toISOString(),
      group_id: r.groupId,
      group_name: r.groupName,
      course_name: r.courseName,
      school_id: r.schoolId,
      school_name: r.schoolName,
    }));
  })
  .get("/payments/:id/receipt", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [payment] = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        discount: payments.discount,
        total: payments.total,
        method: payments.method,
        purpose: payments.purpose,
        isPartial: payments.isPartial,
        createdAt: payments.createdAt,
        studentId: payments.studentId,
        studentFirstName: users.first_name,
        studentLastName: users.last_name,
        studentPhone: users.phone,
        studentEmail: users.email,
        payerName: payments.payerName,
        payerPhone: payments.payerPhone,
        groupId: payments.groupId,
        groupName: htGroups.name,
        schoolId: payments.schoolId,
        schoolName: schools.name,
        schoolAddress: schools.address,
        schoolPhone: schools.phone,
      })
      .from(payments)
      .leftJoin(users, eq(payments.studentId, users.id))
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .where(and(eq(payments.id, parseInt(id)), eq(payments.studentId, user!.id)))
      .limit(1);

    if (!payment) {
      set.status = 404;
      return { error: "Not found" };
    }

    return {
      ...payment,
      amount: parseFloat(payment.amount),
      discount: parseFloat(payment.discount || "0"),
      total: parseFloat(payment.total),
    };
  });
