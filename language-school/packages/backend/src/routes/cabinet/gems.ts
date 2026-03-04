import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { gemsWallets, gemsTransactions, gemsVendors, users, userRoles, htGroups, htGroupStudents, gemsTopupRequests, gemsTopupLogs, schools, userSchools } from "../../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { ROLES } from "../../constants/roles";
import { pushGemsBalance } from "../../ws/gems-broadcast";

// Hierarchy: who can send gems to whom
// HEAD_ACCOUNTANT → ACCOUNTANT
// ACCOUNTANT → TEACHER, STUDENT (конкурсы, призы)
// TEACHER → STUDENT
// (STUDENT → VENDOR is handled via terminal/rfid endpoint)

const TRANSFER_RULES: Record<string, string[]> = {
  [ROLES.HEAD_ACCOUNTANT]: [ROLES.ACCOUNTANT],
  [ROLES.ACCOUNTANT]: [ROLES.TEACHER, ROLES.STUDENT],
  [ROLES.TEACHER]: [ROLES.STUDENT],
  [ROLES.SUPERUSER]: Object.values(ROLES), // superuser can send to anyone
  [ROLES.GEN_DIRECTOR]: Object.values(ROLES),
};

// Роли, у которых есть кошелёк (все остальные не участвуют в системе гемов)
const WALLET_ROLES = new Set([
  ROLES.HEAD_ACCOUNTANT,
  ROLES.ACCOUNTANT,
  ROLES.TEACHER,
  ROLES.STUDENT,
]);

async function getUserRole(userId: string): Promise<string> {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const mainRole = (u?.role || "").toUpperCase();
  if (mainRole && (mainRole in TRANSFER_RULES || [ROLES.SUPERUSER, ROLES.GEN_DIRECTOR, ROLES.HEAD_ACCOUNTANT].includes(mainRole)))
    return mainRole;
  const additional = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  for (const r of additional) {
    const roleUp = (r.role || "").toUpperCase();
    if (roleUp && (roleUp in TRANSFER_RULES || [ROLES.SUPERUSER, ROLES.GEN_DIRECTOR, ROLES.HEAD_ACCOUNTANT].includes(roleUp)))
      return roleUp;
  }
  return mainRole || "";
}

async function getOrCreateWallet(userId: string) {
  const [existing] = await db.select().from(gemsWallets).where(eq(gemsWallets.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(gemsWallets).values({ userId }).returning();
  return created;
}

export const gemsRoutes = new Elysia({ prefix: "/gems" })
  // GET /cabinet/gems/wallet — my balance
  .get("/wallet", async (context: any) => {
    const { user } = context;
    const wallet = await getOrCreateWallet(user!.id);
    return { balance: Number(wallet.balance) };
  })

  // GET /cabinet/gems/transactions — my transaction history
  .get("/transactions", async (context: any) => {
    const { user, query } = context;
    const limit = Math.min(parseInt(query?.limit || "50"), 200);
    const rows = await db
      .select({
        id: gemsTransactions.id,
        amount: gemsTransactions.amount,
        type: gemsTransactions.type,
        comment: gemsTransactions.comment,
        createdAt: gemsTransactions.createdAt,
        senderId: gemsTransactions.senderId,
        receiverId: gemsTransactions.receiverId,
        senderFirstName: users.first_name,
        senderLastName: users.last_name,
      })
      .from(gemsTransactions)
      .leftJoin(users, eq(gemsTransactions.senderId, users.id))
      .where(
        or(
          eq(gemsTransactions.senderId, user!.id),
          eq(gemsTransactions.receiverId, user!.id)
        )
      )
      .orderBy(desc(gemsTransactions.createdAt))
      .limit(limit);

    // Fetch receiver names separately
    const enriched = await Promise.all(rows.map(async (row) => {
      let receiverName = null;
      if (row.receiverId) {
        const [rec] = await db.select({ first_name: users.first_name, last_name: users.last_name })
          .from(users).where(eq(users.id, row.receiverId)).limit(1);
        receiverName = rec ? [rec.first_name, rec.last_name].filter(Boolean).join(" ") : null;
      }
      return {
        id: row.id,
        amount: Number(row.amount),
        type: row.type,
        comment: row.comment,
        createdAt: row.createdAt,
        direction: row.senderId === user!.id ? "out" : "in",
        senderName: [row.senderFirstName, row.senderLastName].filter(Boolean).join(" ") || null,
        receiverName,
      };
    }));

    return enriched;
  })

  // POST /cabinet/gems/transfer — send gems to someone
  .post("/transfer", async (context: any) => {
    try {
      const { user, body, set } = context;
      const { receiverId, amount, comment } = body as any;

      if (!receiverId || amount == null) {
        set.status = 400;
        return { error: "receiverId and amount are required" };
      }
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        set.status = 400;
        return { error: "Amount must be a positive number" };
      }

      const senderRole = await getUserRole(user!.id);
      const senderRoleUpper = (senderRole || "").toUpperCase();
      const allowed = TRANSFER_RULES[senderRole] ?? TRANSFER_RULES[senderRoleUpper] ?? [];
      const allowedUpper = allowed.map((r: string) => r.toUpperCase());

      const [receiver] = await db
        .select({ id: users.id, role: users.role, first_name: users.first_name, last_name: users.last_name })
        .from(users)
        .where(eq(users.id, String(receiverId)))
        .limit(1);

      if (!receiver) {
        set.status = 404;
        return { error: "Receiver not found" };
      }

      const receiverRole = (receiver.role || "").toUpperCase();

      if (!allowedUpper.includes(receiverRole) && senderRoleUpper !== ROLES.SUPERUSER && senderRoleUpper !== ROLES.GEN_DIRECTOR) {
        set.status = 403;
        return { error: `${senderRole || "Unknown"} cannot transfer gems to ${receiverRole || "Unknown"}` };
      }

      const senderWallet = await getOrCreateWallet(user!.id);
      const freeSenders = [ROLES.SUPERUSER, ROLES.GEN_DIRECTOR, ROLES.HEAD_ACCOUNTANT];
      if (!freeSenders.includes(senderRoleUpper) && Number(senderWallet.balance) < amt) {
        set.status = 400;
        return { error: "Insufficient balance" };
      }

      const receiverWallet = await getOrCreateWallet(String(receiverId));

      const txType = receiverRole === ROLES.STUDENT ? "award" : "transfer";
      const newSenderBalance = Number(senderWallet.balance) - amt;
      const newReceiverBalance = Number(receiverWallet.balance) + amt;

      await db.update(gemsWallets)
        .set({ balance: String(newSenderBalance), updatedAt: new Date() })
        .where(eq(gemsWallets.userId, user!.id));

      await db.update(gemsWallets)
        .set({ balance: String(newReceiverBalance), updatedAt: new Date() })
        .where(eq(gemsWallets.userId, String(receiverId)));

      await db.insert(gemsTransactions).values({
        senderId: user!.id,
        receiverId: String(receiverId),
        amount: String(amt),
        type: txType,
        comment: comment || null,
      });

      // Push real-time balance updates
      pushGemsBalance(user!.id, newSenderBalance);
      pushGemsBalance(String(receiverId), newReceiverBalance);

      return {
        ok: true,
        newBalance: newSenderBalance,
        receiverName: [receiver.first_name, receiver.last_name].filter(Boolean).join(" "),
      };
    } catch (err: any) {
      console.error("[gems/transfer] Error:", err);
      (context as any).set.status = 500;
      return { error: err?.message || "Transfer failed" };
    }
  }, {
    body: t.Object({
      receiverId: t.String(),
      amount: t.Number(),
      comment: t.Optional(t.String()),
    }),
  })

  // GET /cabinet/gems/users-to-send — list of users I can send gems to
  .get("/users-to-send", async (context: any) => {
    const { user } = context;
    const senderRole = await getUserRole(user!.id);
    const allowedRoles = (TRANSFER_RULES[senderRole] || []).map((r) => r.toLowerCase());
    if (allowedRoles.length === 0) return [];

    const roleMatch = (u: { role: string | null }) =>
      u.role && allowedRoles.includes(u.role.toLowerCase());

    const allUsers = await db
      .select({ id: users.id, first_name: users.first_name, last_name: users.last_name, role: users.role, school_id: users.school_id })
      .from(users)
      .where(eq(users.is_active, true));

    let filtered = allUsers.filter((u) => roleMatch(u) && u.id !== user!.id);

    // HEAD_ACCOUNTANT с привязкой к школе — только бухгалтеры своей школы; без школы — все
    if (senderRole.toUpperCase() === ROLES.HEAD_ACCOUNTANT) {
      const [me] = await db.select({ schoolId: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
      const mySchoolIds = new Set<number>();
      if (me?.schoolId) mySchoolIds.add(me.schoolId);
      const extra = await db.select({ schoolId: userSchools.schoolId }).from(userSchools).where(eq(userSchools.userId, user!.id));
      extra.forEach((r) => { if (r.schoolId) mySchoolIds.add(r.schoolId); });
      if (mySchoolIds.size > 0) {
        filtered = filtered.filter((u) => u.school_id && mySchoolIds.has(u.school_id));
      }
    }

    return filtered.map((u) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.id,
      role: u.role,
    }));
  })

  // GET /cabinet/gems/group-students/:groupId — teacher sends gems to students in group
  .get("/group-students/:groupId", async (context: any) => {
    const { user, params, set } = context;
    const senderRole = await getUserRole(user!.id);
    if (senderRole.toUpperCase() !== ROLES.TEACHER && senderRole.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const gid = parseInt(params.groupId);
    // Import htGroupStudents inline to avoid circular deps
    const [group] = await db.select({ teacherId: htGroups.teacherId })
      .from(htGroups).where(eq(htGroups.id, gid)).limit(1);

    if (!group || (group.teacherId !== user!.id && senderRole.toUpperCase() !== ROLES.SUPERUSER)) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
      .from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .where(eq(htGroupStudents.groupId, gid));

    const withWallets = await Promise.all(rows.map(async (s) => {
      const wallet = await getOrCreateWallet(s.id);
      return {
        id: s.id,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id,
        balance: Number(wallet.balance),
      };
    }));

    return withWallets;
  })

  // POST /cabinet/gems/award-group — teacher awards gems to one student from a group
  .post("/award-group", async (context: any) => {
    const { user, body, set } = context;
    const { studentId, groupId, amount, comment } = body as any;

    if (amount <= 0) { set.status = 400; return { error: "Amount must be positive" }; }

    const senderRole = await getUserRole(user!.id);
    if (senderRole.toUpperCase() !== ROLES.TEACHER && senderRole.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Only teachers can award gems" };
    }

    // Verify teacher owns the group
    const [group] = await db.select({ teacherId: htGroups.teacherId })
      .from(htGroups).where(eq(htGroups.id, groupId)).limit(1);
    if (!group || (group.teacherId !== user!.id && senderRole.toUpperCase() !== ROLES.SUPERUSER)) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    // Verify student is in the group
    const [member] = await db.select({ id: htGroupStudents.id })
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, groupId), eq(htGroupStudents.userId, studentId)))
      .limit(1);
    if (!member) { set.status = 400; return { error: "Student not in group" }; }

    // Teacher balance check
    const senderWallet = await getOrCreateWallet(user!.id);
    if (Number(senderWallet.balance) < amount) {
      set.status = 400;
      return { error: "Insufficient gems balance" };
    }

    const receiverWallet = await getOrCreateWallet(studentId);

    await db.update(gemsWallets)
      .set({ balance: String(Number(senderWallet.balance) - amount), updatedAt: new Date() })
      .where(eq(gemsWallets.userId, user!.id));

    await db.update(gemsWallets)
      .set({ balance: String(Number(receiverWallet.balance) + amount), updatedAt: new Date() })
      .where(eq(gemsWallets.userId, studentId));

    await db.insert(gemsTransactions).values({
      senderId: user!.id,
      receiverId: studentId,
      amount: String(amount),
      type: "award",
      comment: comment || null,
    });

    const newTeacherBalance = Number(senderWallet.balance) - amount;
    const newStudentBalance = Number(receiverWallet.balance) + amount;

    // Push real-time balance updates to both teacher and student
    pushGemsBalance(user!.id, newTeacherBalance);
    pushGemsBalance(studentId, newStudentBalance);

    return { ok: true, newBalance: newTeacherBalance };
  }, {
    body: t.Object({
      studentId: t.String(),
      groupId: t.Number(),
      amount: t.Number(),
      comment: t.Optional(t.String()),
    }),
  })

  // GET /cabinet/gems/schools — список школ для фильтра (HEAD_ACCOUNTANT)
  .get("/schools", async (context: any) => {
    const { user, set } = context;
    const senderRole = await getUserRole(user!.id);
    const allowed = [ROLES.HEAD_ACCOUNTANT, ROLES.SUPERUSER, ROLES.GEN_DIRECTOR];
    if (!allowed.map(r => r.toUpperCase()).includes(senderRole.toUpperCase())) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    // HEAD_ACCOUNTANT, SUPERUSER, GEN_DIRECTOR — всегда все школы (главбух может не иметь привязки к школе)
    const rows = await db.select({ id: schools.id, name: schools.name }).from(schools).orderBy(schools.name);
    return rows.map((s) => ({ id: s.id, label: s.name }));
  })

  // ── HEAD_ACCOUNTANT: view all wallets ──
  // GET /cabinet/gems/all-wallets
  .get("/all-wallets", async (context: any) => {
    const { user, set, query } = context;
    const senderRole = await getUserRole(user!.id);
    const allowed = [ROLES.HEAD_ACCOUNTANT, ROLES.SUPERUSER, ROLES.GEN_DIRECTOR];
    if (!allowed.map(r => r.toUpperCase()).includes(senderRole.toUpperCase())) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const schoolIdParam = query?.schoolId ? parseInt(String(query.schoolId)) : null;

    const [currentUser] = await db.select({
      schoolId: users.school_id,
      canViewAll: users.can_view_all_schools,
    }).from(users).where(eq(users.id, user!.id)).limit(1);

    const isSuper = [ROLES.SUPERUSER, ROLES.GEN_DIRECTOR].includes(senderRole.toUpperCase());
    // HEAD_ACCOUNTANT всегда видит все кошельки — он источник гемов в системе
    const canViewAllSchools = isSuper || currentUser?.canViewAll ||
      senderRole.toUpperCase() === ROLES.HEAD_ACCOUNTANT;
    let effectiveSchoolId: number | null = null;
    if (schoolIdParam != null && !isNaN(schoolIdParam)) {
      // Фильтр по школе применяется только если явно выбрана
      effectiveSchoolId = schoolIdParam;
    }
    // Если не может видеть всё и нет фильтра — ограничиваем своей школой
    if (!canViewAllSchools && effectiveSchoolId == null && currentUser?.schoolId) {
      effectiveSchoolId = currentUser.schoolId;
    }

    // LEFT JOIN — показываем всех активных пользователей с кошельковыми ролями (даже без кошелька → баланс 0)
    const walletRoleList = Array.from(WALLET_ROLES).map(r => r.toLowerCase());
    const allRows = await db
      .select({
        userId: users.id,
        balance: gemsWallets.balance,
        updatedAt: gemsWallets.updatedAt,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        school_id: users.school_id,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(gemsWallets, eq(gemsWallets.userId, users.id))
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.is_active, true))
      .orderBy(desc(gemsWallets.balance));

    // Фильтруем только нужные роли на уровне JS (избегаем SQL IN с lower())
    const relevantRows = allRows.filter(r => walletRoleList.includes((r.role || '').toLowerCase()));

    let rows: typeof allRows;
    if (effectiveSchoolId != null) {
      const usersInSchool = await db.select({ userId: users.id }).from(users).where(eq(users.school_id, effectiveSchoolId));
      const fromUserSchool = await db.select({ userId: userSchools.userId }).from(userSchools).where(eq(userSchools.schoolId, effectiveSchoolId));
      const userIds = new Set([...usersInSchool.map((r) => r.userId), ...fromUserSchool.map((r) => r.userId)]);
      rows = relevantRows.filter((r) => userIds.has(r.userId));
    } else {
      rows = relevantRows;
    }

    return rows.map((r) => ({
      userId: r.userId,
      name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.userId,
      role: r.role,
      balance: Number(r.balance ?? 0),
      updatedAt: r.updatedAt,
      school_id: r.school_id,
      school_name: r.school_name,
    }));
  }, {
    query: t.Object({
      schoolId: t.Optional(t.Union([t.String(), t.Number()])),
    }),
  })

  // ── VENDOR MANAGEMENT (HEAD_ACCOUNTANT / SUPERUSER) ──
  // GET /cabinet/gems/vendors
  .get("/vendors", async (context: any) => {
    const { user, set } = context;
    const senderRole = await getUserRole(user!.id);
    const allowed = [ROLES.HEAD_ACCOUNTANT, ROLES.SUPERUSER, ROLES.GEN_DIRECTOR];
    if (!allowed.map(r => r.toUpperCase()).includes(senderRole.toUpperCase())) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({
        id: gemsVendors.id,
        userId: gemsVendors.userId,
        name: gemsVendors.name,
        terminalId: gemsVendors.terminalId,
        authToken: gemsVendors.authToken,
        isActive: gemsVendors.isActive,
        createdAt: gemsVendors.createdAt,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(gemsVendors)
      .innerJoin(users, eq(gemsVendors.userId, users.id));

    return rows.map((r) => ({
      ...r,
      userName: [r.first_name, r.last_name].filter(Boolean).join(" "),
    }));
  })

  // POST /cabinet/gems/vendors — create vendor profile
  .post("/vendors", async (context: any) => {
    const { user, body, set } = context;
    const senderRole = await getUserRole(user!.id);
    const allowed = [ROLES.HEAD_ACCOUNTANT, ROLES.SUPERUSER, ROLES.GEN_DIRECTOR];
    if (!allowed.map(r => r.toUpperCase()).includes(senderRole.toUpperCase())) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const { userId, name, terminalId } = body as any;
    const authToken = crypto.randomUUID();

    const [created] = await db.insert(gemsVendors).values({
      userId,
      name,
      terminalId: terminalId || null,
      authToken,
    }).returning();

    return created;
  }, {
    body: t.Object({
      userId: t.String(),
      name: t.String(),
      terminalId: t.Optional(t.String()),
    }),
  })

  // PATCH /cabinet/gems/vendors/:id — update vendor (toggle active, change terminalId)
  .patch("/vendors/:id", async (context: any) => {
    const { user, params, body, set } = context;
    const senderRole = await getUserRole(user!.id);
    const allowed = [ROLES.HEAD_ACCOUNTANT, ROLES.SUPERUSER, ROLES.GEN_DIRECTOR];
    if (!allowed.map(r => r.toUpperCase()).includes(senderRole.toUpperCase())) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const { isActive, terminalId, name } = body as any;
    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (terminalId !== undefined) updateData.terminalId = terminalId;
    if (name !== undefined) updateData.name = name;

    const [updated] = await db.update(gemsVendors)
      .set(updateData)
      .where(eq(gemsVendors.id, parseInt(params.id)))
      .returning();

    return updated;
  }, {
    body: t.Object({
      isActive: t.Optional(t.Boolean()),
      terminalId: t.Optional(t.String()),
      name: t.Optional(t.String()),
    }),
  })

  // ── TOP-UP REQUESTS (HEAD_ACCOUNTANT creates, GEN_DIRECTOR approves) ──

  // GET /cabinet/gems/topup-requests — HEAD_ACCOUNTANT: my requests list
  .get("/topup-requests", async (context: any) => {
    const { user, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.HEAD_ACCOUNTANT && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select()
      .from(gemsTopupRequests)
      .where(role.toUpperCase() === ROLES.SUPERUSER ? undefined : eq(gemsTopupRequests.requestedById, user!.id))
      .orderBy(desc(gemsTopupRequests.createdAt));

    return rows.map(r => ({ ...r, amount: Number(r.amount) }));
  })

  // POST /cabinet/gems/topup-requests — create request + log "created"
  .post("/topup-requests", async (context: any) => {
    const { user, body, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.HEAD_ACCOUNTANT && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const { title, amount, requestDate } = body as any;

    const [req] = await db.insert(gemsTopupRequests).values({
      title,
      requestedById: user!.id,
      amount: String(amount),
      requestDate: new Date(requestDate),
      status: "pending_director",
    }).returning();

    await db.insert(gemsTopupLogs).values({
      requestId: req.id,
      actorId: user!.id,
      actorRole: role,
      action: "created",
    });

    return { ...req, amount: Number(req.amount) };
  }, {
    body: t.Object({
      title: t.String(),
      amount: t.Number(),
      requestDate: t.String(),
    }),
  })

  // GET /cabinet/gems/topup-requests/for-director — GEN_DIRECTOR: list pending_director
  .get("/topup-requests/for-director", async (context: any) => {
    const { user, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.GEN_DIRECTOR && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({
        id: gemsTopupRequests.id,
        title: gemsTopupRequests.title,
        amount: gemsTopupRequests.amount,
        requestDate: gemsTopupRequests.requestDate,
        status: gemsTopupRequests.status,
        createdAt: gemsTopupRequests.createdAt,
        requestedById: gemsTopupRequests.requestedById,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(gemsTopupRequests)
      .innerJoin(users, eq(gemsTopupRequests.requestedById, users.id))
      .where(eq(gemsTopupRequests.status, "pending_director"))
      .orderBy(desc(gemsTopupRequests.createdAt));

    return rows.map(r => ({
      ...r,
      amount: Number(r.amount),
      requesterName: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.requestedById,
    }));
  })

  // GET /cabinet/gems/topup-requests/director-all — GEN_DIRECTOR: все заявки с полными логами
  .get("/topup-requests/director-all", async (context: any) => {
    const { user, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.GEN_DIRECTOR && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({
        id: gemsTopupRequests.id,
        title: gemsTopupRequests.title,
        amount: gemsTopupRequests.amount,
        requestDate: gemsTopupRequests.requestDate,
        status: gemsTopupRequests.status,
        directorComment: gemsTopupRequests.directorComment,
        directorActedAt: gemsTopupRequests.directorActedAt,
        adminActedAt: gemsTopupRequests.adminActedAt,
        createdAt: gemsTopupRequests.createdAt,
        requestedById: gemsTopupRequests.requestedById,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(gemsTopupRequests)
      .innerJoin(users, eq(gemsTopupRequests.requestedById, users.id))
      .orderBy(desc(gemsTopupRequests.createdAt));

    const enriched = await Promise.all(rows.map(async (r) => {
      const logs = await db
        .select({
          id: gemsTopupLogs.id,
          actorRole: gemsTopupLogs.actorRole,
          action: gemsTopupLogs.action,
          comment: gemsTopupLogs.comment,
          createdAt: gemsTopupLogs.createdAt,
          firstName: users.first_name,
          lastName: users.last_name,
        })
        .from(gemsTopupLogs)
        .leftJoin(users, eq(gemsTopupLogs.actorId, users.id))
        .where(eq(gemsTopupLogs.requestId, r.id))
        .orderBy(gemsTopupLogs.createdAt);

      return {
        id: r.id,
        title: r.title,
        amount: Number(r.amount),
        requestDate: r.requestDate,
        status: r.status,
        directorComment: r.directorComment,
        directorActedAt: r.directorActedAt,
        adminActedAt: r.adminActedAt,
        createdAt: r.createdAt,
        requesterName: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.requestedById,
        logs: logs.map(l => ({
          id: l.id,
          actorRole: l.actorRole,
          action: l.action,
          comment: l.comment,
          createdAt: l.createdAt,
          actorName: [l.firstName, l.lastName].filter(Boolean).join(" ") || "",
        })),
      };
    }));

    return enriched;
  })

  // GET /cabinet/gems/topup-requests/:id — detail + logs
  .get("/topup-requests/:id", async (context: any) => {
    const { user, params, set } = context;
    const role = await getUserRole(user!.id);

    const [req] = await db
      .select()
      .from(gemsTopupRequests)
      .where(eq(gemsTopupRequests.id, parseInt(params.id)))
      .limit(1);

    if (!req) { set.status = 404; return { error: "Not found" }; }

    // HEAD_ACCOUNTANT can only see their own; GEN_DIRECTOR/SUPERUSER see all
    const roleUp = role.toUpperCase();
    if (roleUp === ROLES.HEAD_ACCOUNTANT && req.requestedById !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const logs = await db
      .select({
        id: gemsTopupLogs.id,
        actorId: gemsTopupLogs.actorId,
        actorRole: gemsTopupLogs.actorRole,
        action: gemsTopupLogs.action,
        comment: gemsTopupLogs.comment,
        createdAt: gemsTopupLogs.createdAt,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(gemsTopupLogs)
      .leftJoin(users, eq(gemsTopupLogs.actorId, users.id))
      .where(eq(gemsTopupLogs.requestId, req.id))
      .orderBy(gemsTopupLogs.createdAt);

    return {
      ...req,
      amount: Number(req.amount),
      logs: logs.map(l => ({
        ...l,
        actorName: [l.firstName, l.lastName].filter(Boolean).join(" ") || l.actorId || "",
      })),
    };
  })

  // PATCH /cabinet/gems/topup-requests/:id — resubmit rejected request
  .patch("/topup-requests/:id", async (context: any) => {
    const { user, params, body, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.HEAD_ACCOUNTANT && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [req] = await db.select().from(gemsTopupRequests).where(eq(gemsTopupRequests.id, parseInt(params.id))).limit(1);
    if (!req) { set.status = 404; return { error: "Not found" }; }
    if (req.requestedById !== user!.id && role.toUpperCase() !== ROLES.SUPERUSER) { set.status = 403; return { error: "Forbidden" }; }
    if (req.status !== "rejected") { set.status = 400; return { error: "Can only resubmit rejected requests" }; }

    const { title, amount, requestDate } = body as any;
    const updateData: any = { status: "pending_director", updatedAt: new Date(), directorComment: null, directorId: null, directorActedAt: null };
    if (title) updateData.title = title;
    if (amount) updateData.amount = String(amount);
    if (requestDate) updateData.requestDate = new Date(requestDate);

    const [updated] = await db.update(gemsTopupRequests).set(updateData).where(eq(gemsTopupRequests.id, req.id)).returning();

    await db.insert(gemsTopupLogs).values({
      requestId: req.id,
      actorId: user!.id,
      actorRole: role,
      action: "resubmitted",
    });

    return { ...updated, amount: Number(updated.amount) };
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      amount: t.Optional(t.Number()),
      requestDate: t.Optional(t.String()),
    }),
  })

  // POST /cabinet/gems/topup-requests/:id/approve — GEN_DIRECTOR approves
  .post("/topup-requests/:id/approve", async (context: any) => {
    const { user, params, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.GEN_DIRECTOR && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [req] = await db.select().from(gemsTopupRequests).where(eq(gemsTopupRequests.id, parseInt(params.id))).limit(1);
    if (!req) { set.status = 404; return { error: "Not found" }; }
    if (req.status !== "pending_director") { set.status = 400; return { error: "Request is not pending director approval" }; }

    const [updated] = await db.update(gemsTopupRequests)
      .set({ status: "pending_admin", directorId: user!.id, directorActedAt: new Date(), updatedAt: new Date() })
      .where(eq(gemsTopupRequests.id, req.id))
      .returning();

    await db.insert(gemsTopupLogs).values({
      requestId: req.id,
      actorId: user!.id,
      actorRole: role,
      action: "director_approved",
    });

    return { ...updated, amount: Number(updated.amount) };
  })

  // POST /cabinet/gems/topup-requests/:id/reject — GEN_DIRECTOR rejects
  .post("/topup-requests/:id/reject", async (context: any) => {
    const { user, params, body, set } = context;
    const role = await getUserRole(user!.id);
    if (role.toUpperCase() !== ROLES.GEN_DIRECTOR && role.toUpperCase() !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [req] = await db.select().from(gemsTopupRequests).where(eq(gemsTopupRequests.id, parseInt(params.id))).limit(1);
    if (!req) { set.status = 404; return { error: "Not found" }; }
    if (req.status !== "pending_director") { set.status = 400; return { error: "Request is not pending director approval" }; }

    const { comment } = (body as any) || {};

    const [updated] = await db.update(gemsTopupRequests)
      .set({ status: "rejected", directorId: user!.id, directorComment: comment || null, directorActedAt: new Date(), updatedAt: new Date() })
      .where(eq(gemsTopupRequests.id, req.id))
      .returning();

    await db.insert(gemsTopupLogs).values({
      requestId: req.id,
      actorId: user!.id,
      actorRole: role,
      action: "director_rejected",
      comment: comment || null,
    });

    return { ...updated, amount: Number(updated.amount) };
  }, {
    body: t.Object({
      comment: t.Optional(t.String()),
    }),
  });
