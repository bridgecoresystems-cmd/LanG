import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { payments, users, htGroups, schools, htGroupStudents, tariffs } from "../../../db/schema";
import { eq, and, sql, sum } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

export const debtRoutes = new Elysia({ prefix: "/debts" })
  .onBeforeHandle(async (context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async (context: any) => {
    const { user, query: reqQuery } = context;
    const { studentId, groupId, schoolId, tariffId, limit, offset } = reqQuery;
    
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    // Check if user can view all schools
    const [currentUser] = await db.select({ 
      schoolId: users.school_id, 
      canViewAll: users.can_view_all_schools,
      role: users.role 
    }).from(users).where(eq(users.id, user.id)).limit(1);

    const isHeadAccountant = currentUser?.role === ROLES.HEAD_ACCOUNTANT || 
                             currentUser?.role === ROLES.GEN_DIRECTOR || 
                             currentUser?.role === ROLES.SUPERUSER;

    // Subquery for total payments per student per group
    const paymentSums = db
      .select({
        studentId: payments.studentId,
        groupId: payments.groupId,
        totalPaid: sum(payments.total).as("total_paid"),
      })
      .from(payments)
      .groupBy(payments.studentId, payments.groupId)
      .as("ps");

    const conditions = [];

    if (!isHeadAccountant && !currentUser?.canViewAll && currentUser?.schoolId) {
      conditions.push(eq(htGroups.schoolId, currentUser.schoolId));
    }

    if (studentId) conditions.push(eq(users.id, studentId));
    if (groupId) conditions.push(eq(htGroups.id, parseInt(groupId)));
    if (schoolId) conditions.push(eq(htGroups.schoolId, parseInt(schoolId)));
    if (tariffId) conditions.push(eq(htGroupStudents.tariffId, parseInt(tariffId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        studentId: users.id,
        studentFirstName: users.first_name,
        studentLastName: users.last_name,
        studentPhone: users.phone,
        groupId: htGroups.id,
        groupName: htGroups.name,
        schoolName: schools.name,
        tariffName: tariffs.name,
        tariffPrice: tariffs.price,
        discount: htGroupStudents.discount,
        totalPaid: paymentSums.totalPaid,
      })
      .from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
      .leftJoin(schools, eq(htGroups.schoolId, schools.id))
      .leftJoin(tariffs, eq(htGroupStudents.tariffId, tariffs.id))
      .leftJoin(paymentSums, and(eq(paymentSums.studentId, users.id), eq(paymentSums.groupId, htGroups.id)))
      .where(whereClause);

    const rows = await baseQuery.limit(limitNum).offset(offsetNum);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
      .where(whereClause);

    return {
      items: rows.map(r => {
        const price = parseFloat(r.tariffPrice || "0");
        const discount = parseFloat(r.discount || "0");
        const expected = Math.max(0, price - discount);
        const paid = parseFloat(r.totalPaid || "0");
        const debt = Math.max(0, expected - paid);

        return {
          student_id: r.studentId,
          student_name: `${r.studentFirstName} ${r.studentLastName || ''}`.trim(),
          student_phone: r.studentPhone,
          group_id: r.groupId,
          group_name: r.groupName,
          school_name: r.schoolName,
        tariff_name: r.tariffName || 'Не установлен',
        expected_amount: expected,
        discount_amount: discount,
        paid_amount: paid,
        debt_amount: debt,
        status: debt <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
      };
      }),
      total: Number(count)
    };
  }, {
    query: t.Object({
      studentId: t.Optional(t.String()),
      groupId: t.Optional(t.String()),
      schoolId: t.Optional(t.String()),
      tariffId: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
    })
  });
