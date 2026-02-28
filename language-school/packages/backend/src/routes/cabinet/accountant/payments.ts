import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { payments, users, htGroups, schools, userRoles, htGroupStudents, tariffs } from "../../../db/schema";
import { eq, desc, and, like, or, sql, sum } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

// Helper to check roles
async function hasRole(userId: string, role: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === role || user?.role === ROLES.SUPERUSER) return true;
  const additionalRoles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  return additionalRoles.some(r => r.role === role);
}

export const accountantRoutes = new Elysia({ prefix: "/accountant" })
  .onBeforeHandle(async (context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const isAccountant = await hasRole(user.id, ROLES.ACCOUNTANT);
    const isHeadAccountant = await hasRole(user.id, ROLES.HEAD_ACCOUNTANT);
    const isDirector = await hasRole(user.id, ROLES.DIRECTOR);
    const isGenDirector = await hasRole(user.id, ROLES.GEN_DIRECTOR);
    const isHeadTeacher = await hasRole(user.id, ROLES.HEAD_TEACHER);
    
    // Allow Head Accountant, Director, Gen Director, Head Teacher to act as Accountant too if needed
    if (!isAccountant && !isHeadAccountant && !isDirector && !isGenDirector && !isHeadTeacher) {
      set.status = 403;
      return { error: "Forbidden" };
    }
  })
  .get("/payments", async (context: any) => {
    const { user, query } = context;
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.offset ? parseInt(query.offset) : 0;
    const search = query.search ? String(query.search).toLowerCase() : "";
    const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : null;
    const dateTo = query.dateTo ? new Date(query.dateTo as string) : null;
    const method = query.method as string | undefined;
    
    // Check if user can view all schools
    const [currentUser] = await db.select({ 
      schoolId: users.school_id, 
      canViewAll: users.can_view_all_schools,
      role: users.role 
    }).from(users).where(eq(users.id, user.id)).limit(1);

    let whereClause = undefined;
    const conditions = [];

    // Filter by school if not superuser/gen_director/head_accountant and doesn't have "view all" flag
    const isSuper = currentUser?.role === ROLES.SUPERUSER || 
                    currentUser?.role === ROLES.GEN_DIRECTOR || 
                    currentUser?.role === ROLES.HEAD_ACCOUNTANT;
    
    if (!isSuper && !currentUser?.canViewAll && currentUser?.schoolId) {
      conditions.push(eq(payments.schoolId, currentUser.schoolId));
    }

    if (search) {
      const searchNum = parseFloat(search);
      const searchConditions = [
        like(sql`lower(${users.first_name})`, `%${search}%`),
        like(sql`lower(${users.last_name})`, `%${search}%`),
        like(sql`lower(${payments.payerName})`, `%${search}%`),
        like(payments.payerPhone, `%${search}%`),
        like(sql`lower(${htGroups.name})`, `%${search}%`),
        like(sql`lower(${payments.purpose})`, `%${search}%`),
      ];
      
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(payments.total, searchNum.toString()));
      }
      
      conditions.push(or(...searchConditions));
    }

    if (method) {
      conditions.push(eq(payments.method, method));
    }

    if (dateFrom) {
      const startOfDay = new Date(dateFrom as string);
      if (!isNaN(startOfDay.getTime())) {
        startOfDay.setHours(0, 0, 0, 0);
        conditions.push(sql`${payments.createdAt} >= ${startOfDay.toISOString()}`);
      }
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo as string);
      if (!isNaN(endOfDay.getTime())) {
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(sql`${payments.createdAt} <= ${endOfDay.toISOString()}`);
      }
    }

    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }
    
    const rows = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        discount: payments.discount,
        total: payments.total,
        method: payments.method,
        purpose: payments.purpose,
        createdAt: payments.createdAt,
        studentFirstName: users.first_name,
        studentLastName: users.last_name,
        payerName: payments.payerName,
        payerPhone: payments.payerPhone,
        groupName: htGroups.name,
        schoolName: schools.name,
        createdByFirstName: sql<string>`creator.first_name`,
        createdByLastName: sql<string>`creator.last_name`,
      })
      .from(payments)
      .leftJoin(users, eq(payments.studentId, users.id))
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .leftJoin(sql`${users} as creator`, eq(payments.createdById, sql`creator.id`))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .leftJoin(users, eq(payments.studentId, users.id))
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .where(whereClause);
      
    return {
      items: rows.map(r => ({
        id: r.id,
        amount: parseFloat(r.amount),
        discount: parseFloat(r.discount || '0'),
        total: parseFloat(r.total),
        method: r.method,
        purpose: r.purpose,
        created_at: r.createdAt,
        payer: r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName || ''}`.trim() : r.payerName || 'Unknown',
        payer_phone: r.payerPhone,
        group_name: r.groupName,
        school_name: r.schoolName,
        created_by: [r.createdByFirstName, r.createdByLastName].filter(Boolean).join(" "),
      })),
      total: Number(count)
    };
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
      search: t.Optional(t.String()),
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
      method: t.Optional(t.String()),
    })
  })
  .post("/payments", async (context: any) => {
    const { user, body, set } = context;
    const { student_id, group_id, payer_name, payer_phone, amount, discount, method, purpose, comment, school_id, created_by_id, is_partial, tariff_id } = body;
    
    const [dbUser] = await db.select({ schoolId: users.school_id, role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
    const isHeadAccountant = dbUser?.role === ROLES.HEAD_ACCOUNTANT || dbUser?.role === ROLES.GEN_DIRECTOR || dbUser?.role === ROLES.SUPERUSER;
    
    const total = parseFloat(amount.toString()) - parseFloat((discount || 0).toString());
    
    const [payment] = await db.insert(payments).values({
      studentId: student_id || null,
      groupId: group_id || null,
      payerName: payer_name || null,
      payerPhone: payer_phone || null,
      amount: amount.toString(),
      discount: (discount || 0).toString(),
      total: total.toString(),
      method,
      purpose,
      comment: comment || null,
      createdById: (isHeadAccountant && created_by_id) ? created_by_id : user.id,
      schoolId: (isHeadAccountant && school_id) ? school_id : (dbUser?.schoolId || null),
      isPartial: is_partial || false,
    }).returning();

    // If it's a student in a group, update their enrollment with tariff and discount if provided
    if (student_id && group_id) {
      const updateData: any = {};
      if (tariff_id) updateData.tariffId = tariff_id;
      if (discount !== undefined) {
        // We accumulate the discount in the enrollment record
        updateData.discount = sql`${htGroupStudents.discount} + ${(discount || 0).toString()}`;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.update(htGroupStudents)
          .set(updateData)
          .where(and(eq(htGroupStudents.userId, student_id), eq(htGroupStudents.groupId, group_id)));
      }
    }
    
    return payment;
  }, {
    body: t.Object({
      student_id: t.Optional(t.String()),
      group_id: t.Optional(t.Number()),
      payer_name: t.Optional(t.String()),
      payer_phone: t.Optional(t.String()),
      amount: t.Number(),
      discount: t.Optional(t.Number()),
      method: t.String(),
      purpose: t.String(),
      comment: t.Optional(t.String()),
      school_id: t.Optional(t.Number()),
      created_by_id: t.Optional(t.String()),
      is_partial: t.Optional(t.Boolean()),
      tariff_id: t.Optional(t.Number()),
    })
  })
  .patch("/payments/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const { student_id, group_id, payer_name, payer_phone, amount, discount, method, purpose, comment, school_id, created_by_id } = body;
    
    const isHeadAccountant = await hasRole(user.id, ROLES.HEAD_ACCOUNTANT);
    const isGenDirector = await hasRole(user.id, ROLES.GEN_DIRECTOR);
    
    if (!isHeadAccountant && !isGenDirector) {
      set.status = 403;
      return { error: "Forbidden: Only Head Accountant or Gen Director can edit payments" };
    }

    const [existing] = await db.select().from(payments).where(eq(payments.id, parseInt(id))).limit(1);
    if (!existing) {
      set.status = 404;
      return { error: "Payment not found" };
    }

    const total = parseFloat(amount.toString()) - parseFloat((discount || 0).toString());

    const [updated] = await db.update(payments).set({
      studentId: student_id || null,
      groupId: group_id || null,
      payerName: payer_name || null,
      payerPhone: payer_phone || null,
      amount: amount.toString(),
      discount: (discount || 0).toString(),
      total: total.toString(),
      method,
      purpose,
      comment: comment || null,
      schoolId: school_id !== undefined ? school_id : existing.schoolId,
      createdById: created_by_id !== undefined ? created_by_id : existing.createdById,
    }).where(eq(payments.id, parseInt(id))).returning();

    return updated;
  }, {
    body: t.Object({
      student_id: t.Optional(t.String()),
      group_id: t.Optional(t.Number()),
      payer_name: t.Optional(t.String()),
      payer_phone: t.Optional(t.String()),
      amount: t.Number(),
      discount: t.Optional(t.Number()),
      method: t.String(),
      purpose: t.String(),
      comment: t.Optional(t.String()),
      school_id: t.Optional(t.Number()),
      created_by_id: t.Optional(t.String()),
    })
  })
  .get("/payments/:id/receipt", async (context: any) => {
    const { params: { id } } = context;
    const [payment] = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        discount: payments.discount,
        total: payments.total,
        method: payments.method,
        purpose: payments.purpose,
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
        isPartial: payments.isPartial,
        schoolName: schools.name,
        createdById: payments.createdById,
        creatorFirstName: sql<string>`creator.first_name`,
        creatorLastName: sql<string>`creator.last_name`,
      })
      .from(payments)
      .leftJoin(users, eq(payments.studentId, users.id))
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .leftJoin(sql`${users} as creator`, eq(payments.createdById, sql`creator.id`))
      .where(eq(payments.id, parseInt(id)))
      .limit(1);
      
    if (!payment) return { error: "Not found" };
    
    return {
      ...payment,
      amount: parseFloat(payment.amount),
      discount: parseFloat(payment.discount || '0'),
      total: parseFloat(payment.total),
      schoolId: payment.schoolId,
      schoolName: payment.schoolName,
      createdById: payment.createdById,
      createdByName: [payment.creatorFirstName, payment.creatorLastName].filter(Boolean).join(" "),
    };
  })
  .get("/students", async (context: any) => {
    const { user, query } = context;
    const search = query.q ? String(query.q).toLowerCase() : "";
    const schoolId = query.schoolId ? parseInt(query.schoolId as string) : null;
    
    const [currentUser] = await db.select({ 
      schoolId: users.school_id, 
      canViewAll: users.can_view_all_schools,
      role: users.role 
    }).from(users).where(eq(users.id, user.id)).limit(1);

    const conditions = [
      eq(users.role, ROLES.STUDENT),
      or(
        like(sql`lower(${users.first_name})`, `%${search}%`),
        like(sql`lower(${users.last_name})`, `%${search}%`),
        like(users.phone, `%${search}%`)
      )
    ];

    const isSuper = currentUser?.role === ROLES.SUPERUSER || 
                    currentUser?.role === ROLES.GEN_DIRECTOR || 
                    currentUser?.role === ROLES.HEAD_ACCOUNTANT;
    
    if (schoolId) {
      // If schoolId filter is provided, use it (only for super/head who can see all)
      if (isSuper || currentUser?.canViewAll) {
        conditions.push(eq(users.school_id, schoolId));
      } else {
        // Regular accountant can only see their school even if they try to filter
        conditions.push(eq(users.school_id, currentUser?.schoolId || 0));
      }
    } else if (!isSuper && !currentUser?.canViewAll && currentUser?.schoolId) {
      conditions.push(eq(users.school_id, currentUser.schoolId));
    }

    const rows = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        phone: users.phone,
        username: users.username,
      })
      .from(users)
      .where(and(...conditions))
      .limit(20);
      
    return rows.map(r => ({
      id: r.id,
      full_name: `${r.firstName} ${r.lastName || ''}`.trim(),
      phone: r.phone,
      username: r.username
    }));
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      schoolId: t.Optional(t.String()),
    })
  })
  .get("/groups", async (context: any) => {
    const { user, query } = context;
    const search = query.q ? String(query.q).toLowerCase() : "";
    const schoolId = query.schoolId ? parseInt(query.schoolId as string) : null;
    
    const [currentUser] = await db.select({ 
      schoolId: users.school_id, 
      canViewAll: users.can_view_all_schools,
      role: users.role 
    }).from(users).where(eq(users.id, user.id)).limit(1);

    const conditions = [like(sql`lower(${htGroups.name})`, `%${search}%`)];

    const isSuper = currentUser?.role === ROLES.SUPERUSER || 
                    currentUser?.role === ROLES.GEN_DIRECTOR || 
                    currentUser?.role === ROLES.HEAD_ACCOUNTANT;
    
    if (schoolId) {
      if (isSuper || currentUser?.canViewAll) {
        conditions.push(eq(htGroups.schoolId, schoolId));
      } else {
        conditions.push(eq(htGroups.schoolId, currentUser?.schoolId || 0));
      }
    } else if (!isSuper && !currentUser?.canViewAll && currentUser?.schoolId) {
      conditions.push(eq(htGroups.schoolId, currentUser.schoolId));
    }

    const rows = await db
      .select({
        id: htGroups.id,
        name: htGroups.name,
      })
      .from(htGroups)
      .where(and(...conditions))
      .limit(20);
      
    return rows;
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      schoolId: t.Optional(t.String()),
    })
  })
  .get("/student-group-info", async (context: any) => {
    const { query } = context;
    const { studentId, groupId } = query;
    if (!studentId || !groupId) return { error: "Missing params" };

    try {
      const gId = parseInt(groupId);
      if (isNaN(gId)) return { error: "Invalid groupId" };

      const [enrollment] = await db
        .select({
          tariffId: htGroupStudents.tariffId,
          discount: htGroupStudents.discount,
          tariffPrice: tariffs.price,
        })
        .from(htGroupStudents)
        .leftJoin(tariffs, eq(htGroupStudents.tariffId, tariffs.id))
        .where(and(eq(htGroupStudents.userId, studentId), eq(htGroupStudents.groupId, gId)))
        .limit(1);

      const [paymentSum] = await db
        .select({ totalPaid: sum(payments.total) })
        .from(payments)
        .where(and(eq(payments.studentId, studentId), eq(payments.groupId, gId)));

      return {
        tariffId: enrollment?.tariffId || null,
        tariffPrice: enrollment?.tariffPrice ? parseFloat(enrollment.tariffPrice) : 0,
        discount: enrollment?.discount ? parseFloat(enrollment.discount) : 0,
        totalPaid: paymentSum?.totalPaid ? parseFloat(paymentSum.totalPaid) : 0,
      };
    } catch (e: any) {
      console.error("Error in student-group-info:", e);
      return { error: e.message || "Internal Server Error" };
    }
  }, {
    query: t.Object({
      studentId: t.String(),
      groupId: t.String(),
    })
  })
  .get("/accountants", async (context: any) => {
    const { user } = context;
    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
    const isHeadAccountant = currentUser?.role === ROLES.HEAD_ACCOUNTANT || currentUser?.role === ROLES.GEN_DIRECTOR || currentUser?.role === ROLES.SUPERUSER;
    
    if (!isHeadAccountant) {
      return [];
    }

    const rows = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        schoolName: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(or(eq(users.role, ROLES.ACCOUNTANT), eq(users.role, ROLES.HEAD_ACCOUNTANT)))
      .orderBy(users.first_name);
      
    return rows.map(r => ({
      id: r.id,
      label: `${r.firstName} ${r.lastName || ''} (${r.schoolName || 'Без школы'})`
    }));
  })
  .get("/schools", async (context: any) => {
    const { user } = context;
    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
    const isHeadAccountant = currentUser?.role === ROLES.HEAD_ACCOUNTANT || currentUser?.role === ROLES.GEN_DIRECTOR || currentUser?.role === ROLES.SUPERUSER;
    
    if (!isHeadAccountant) {
      return [];
    }

    const rows = await db.select().from(schools).orderBy(schools.name);
    return rows.map(s => ({
      id: s.id,
      label: s.name
    }));
  });
