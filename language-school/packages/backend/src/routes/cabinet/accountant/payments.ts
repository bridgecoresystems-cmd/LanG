import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { payments, users, htGroups, schools, userRoles } from "../../../db/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
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
      conditions.push(sql`${payments.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(sql`${payments.createdAt} <= ${endOfDay}`);
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
    const { student_id, group_id, payer_name, payer_phone, amount, discount, method, purpose, comment } = body;
    
    const [dbUser] = await db.select({ schoolId: users.school_id }).from(users).where(eq(users.id, user.id)).limit(1);
    
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
      createdById: user.id,
      schoolId: dbUser?.schoolId || null,
    }).returning();
    
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
    })
  })
  .patch("/payments/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const { student_id, group_id, payer_name, payer_phone, amount, discount, method, purpose, comment } = body;
    
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
        studentFirstName: users.first_name,
        studentLastName: users.last_name,
        studentPhone: users.phone,
        studentEmail: users.email,
        payerName: payments.payerName,
        payerPhone: payments.payerPhone,
        groupName: htGroups.name,
      })
      .from(payments)
      .leftJoin(users, eq(payments.studentId, users.id))
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .where(eq(payments.id, parseInt(id)))
      .limit(1);
      
    if (!payment) return { error: "Not found" };
    
    return {
      ...payment,
      amount: parseFloat(payment.amount),
      discount: parseFloat(payment.discount || '0'),
      total: parseFloat(payment.total),
    };
  })
  .get("/students", async (context: any) => {
    const { user, query } = context;
    const search = query.q ? String(query.q).toLowerCase() : "";
    
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
    
    if (!isSuper && !currentUser?.canViewAll && currentUser?.schoolId) {
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
  })
  .get("/groups", async (context: any) => {
    const { user, query } = context;
    const search = query.q ? String(query.q).toLowerCase() : "";
    
    const [currentUser] = await db.select({ 
      schoolId: users.school_id, 
      canViewAll: users.can_view_all_schools,
      role: users.role 
    }).from(users).where(eq(users.id, user.id)).limit(1);

    const conditions = [like(sql`lower(${htGroups.name})`, `%${search}%`)];

    const isSuper = currentUser?.role === ROLES.SUPERUSER || 
                    currentUser?.role === ROLES.GEN_DIRECTOR || 
                    currentUser?.role === ROLES.HEAD_ACCOUNTANT;
    
    if (!isSuper && !currentUser?.canViewAll && currentUser?.schoolId) {
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
  });
