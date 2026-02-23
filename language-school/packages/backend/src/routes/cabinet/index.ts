/**
 * Cabinet API — личные кабинеты для STUDENT, TEACHER, PARENT и др.
 * Доступ: любой аутентифицированный пользователь. user приходит из authMiddleware.
 */
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users, schools, salesCalls, userRoles, userSchools, mailingMessages, mailingRecipients, htCourses, htGroups, htGroupStudents, htLessons, htAttendance, htGrades, htGames, htGameResults } from "../../db/schema";
import { eq, ne, desc, and, gte, lte, or, inArray } from "drizzle-orm";
import { ROLES } from "../../constants/roles";
import { generateId } from "lucia";
import { generateUniqueUsername, generateRandomPassword } from "../../services/user-services";

// Хелпер для проверки роли (основная или дополнительная)
async function hasRole(userId: string, role: string): Promise<boolean> {
  // Проверяем основную роль
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === role || user?.role === ROLES.SUPERUSER) {
    return true;
  }
  
  // Проверяем дополнительные роли
  const additionalRoles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  
  return additionalRoles.some(r => r.role === role);
}

export const cabinetRoutes = new Elysia({ prefix: "/cabinet" })
  .onBeforeHandle((context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/profile", async (context: any) => {
    const { user } = context;
    const [row] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        avatar: users.avatar,
        video: users.video,
        role: users.role,
        school_id: users.school_id,
        parent_id: users.parent_id,
        can_export_excel: users.can_export_excel,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.id, user!.id));
    if (!row) return { error: "Not found" };
    
    // Получаем дополнительные роли
    const additionalRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, user!.id));
    
    return {
      ...row,
      additional_roles: additionalRoles.map(r => r.role),
    };
  })
  .patch("/profile", async (context: any) => {
    const { user, body, set } = context;
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    // Имя и фамилия не могут быть изменены через профиль
    // if (payload.first_name !== undefined) updateData.first_name = payload.first_name;
    // if (payload.last_name !== undefined) updateData.last_name = payload.last_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    // Аватар не может быть изменен через профиль (безопасность)
    // if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.video !== undefined) updateData.video = payload.video;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user!.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })
  .post("/change-password", async (context: any) => {
    const { user, body, set } = context;
    const { currentPassword, newPassword } = body;
    const [dbUser] = await db.select().from(users).where(eq(users.id, user!.id));
    if (!dbUser) {
      set.status = 404;
      return { error: "User not found" };
    }
    const isValid = await Bun.password.verify(currentPassword, dbUser.password_hash);
    if (!isValid) {
      set.status = 400;
      return { error: "Invalid current password" };
    }
    if (!newPassword || newPassword.length < 6) {
      set.status = 400;
      return { error: "New password must be at least 6 characters" };
    }
    const password_hash = await Bun.password.hash(newPassword, { algorithm: "bcrypt" });
    await db.update(users).set({ password_hash }).where(eq(users.id, user!.id));
    return { message: "Password changed successfully" };
  }, {
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String(),
    }),
  })
  .get("/children", async (context: any) => {
    const { user } = context;
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.parent_id, user!.id));
    return rows.map((r) => ({
      ...r,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
    }));
  })
  // Получение входящих сообщений (рассылок) для текущего пользователя
  .get("/mailing", async (context: any) => {
    const { user } = context;
    const rows = await db
      .select({
        id: mailingRecipients.id,
        messageId: mailingMessages.id,
        title: mailingMessages.title,
        content: mailingMessages.content,
        isRead: mailingRecipients.isRead,
        readAt: mailingRecipients.readAt,
        receivedAt: mailingRecipients.receivedAt,
        senderUsername: users.username,
      })
      .from(mailingRecipients)
      .innerJoin(mailingMessages, eq(mailingRecipients.messageId, mailingMessages.id))
      .leftJoin(users, eq(mailingMessages.createdById, users.id))
      .where(eq(mailingRecipients.recipientId, user!.id))
      .orderBy(desc(mailingRecipients.receivedAt));
    
    return rows.map(r => ({
      id: r.id,
      message_id: r.messageId,
      title: r.title,
      content: r.content,
      is_read: r.isRead,
      read_at: r.readAt?.toISOString(),
      received_at: r.receivedAt.toISOString(),
      sender: r.senderUsername,
    }));
  })
  .post("/mailing/:id/read", async (context: any) => {
    const { user, params: { id } } = context;
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(mailingRecipients.id, parseInt(id)), eq(mailingRecipients.recipientId, user!.id)));
    return { success: true };
  })
  .post("/mailing/read-all", async (context: any) => {
    const { user } = context;
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(mailingRecipients.recipientId, user!.id), eq(mailingRecipients.isRead, false)));
    return { success: true };
  })
  // Группы для текущего пользователя (учителя или ученика)
  .get("/my-groups", async (context: any) => {
    const { user } = context;
    const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
    
    if (u?.role === ROLES.TEACHER) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          courseName: htCourses.name,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
        })
        .from(htGroups)
        .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .where(eq(htGroups.teacherId, user!.id))
        .orderBy(desc(htGroups.createdAt));
      return rows;
    } else if (u?.role === ROLES.STUDENT) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          courseName: htCourses.name,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
        })
        .from(htGroupStudents)
        .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
        .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .where(eq(htGroupStudents.userId, user!.id))
        .orderBy(desc(htGroups.createdAt));
      return rows;
    }
    return [];
  })
  // SALES: Дневник звонков
  .get("/sales/calls", async (context: any) => {
    const { user, query } = context;
    // Проверяем роль SALES
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return [];

    const dateFrom = query.from ? new Date(query.from as string) : undefined;
    const dateTo = query.to ? new Date(query.to as string) : undefined;
    const outcome = query.outcome as string | undefined;

    let q = db
      .select({
        id: salesCalls.id,
        firstName: salesCalls.firstName,
        lastName: salesCalls.lastName,
        phone: salesCalls.phone,
        datetime: salesCalls.datetime,
        outcome: salesCalls.outcome,
        notes: salesCalls.notes,
        created_at: salesCalls.created_at,
      })
      .from(salesCalls)
      .where(eq(salesCalls.salesManagerId, user!.id))
      .orderBy(desc(salesCalls.datetime));

    const rows = await q;
    let filtered = rows;

    if (dateFrom) filtered = filtered.filter(r => new Date(r.datetime) >= dateFrom);
    if (dateTo) filtered = filtered.filter(r => new Date(r.datetime) <= dateTo);
    if (outcome) filtered = filtered.filter(r => r.outcome === outcome);

    return filtered;
  }, {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
    }),
  })
  .get("/sales/calls/:id", async (context: any) => {
    const { user, params: { id } } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return { error: "Forbidden" };

    const [row] = await db
      .select()
      .from(salesCalls)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)))
      .limit(1);
    return row || { error: "Not found" };
  })
  .post("/sales/calls", async (context: any) => {
    const { user, body, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const { firstName, lastName, phone, datetime, outcome, notes } = body;
    const [created] = await db.insert(salesCalls).values({
      salesManagerId: user!.id,
      firstName,
      lastName,
      phone,
      datetime: new Date(datetime),
      outcome,
      notes,
    }).returning();

    return created;
  }, {
    body: t.Object({
      firstName: t.String(),
      lastName: t.String(),
      phone: t.String(),
      datetime: t.String(),
      outcome: t.String(),
      notes: t.Optional(t.String()),
    }),
  })
  .patch("/sales/calls/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const payload = body as any;
    const updateData: any = { updated_at: new Date() };
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.datetime !== undefined) updateData.datetime = new Date(payload.datetime);
    if (payload.outcome !== undefined) updateData.outcome = payload.outcome;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    const [updated] = await db
      .update(salesCalls)
      .set(updateData)
      .where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)))
      .returning();

    return updated || { error: "Not found" };
  }, {
    body: t.Object({
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      datetime: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
      notes: t.Optional(t.String()),
    }),
  })
  .delete("/sales/calls/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db.delete(salesCalls).where(and(eq(salesCalls.id, parseInt(id)), eq(salesCalls.salesManagerId, user!.id)));
    return { message: "Deleted" };
  })
  .get("/sales/stats", async (context: any) => {
    const { user } = context;
    const isSales = await hasRole(user!.id, ROLES.SALES);
    if (!isSales) return { error: "Forbidden" };

    const rows = await db
      .select({ outcome: salesCalls.outcome })
      .from(salesCalls)
      .where(eq(salesCalls.salesManagerId, user!.id));

    const stats = {
      total: rows.length,
      no_answer: rows.filter(r => r.outcome === 'no_answer').length,
      interested: rows.filter(r => r.outcome === 'interested').length,
      not_interested: rows.filter(r => r.outcome === 'not_interested').length,
      follow_up: rows.filter(r => r.outcome === 'follow_up').length,
    };

    // Группировка по дням за последние 7 дней
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const dailyRows = await db
      .select({ datetime: salesCalls.datetime, outcome: salesCalls.outcome })
      .from(salesCalls)
      .where(and(eq(salesCalls.salesManagerId, user!.id), gte(salesCalls.datetime, weekAgo)));

    const dailyStats: Record<string, any> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyStats[dateStr] = { total: 0, interested: 0 };
    }

    dailyRows.forEach(r => {
      const dateStr = r.datetime.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        if (r.outcome === 'interested') dailyStats[dateStr].interested++;
      }
    });

    const outcomeStats = [
      { label: "Нет ответа", value: stats.no_answer, color: "#9e9e9e" },
      { label: "Интересно", value: stats.interested, color: "#4caf50" },
      { label: "Не интересно", value: stats.not_interested, color: "#f44336" },
      { label: "Перезвонить", value: stats.follow_up, color: "#2196f3" },
    ];

    return {
      summary: stats,
      daily: Object.entries(dailyStats).map(([date, data]) => ({ date, ...data as any })).reverse(),
      outcomes: outcomeStats,
    };
  })
  .group("/head-teacher", (app) =>
    app
      .onBeforeHandle(async (context: any) => {
        const { user, set } = context;
        const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user!.id)).limit(1);
        
        // Разрешаем доступ: Суперпользователю, Завучу ИЛИ Учителю
        const allowedRoles = [ROLES.SUPERUSER, ROLES.HEAD_TEACHER, ROLES.TEACHER];
        
        if (!allowedRoles.includes(u?.role as any)) {
          // Если основной роли нет в списке, проверяем дополнительные роли
          const isHt = await hasRole(user!.id, ROLES.HEAD_TEACHER);
          const isTeacher = await hasRole(user!.id, ROLES.TEACHER);
          
          if (!isHt && !isTeacher) {
            set.status = 403;
            return { error: "Forbidden" };
          }
        }
      })
      // Users (Students & Parents)
      .get("/users", async (context: any) => {
        const { user } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const schoolId = u?.school_id;
        const rows = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            first_name: users.first_name,
            last_name: users.last_name,
            role: users.role,
            phone: users.phone,
            avatar: users.avatar,
            rfid_uid: users.rfid_uid,
            school_id: users.school_id,
            parent_id: users.parent_id,
            school_name: schools.name,
          })
          .from(users)
          .leftJoin(schools, eq(users.school_id, schools.id))
          .orderBy(desc(users.created_at));
        let filtered = rows.filter((r) => r.role === ROLES.STUDENT || r.role === ROLES.PARENT);
        if (schoolId != null && u?.role === ROLES.HEAD_TEACHER) {
          const userIdsInMySchool = await db
            .select({ userId: userSchools.userId })
            .from(userSchools)
            .where(eq(userSchools.schoolId, schoolId));
          const idsSet = new Set(userIdsInMySchool.map((x) => x.userId));
          filtered = filtered.filter(
            (r) => r.role === ROLES.PARENT || r.school_id === schoolId || idsSet.has(r.id)
          );
        }
        return filtered.map((r) => ({
          ...r,
          full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
        }));
      })
      .post("/users", async (context: any) => {
        const { user, body } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const role = (body.role as string) === ROLES.PARENT ? ROLES.PARENT : ROLES.STUDENT;
        const first_name = (body.first_name as string)?.trim();
        const last_name = (body.last_name as string)?.trim();
        const email = (body.email as string)?.trim();
        const phone = (body.phone as string)?.trim() || null;
        const school_id = role === ROLES.STUDENT ? (u?.school_id ?? (body.school_id as number)) : null;
        const parent_id = role === ROLES.STUDENT ? (body.parent_id as string | undefined) || null : null;
        const auto_generate = role === ROLES.STUDENT && (body.auto_generate as boolean) !== false;
        const avatar = (body.avatar as string)?.trim() || null;
        const rfid_uid = role === ROLES.STUDENT ? ((body.rfid_uid as string)?.trim() || null) : null;

        if (!first_name || !last_name) {
          throw new Error("first_name and last_name are required");
        }

        let username = (body.username as string)?.trim();
        let password = body.password as string | undefined;

        if (role === ROLES.STUDENT && auto_generate) {
          username = await generateUniqueUsername(first_name);
          password = generateRandomPassword();
        } else {
          if (!username) throw new Error("username is required");
          if (!password || password.length < 6) throw new Error("password must be at least 6 characters");
        }

        const existing = await db.select().from(users).where(eq(users.username, username));
        if (existing.length > 0) throw new Error("username already exists");

        const id = generateId(15);
        const password_hash = await Bun.password.hash(password, { algorithm: "bcrypt" });

        await db.insert(users).values({
          id,
          username,
          password_hash,
          email: email || null,
          first_name,
          last_name,
          role,
          phone,
          avatar,
          rfid_uid,
          school_id,
          parent_id,
          can_export_excel: false,
        });

        const [created] = await db.select().from(users).where(eq(users.id, id));
        const { password_hash: _, ...profile } = created!;
        return {
          user: { ...profile, full_name: [first_name, last_name].join(" ") },
          credentials: role === ROLES.STUDENT && auto_generate ? { username, password } : undefined,
        };
      }, {
        body: t.Object({
          role: t.Union([t.Literal("STUDENT"), t.Literal("PARENT")]),
          first_name: t.String(),
          last_name: t.String(),
          email: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          username: t.Optional(t.String()),
          password: t.Optional(t.String()),
          auto_generate: t.Optional(t.Boolean()),
          avatar: t.Optional(t.String()),
          rfid_uid: t.Optional(t.String()),
          school_id: t.Optional(t.Number()),
          parent_id: t.Optional(t.String()),
        }),
      })
      .get("/users/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            first_name: users.first_name,
            last_name: users.last_name,
            role: users.role,
            phone: users.phone,
            avatar: users.avatar,
            rfid_uid: users.rfid_uid,
            school_id: users.school_id,
            parent_id: users.parent_id,
            school_name: schools.name,
          })
          .from(users)
          .leftJoin(schools, eq(users.school_id, schools.id))
          .where(eq(users.id, id));
        if (!row || (row.role !== ROLES.STUDENT && row.role !== ROLES.PARENT)) {
          set.status = 404;
          return { error: "Not found" };
        }
        if (u?.role === ROLES.HEAD_TEACHER && u?.school_id != null) {
          const inMainSchool = row.school_id === u.school_id;
          const extraSchools = await db.select().from(userSchools).where(eq(userSchools.userId, id));
          const inExtraSchool = extraSchools.some((r) => r.schoolId === u.school_id);
          if (!inMainSchool && !inExtraSchool) {
            set.status = 404;
            return { error: "Not found" };
          }
        }
        return { ...row, full_name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.username };
      })
      .patch("/users/:id", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!existing || (existing.role !== ROLES.STUDENT && existing.role !== ROLES.PARENT)) {
          set.status = 404;
          return { error: "Not found" };
        }
        if (u?.role === ROLES.HEAD_TEACHER && u?.school_id != null) {
          const inMainSchool = existing.school_id === u.school_id;
          const extraSchools = await db.select().from(userSchools).where(eq(userSchools.userId, id));
          const inExtraSchool = extraSchools.some((r) => r.schoolId === u.school_id);
          if (!inMainSchool && !inExtraSchool) {
            set.status = 404;
            return { error: "Not found" };
          }
        }
        const payload = body as Record<string, unknown>;
        const updateData: Record<string, unknown> = {};
        if (payload.first_name !== undefined) updateData.first_name = String(payload.first_name).trim();
        if (payload.last_name !== undefined) updateData.last_name = String(payload.last_name).trim();
        if (payload.email !== undefined) updateData.email = (payload.email as string)?.trim() || null;
        if (payload.phone !== undefined) updateData.phone = (payload.phone as string)?.trim() || null;
        if (payload.avatar !== undefined) updateData.avatar = (payload.avatar as string)?.trim() || null;
        if (existing.role === ROLES.STUDENT && payload.rfid_uid !== undefined) updateData.rfid_uid = (payload.rfid_uid as string)?.trim() || null;
        if (existing.role === ROLES.STUDENT && payload.parent_id !== undefined) {
          updateData.parent_id = payload.parent_id || null;
        }
        if (payload.password !== undefined && payload.password && String(payload.password).length >= 6) {
          updateData.password_hash = await Bun.password.hash(String(payload.password), { algorithm: "bcrypt" });
        }
        const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
        if (!updated) return { error: "Not found" };
        const { password_hash: _, ...profile } = updated;
        return { ...profile, full_name: [updated.first_name, updated.last_name].filter(Boolean).join(" ") || updated.username };
      }, {
        body: t.Object({
          first_name: t.Optional(t.String()),
          last_name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          avatar: t.Optional(t.String()),
          rfid_uid: t.Optional(t.Nullable(t.String())),
          parent_id: t.Optional(t.Nullable(t.String())),
          password: t.Optional(t.String()),
        }),
      })

      // Mailing
      .get("/mailing", async (context: any) => {
        const { user } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const rows = u?.role === ROLES.SUPERUSER
          ? await db
              .select({
                id: mailingMessages.id,
                title: mailingMessages.title,
                content: mailingMessages.content,
                recipientType: mailingMessages.recipientType,
                scheduledAt: mailingMessages.scheduledAt,
                sentAt: mailingMessages.sentAt,
                isSent: mailingMessages.isSent,
                totalRecipients: mailingMessages.totalRecipients,
                createdAt: mailingMessages.createdAt,
                createdByUsername: users.username,
              })
              .from(mailingMessages)
              .leftJoin(users, eq(mailingMessages.createdById, users.id))
              .orderBy(desc(mailingMessages.createdAt))
          : await db
              .select({
                id: mailingMessages.id,
                title: mailingMessages.title,
                content: mailingMessages.content,
                recipientType: mailingMessages.recipientType,
                scheduledAt: mailingMessages.scheduledAt,
                sentAt: mailingMessages.sentAt,
                isSent: mailingMessages.isSent,
                totalRecipients: mailingMessages.totalRecipients,
                createdAt: mailingMessages.createdAt,
                createdByUsername: users.username,
              })
              .from(mailingMessages)
              .leftJoin(users, eq(mailingMessages.createdById, users.id))
              .where(eq(mailingMessages.schoolId, u!.school_id!))
              .orderBy(desc(mailingMessages.createdAt));
        const recipientTypeLabels: Record<string, string> = {
          all: "Все",
          students: "Ученики",
          parents: "Родители",
          teachers: "Учителя",
        };
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          recipient_type: r.recipientType,
          recipient_type_display: recipientTypeLabels[r.recipientType] || r.recipientType,
          created_by_username: r.createdByUsername,
          scheduled_at: r.scheduledAt?.toISOString() ?? null,
          sent_at: r.sentAt?.toISOString() ?? null,
          is_sent: r.isSent,
          total_recipients: r.totalRecipients,
          created_at: r.createdAt?.toISOString(),
        }));
      })
      .get("/mailing/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [msg] = await db
          .select({
            id: mailingMessages.id,
            title: mailingMessages.title,
            content: mailingMessages.content,
            recipientType: mailingMessages.recipientType,
            schoolId: mailingMessages.schoolId,
            scheduledAt: mailingMessages.scheduledAt,
            sentAt: mailingMessages.sentAt,
            isSent: mailingMessages.isSent,
            totalRecipients: mailingMessages.totalRecipients,
            createdAt: mailingMessages.createdAt,
            createdByUsername: users.username,
          })
          .from(mailingMessages)
          .leftJoin(users, eq(mailingMessages.createdById, users.id))
          .where(eq(mailingMessages.id, parseInt(id)));
        if (!msg || (u?.role === ROLES.HEAD_TEACHER && msg.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const recipientTypeLabels: Record<string, string> = {
          all: "Все",
          students: "Ученики",
          parents: "Родители",
          teachers: "Учителя",
        };
        return {
          id: msg.id,
          title: msg.title,
          content: msg.content,
          recipient_type: msg.recipientType,
          recipient_type_display: recipientTypeLabels[msg.recipientType] || msg.recipientType,
          created_by_username: msg.createdByUsername,
          scheduled_at: msg.scheduledAt?.toISOString() ?? null,
          sent_at: msg.sentAt?.toISOString() ?? null,
          is_sent: msg.isSent,
          total_recipients: msg.totalRecipients,
          created_at: msg.createdAt?.toISOString(),
        };
      })
      .post("/mailing", async (context: any) => {
        const { user, body } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const title = (body.title as string)?.trim();
        const content = (body.content as string)?.trim();
        const recipientType = (body.recipient_type as string) || "all";
        const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at as string) : null;
        if (!title || !content) throw new Error("title and content are required");
        const [created] = await db
          .insert(mailingMessages)
          .values({
            title,
            content,
            recipientType,
            createdById: user!.id,
            schoolId: u?.school_id ?? null,
            scheduledAt,
            isSent: false,
            totalRecipients: 0,
          })
          .returning();
        return {
          id: created.id,
          title: created.title,
          content: created.content,
          recipient_type: created.recipientType,
          is_sent: false,
          total_recipients: 0,
          created_at: created.createdAt?.toISOString(),
        };
      }, {
        body: t.Object({
          title: t.String(),
          content: t.String(),
          recipient_type: t.Optional(t.String()),
          scheduled_at: t.Optional(t.Nullable(t.String())),
        }),
      })
      .post("/mailing/:id/send", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [msg] = await db.select().from(mailingMessages).where(eq(mailingMessages.id, parseInt(id))).limit(1);
        if (!msg || (u?.role === ROLES.HEAD_TEACHER && msg.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        if (msg.isSent) {
          set.status = 400;
          return { error: "Message already sent" };
        }
        const schoolId = msg.schoolId ?? u?.school_id;
        let targetUserIds: string[] = [];
        const schoolUserIds = new Set<string>();
        if (schoolId) {
          const fromMain = await db.select({ id: users.id }).from(users).where(eq(users.school_id, schoolId));
          fromMain.forEach((r) => schoolUserIds.add(r.id));
          const fromExtra = await db.select({ userId: userSchools.userId }).from(userSchools).where(eq(userSchools.schoolId, schoolId));
          fromExtra.forEach((r) => schoolUserIds.add(r.userId));
        } else if (u?.role === ROLES.SUPERUSER) {
          // Если суперпользователь и школа не указана, берем всех пользователей системы
          const allUsers = await db.select({ id: users.id }).from(users);
          allUsers.forEach((r) => schoolUserIds.add(r.id));
        }
        const ids = Array.from(schoolUserIds);
        if (ids.length > 0) {
          if (msg.recipientType === "students") {
            const rows = await db.select({ id: users.id }).from(users).where(and(inArray(users.id, ids), eq(users.role, ROLES.STUDENT)));
            targetUserIds = rows.map((r) => r.id);
          } else if (msg.recipientType === "parents") {
            const rows = await db.select({ id: users.id }).from(users).where(and(inArray(users.id, ids), eq(users.role, ROLES.PARENT)));
            targetUserIds = rows.map((r) => r.id);
          } else if (msg.recipientType === "teachers") {
            const rows = await db.select({ id: users.id }).from(users).where(and(inArray(users.id, ids), eq(users.role, ROLES.TEACHER)));
            targetUserIds = rows.map((r) => r.id);
          } else {
            // "all" - students, parents, and teachers
            const rows = await db.select({ id: users.id }).from(users).where(
              and(
                inArray(users.id, ids), 
                or(
                  eq(users.role, ROLES.STUDENT), 
                  eq(users.role, ROLES.PARENT), 
                  eq(users.role, ROLES.TEACHER)
                )
              )
            );
            targetUserIds = rows.map((r) => r.id);
          }
        }
        for (const rid of targetUserIds) {
          await db.insert(mailingRecipients).values({
            messageId: msg.id,
            recipientId: rid,
            isRead: false,
          });
        }
        await db
          .update(mailingMessages)
          .set({ isSent: true, sentAt: new Date(), totalRecipients: targetUserIds.length })
          .where(eq(mailingMessages.id, msg.id));
        return { message: "Sent", total_recipients: targetUserIds.length };
      })
      .delete("/mailing/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [msg] = await db.select().from(mailingMessages).where(eq(mailingMessages.id, parseInt(id))).limit(1);
        if (!msg || (u?.role === ROLES.HEAD_TEACHER && msg.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        await db.delete(mailingRecipients).where(eq(mailingRecipients.messageId, parseInt(id)));
        await db.delete(mailingMessages).where(eq(mailingMessages.id, parseInt(id)));
        return { message: "Deleted" };
      })
      .get("/mailing/:id/recipients", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [msg] = await db.select().from(mailingMessages).where(eq(mailingMessages.id, parseInt(id))).limit(1);
        if (!msg || (u?.role === ROLES.HEAD_TEACHER && msg.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const rows = await db
          .select({
            id: mailingRecipients.id,
            recipientId: mailingRecipients.recipientId,
            isRead: mailingRecipients.isRead,
            readAt: mailingRecipients.readAt,
            receivedAt: mailingRecipients.receivedAt,
            firstName: users.first_name,
            lastName: users.last_name,
            username: users.username,
          })
          .from(mailingRecipients)
          .leftJoin(users, eq(mailingRecipients.recipientId, users.id))
          .where(eq(mailingRecipients.messageId, parseInt(id)));
        return {
          recipients: rows.map((r) => ({
            id: r.id,
            recipient: r.recipientId,
            recipient_name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.username,
            recipient_username: r.username,
            is_read: r.isRead,
            read_at: r.readAt?.toISOString() ?? null,
            received_at: r.receivedAt?.toISOString(),
          })),
        };
      })

      // Courses
      .get("/courses", async (context: any) => {
        const { user, query } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const rows = u?.role === ROLES.SUPERUSER
          ? await db.select().from(htCourses).orderBy(desc(htCourses.createdAt))
          : await db.select().from(htCourses).where(eq(htCourses.schoolId, u!.school_id!)).orderBy(desc(htCourses.createdAt));
        const search = (query.search as string)?.trim();
        const isActive = query.is_active;
        let filtered = rows;
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((r) =>
            r.name?.toLowerCase().includes(s) ||
            r.description?.toLowerCase().includes(s) ||
            r.language?.toLowerCase().includes(s) ||
            r.level?.toLowerCase().includes(s)
          );
        }
        if (isActive === "true" || isActive === "false") {
          filtered = filtered.filter((r) => r.isActive === (isActive === "true"));
        }
        return filtered.map((r) => ({
          id: r.id,
          name: r.name,
          language: r.language,
          level: r.level,
          description: r.description,
          duration_months: r.durationMonths,
          is_active: r.isActive,
          school_id: r.schoolId,
          created_at: r.createdAt?.toISOString(),
        }));
      })
      .get("/courses/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        return {
          id: row.id,
          name: row.name,
          language: row.language,
          level: row.level,
          description: row.description,
          duration_months: row.durationMonths,
          is_active: row.isActive,
          school_id: row.schoolId,
          created_at: row.createdAt?.toISOString(),
          updated_at: row.updatedAt?.toISOString(),
        };
      })
      .post("/courses", async (context: any) => {
        const { user, body } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const name = (body.name as string)?.trim();
        const language = (body.language as string)?.trim();
        const level = (body.level as string)?.trim();
        if (!name || !language || !level) throw new Error("name, language, level are required");
        const [created] = await db
          .insert(htCourses)
          .values({
            name,
            language,
            level,
            description: (body.description as string)?.trim() || null,
            durationMonths: (body.duration_months as number) ?? 3,
            schoolId: u?.school_id ?? null,
            isActive: (body.is_active as boolean) !== false,
          })
          .returning();
        return {
          id: created.id,
          name: created.name,
          language: created.language,
          level: created.level,
          description: created.description,
          duration_months: created.durationMonths,
          is_active: created.isActive,
          created_at: created.createdAt?.toISOString(),
        };
      }, {
        body: t.Object({
          name: t.String(),
          language: t.String(),
          level: t.String(),
          description: t.Optional(t.String()),
          duration_months: t.Optional(t.Number()),
          is_active: t.Optional(t.Boolean()),
        }),
      })
      .patch("/courses/:id", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const payload = body as Record<string, unknown>;
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (payload.name !== undefined) updateData.name = String(payload.name).trim();
        if (payload.language !== undefined) updateData.language = String(payload.language).trim();
        if (payload.level !== undefined) updateData.level = String(payload.level).trim();
        if (payload.description !== undefined) updateData.description = (payload.description as string)?.trim() || null;
        if (payload.duration_months !== undefined) updateData.durationMonths = payload.duration_months as number;
        if (payload.is_active !== undefined) updateData.isActive = payload.is_active as boolean;
        const [updated] = await db.update(htCourses).set(updateData as any).where(eq(htCourses.id, parseInt(id))).returning();
        if (!updated) return { error: "Not found" };
        return {
          id: updated.id,
          name: updated.name,
          language: updated.language,
          level: updated.level,
          description: updated.description,
          duration_months: updated.durationMonths,
          is_active: updated.isActive,
          updated_at: updated.updatedAt?.toISOString(),
        };
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          language: t.Optional(t.String()),
          level: t.Optional(t.String()),
          description: t.Optional(t.String()),
          duration_months: t.Optional(t.Number()),
          is_active: t.Optional(t.Boolean()),
        }),
      })
      .delete("/courses/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        await db.delete(htCourses).where(eq(htCourses.id, parseInt(id)));
        return { message: "Deleted" };
      })

      // Groups
      .get("/groups", async (context: any) => {
        const { user, query } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const rows = u?.role === ROLES.SUPERUSER
          ? await db.select({
              id: htGroups.id,
              name: htGroups.name,
              courseId: htGroups.courseId,
              teacherId: htGroups.teacherId,
              schoolId: htGroups.schoolId,
              maxStudents: htGroups.maxStudents,
              timeSlot: htGroups.timeSlot,
              weekDays: htGroups.weekDays,
              startDate: htGroups.startDate,
              endDate: htGroups.endDate,
              isActive: htGroups.isActive,
              courseName: htCourses.name,
              teacherFirstName: users.first_name,
              teacherLastName: users.last_name,
              teacherUsername: users.username,
            }).from(htGroups)
              .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
              .leftJoin(users, eq(htGroups.teacherId, users.id))
              .orderBy(desc(htGroups.createdAt))
          : await db.select({
              id: htGroups.id,
              name: htGroups.name,
              courseId: htGroups.courseId,
              teacherId: htGroups.teacherId,
              schoolId: htGroups.schoolId,
              maxStudents: htGroups.maxStudents,
              timeSlot: htGroups.timeSlot,
              weekDays: htGroups.weekDays,
              startDate: htGroups.startDate,
              endDate: htGroups.endDate,
              isActive: htGroups.isActive,
              courseName: htCourses.name,
              teacherFirstName: users.first_name,
              teacherLastName: users.last_name,
              teacherUsername: users.username,
            }).from(htGroups)
              .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
              .leftJoin(users, eq(htGroups.teacherId, users.id))
              .where(eq(htGroups.schoolId, u!.school_id!))
              .orderBy(desc(htGroups.createdAt));
        let filtered = rows.map((r) => ({
          id: r.id,
          name: r.name,
          course_id: r.courseId,
          course_name: r.courseName,
          teacher_id: r.teacherId,
          teacher_name: [r.teacherFirstName, r.teacherLastName].filter(Boolean).join(" ") || r.teacherUsername,
          max_students: r.maxStudents,
          time_slot: r.timeSlot,
          week_days: r.weekDays,
          start_date: r.startDate?.toISOString()?.slice(0, 10),
          end_date: r.endDate?.toISOString()?.slice(0, 10),
          is_active: r.isActive,
        }));
        const courseId = query.course ? parseInt(String(query.course)) : null;
        const teacherId = query.teacher as string | undefined;
        const isActive = query.is_active;
        if (courseId) filtered = filtered.filter((r) => r.course_id === courseId);
        if (teacherId) filtered = filtered.filter((r) => r.teacher_id === teacherId);
        if (isActive === "true") filtered = filtered.filter((r) => r.is_active);
        if (isActive === "false") filtered = filtered.filter((r) => !r.is_active);
        return filtered;
      })
      .get("/groups/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select({
          id: htGroups.id,
          name: htGroups.name,
          courseId: htGroups.courseId,
          teacherId: htGroups.teacherId,
          schoolId: htGroups.schoolId,
          maxStudents: htGroups.maxStudents,
          timeSlot: htGroups.timeSlot,
          weekDays: htGroups.weekDays,
          startDate: htGroups.startDate,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          courseName: htCourses.name,
          teacherFirstName: users.first_name,
          teacherLastName: users.last_name,
        }).from(htGroups)
          .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
          .leftJoin(users, eq(htGroups.teacherId, users.id))
          .where(eq(htGroups.id, parseInt(id)))
          .limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const studentRows = await db.select({ userId: htGroupStudents.userId }).from(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)));
        return {
          id: row.id,
          name: row.name,
          course_id: row.courseId,
          course_name: row.courseName,
          teacher_id: row.teacherId,
          teacher_name: [row.teacherFirstName, row.teacherLastName].filter(Boolean).join(" ") || null,
          max_students: row.maxStudents,
          time_slot: row.timeSlot,
          week_days: row.weekDays,
          start_date: row.startDate?.toISOString()?.slice(0, 10),
          end_date: row.endDate?.toISOString()?.slice(0, 10),
          is_active: row.isActive,
          student_ids: studentRows.map((r) => r.userId),
        };
      })
      .post("/groups", async (context: any) => {
        const { user, body } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const name = (body.name as string)?.trim();
        const courseId = body.course_id as number;
        const teacherId = body.teacher_id as string | undefined;
        const maxStudents = (body.max_students as number) ?? 15;
        const timeSlot = body.time_slot as string | undefined;
        const weekDays = body.week_days as string | undefined;
        const startDate = body.start_date ? new Date(body.start_date as string) : null;
        const endDate = body.end_date ? new Date(body.end_date as string) : null;
        if (!name || !courseId) throw new Error("name and course_id are required");
        const [created] = await db.insert(htGroups).values({
          name,
          courseId,
          teacherId: teacherId || null,
          schoolId: u?.school_id ?? null,
          maxStudents,
          timeSlot: timeSlot || null,
          weekDays: weekDays || null,
          startDate: startDate || null,
          endDate: endDate || null,
          isActive: (body.is_active as boolean) !== false,
        }).returning();
        return {
          id: created.id,
          name: created.name,
          course_id: created.courseId,
          teacher_id: created.teacherId,
          max_students: created.maxStudents,
          is_active: created.isActive,
          created_at: created.createdAt?.toISOString(),
        };
      }, {
        body: t.Object({
          name: t.String(),
          course_id: t.Number(),
          teacher_id: t.Optional(t.String()),
          max_students: t.Optional(t.Number()),
          time_slot: t.Optional(t.String()),
          week_days: t.Optional(t.String()),
          start_date: t.Optional(t.String()),
          end_date: t.Optional(t.String()),
          is_active: t.Optional(t.Boolean()),
        }),
      })
      .patch("/groups/:id", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const payload = body as Record<string, unknown>;
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (payload.name !== undefined) updateData.name = String(payload.name).trim();
        if (payload.course_id !== undefined) updateData.courseId = payload.course_id as number;
        if (payload.teacher_id !== undefined) updateData.teacherId = payload.teacher_id || null;
        if (payload.max_students !== undefined) updateData.maxStudents = payload.max_students as number;
        if (payload.time_slot !== undefined) updateData.timeSlot = payload.time_slot || null;
        if (payload.week_days !== undefined) updateData.weekDays = payload.week_days || null;
        if (payload.start_date !== undefined) updateData.startDate = payload.start_date ? new Date(payload.start_date as string) : null;
        if (payload.end_date !== undefined) updateData.endDate = payload.end_date ? new Date(payload.end_date as string) : null;
        if (payload.is_active !== undefined) updateData.isActive = payload.is_active as boolean;
        const [updated] = await db.update(htGroups).set(updateData as any).where(eq(htGroups.id, parseInt(id))).returning();
        if (!updated) return { error: "Not found" };
        return {
          id: updated.id,
          name: updated.name,
          course_id: updated.courseId,
          teacher_id: updated.teacherId,
          max_students: updated.maxStudents,
          is_active: updated.isActive,
          updated_at: updated.updatedAt?.toISOString(),
        };
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          course_id: t.Optional(t.Number()),
          teacher_id: t.Optional(t.Nullable(t.String())),
          max_students: t.Optional(t.Number()),
          time_slot: t.Optional(t.Nullable(t.String())),
          week_days: t.Optional(t.Nullable(t.String())),
          start_date: t.Optional(t.Nullable(t.String())),
          end_date: t.Optional(t.Nullable(t.String())),
          is_active: t.Optional(t.Boolean()),
        }),
      })
      .delete("/groups/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        await db.delete(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)));
        await db.delete(htGroups).where(eq(htGroups.id, parseInt(id)));
        return { message: "Deleted" };
      })
      .get("/groups/:id/available-students", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
        if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const inThisGroup = await db.select({ userId: htGroupStudents.userId }).from(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)));
        const inThisGroupIds = new Set(inThisGroup.map((r) => r.userId));
        const schoolId = group.schoolId ?? u?.school_id;
        let students: { id: string; first_name: string | null; last_name: string | null; username: string | null; school_id?: number | null }[] = [];
        if (u?.role === ROLES.SUPERUSER) {
          students = await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
            .from(users).where(eq(users.role, ROLES.STUDENT));
        } else if (schoolId != null) {
          const inSchool = await db.select({ userId: userSchools.userId }).from(userSchools).where(eq(userSchools.schoolId, schoolId));
          const schoolIds = new Set(inSchool.map((x) => x.userId));
          const allStudents = await db.select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name,
            username: users.username,
            school_id: users.school_id,
          }).from(users).where(eq(users.role, ROLES.STUDENT));
          students = allStudents.filter((s) => s.school_id === schoolId || schoolIds.has(s.id));
        }
        const filtered = students.filter((s) => !inThisGroupIds.has(s.id));
        const otherGroupEnrollments = await db.select({
          userId: htGroupStudents.userId,
          groupId: htGroupStudents.groupId,
          groupName: htGroups.name,
        }).from(htGroupStudents)
          .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
          .where(and(eq(htGroups.courseId, group.courseId), ne(htGroupStudents.groupId, parseInt(id))));
        const otherGroupByUser = new Map<string, string>();
        for (const e of otherGroupEnrollments) {
          if (e.groupId !== parseInt(id)) otherGroupByUser.set(e.userId, e.groupName || "");
        }
        return filtered.map((s) => ({
          id: s.id,
          full_name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.username,
          username: s.username,
          current_group_name: otherGroupByUser.get(s.id) || null,
        }));
      })
      .post("/groups/:id/add-students", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
        if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const studentIds = (body.student_ids as string[]) || [];
        if (studentIds.length === 0) {
          set.status = 400;
          return { error: "student_ids is required" };
        }
        const currentCount = (await db.select().from(htGroupStudents).where(eq(htGroupStudents.groupId, parseInt(id)))).length;
        const uniqueNew = [...new Set(studentIds)];
        if (currentCount + uniqueNew.length > group.maxStudents) {
          set.status = 400;
          return { error: `Group is full. Max students: ${group.maxStudents}` };
        }
        for (const sid of uniqueNew) {
          const inOther = await db.select({ groupId: htGroupStudents.groupId }).from(htGroupStudents)
            .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
            .where(and(eq(htGroupStudents.userId, sid), eq(htGroups.courseId, group.courseId)));
          for (const o of inOther) {
            if (o.groupId !== parseInt(id)) {
              await db.delete(htGroupStudents).where(and(eq(htGroupStudents.groupId, o.groupId), eq(htGroupStudents.userId, sid)));
            }
          }
          try {
            await db.insert(htGroupStudents).values({ groupId: parseInt(id), userId: sid });
          } catch {
            // ignore duplicate
          }
        }
        return { message: "Added", count: uniqueNew.length };
      }, { body: t.Object({ student_ids: t.Array(t.String()) }) })
      .post("/groups/:id/remove-students", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [group] = await db.select().from(htGroups).where(eq(htGroups.id, parseInt(id))).limit(1);
        if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const studentIds = (body.student_ids as string[]) || [];
        for (const sid of studentIds) {
          await db.delete(htGroupStudents).where(and(eq(htGroupStudents.groupId, parseInt(id)), eq(htGroupStudents.userId, sid)));
        }
        return { message: "Removed", count: studentIds.length };
      }, { body: t.Object({ student_ids: t.Array(t.String()) }) })

      // Teachers
      .get("/teachers", async (context: any) => {
        const { user } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const rows = u?.role === ROLES.SUPERUSER
          ? await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
              .from(users).where(eq(users.role, ROLES.TEACHER))
          : await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name, username: users.username })
              .from(users).where(and(eq(users.role, ROLES.TEACHER), eq(users.school_id, u!.school_id!)));
        return rows.map((r) => ({
          id: r.id,
          full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
          username: r.username,
        }));
      })

      // Lessons
      .get("/lessons", async (context: any) => {
        const { user, query } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const groupId = query.group_id ? parseInt(String(query.group_id)) : null;
        const baseSelect = () => db.select({
          id: htLessons.id,
          groupId: htLessons.groupId,
          title: htLessons.title,
          description: htLessons.description,
          lessonDate: htLessons.lessonDate,
          durationMinutes: htLessons.durationMinutes,
          groupName: htGroups.name,
        }).from(htLessons)
          .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id));
        const rows = groupId
          ? await baseSelect().where(eq(htLessons.groupId, groupId)).orderBy(desc(htLessons.lessonDate))
          : u?.role === ROLES.SUPERUSER
            ? await baseSelect().orderBy(desc(htLessons.lessonDate))
            : await baseSelect().where(eq(htGroups.schoolId, u!.school_id!)).orderBy(desc(htLessons.lessonDate));
        return rows.map((r) => ({
          id: r.id,
          group_id: r.groupId,
          group_name: r.groupName,
          title: r.title,
          description: r.description,
          lesson_date: r.lessonDate?.toISOString(),
          duration_minutes: r.durationMinutes,
        }));
      })
      .get("/lessons/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select({
          id: htLessons.id,
          groupId: htLessons.groupId,
          title: htLessons.title,
          description: htLessons.description,
          lessonDate: htLessons.lessonDate,
          durationMinutes: htLessons.durationMinutes,
          homework: htLessons.homework,
          materials: htLessons.materials,
          schoolId: htGroups.schoolId,
        }).from(htLessons)
          .leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
          .where(eq(htLessons.id, parseInt(id)))
          .limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
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
      .post("/lessons", async (context: any) => {
        const { user, body } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [group] = await db.select().from(htGroups).where(eq(htGroups.id, body.group_id)).limit(1);
        if (!group || (u?.role === ROLES.HEAD_TEACHER && group.schoolId !== u.school_id)) {
          throw new Error("Group not found or access denied");
        }
        const [created] = await db.insert(htLessons).values({
          groupId: body.group_id,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          lessonDate: new Date(body.lesson_date),
          durationMinutes: body.duration_minutes || 90,
          homework: body.homework?.trim() || null,
          materials: body.materials ? JSON.stringify(body.materials) : null,
        }).returning();
        return {
          id: created.id,
          group_id: created.groupId,
          title: created.title,
          lesson_date: created.lessonDate?.toISOString(),
          duration_minutes: created.durationMinutes,
          created_at: created.createdAt?.toISOString(),
        };
      }, {
        body: t.Object({
          group_id: t.Number(),
          title: t.String(),
          description: t.Optional(t.String()),
          lesson_date: t.String(),
          duration_minutes: t.Optional(t.Number()),
          homework: t.Optional(t.String()),
          materials: t.Optional(t.Any()),
        }),
      })
      .patch("/lessons/:id", async (context: any) => {
        const { user, params: { id }, body, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select({ id: htLessons.id, groupId: htLessons.groupId, schoolId: htGroups.schoolId })
          .from(htLessons).leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
          .where(eq(htLessons.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        const payload = body as Record<string, unknown>;
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (payload.title !== undefined) updateData.title = String(payload.title).trim();
        if (payload.description !== undefined) updateData.description = (payload.description as string)?.trim() || null;
        if (payload.lesson_date !== undefined) updateData.lessonDate = new Date(payload.lesson_date as string);
        if (payload.duration_minutes !== undefined) updateData.durationMinutes = payload.duration_minutes as number;
        if (payload.homework !== undefined) updateData.homework = (payload.homework as string)?.trim() || null;
        if (payload.materials !== undefined) updateData.materials = payload.materials ? JSON.stringify(payload.materials) : null;
        const [updated] = await db.update(htLessons).set(updateData as any).where(eq(htLessons.id, parseInt(id))).returning();
        if (!updated) return { error: "Not found" };
        return {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          lesson_date: updated.lessonDate?.toISOString(),
          duration_minutes: updated.durationMinutes,
          updated_at: updated.updatedAt?.toISOString(),
        };
      }, {
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          lesson_date: t.Optional(t.String()),
          duration_minutes: t.Optional(t.Number()),
          homework: t.Optional(t.String()),
          materials: t.Optional(t.Any()),
        }),
      })
      .delete("/lessons/:id", async (context: any) => {
        const { user, params: { id }, set } = context;
        const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
        const [row] = await db.select({ id: htLessons.id, schoolId: htGroups.schoolId })
          .from(htLessons).leftJoin(htGroups, eq(htLessons.groupId, htGroups.id))
          .where(eq(htLessons.id, parseInt(id))).limit(1);
        if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
          set.status = 404;
          return { error: "Not found" };
        }
        await db.delete(htLessons).where(eq(htLessons.id, parseInt(id)));
        return { message: "Deleted" };
      })

      // Attendance
      .get("/groups/:id/attendance", async (context: any) => {
        const { params: { id } } = context;
        const rows = await db.select({
          id: htAttendance.id,
          lessonId: htAttendance.lessonId,
          userId: htAttendance.userId,
          status: htAttendance.status,
          notes: htAttendance.notes,
          lessonDate: htLessons.lessonDate,
        }).from(htAttendance)
          .innerJoin(htLessons, eq(htAttendance.lessonId, htLessons.id))
          .where(eq(htLessons.groupId, parseInt(id)));
        return rows;
      })
      .get("/groups/:id/students", async (context: any) => {
        const { params: { id } } = context;
        const rows = await db.select({
          id: users.id,
          firstName: users.first_name,
          lastName: users.last_name,
          username: users.username,
          avatar: users.avatar,
        }).from(htGroupStudents)
          .innerJoin(users, eq(htGroupStudents.userId, users.id))
          .where(eq(htGroupStudents.groupId, parseInt(id)));
        return rows;
      })
      .post("/attendance", async (context: any) => {
        const { body } = context;
        const { lesson_id, user_id, status, notes } = body;
        const [row] = await db.insert(htAttendance).values({
          lessonId: lesson_id,
          userId: user_id,
          status,
          notes,
        }).onConflictDoUpdate({
          target: [htAttendance.lessonId, htAttendance.userId],
          set: { status, notes, updatedAt: new Date() }
        }).returning();
        return row;
      }, {
        body: t.Object({
          lesson_id: t.Number(),
          user_id: t.String(),
          status: t.String(),
          notes: t.Optional(t.String()),
        })
      })

      // Grades
      .get("/groups/:id/grades", async (context: any) => {
        const { params: { id } } = context;
        const rows = await db.select().from(htGrades).where(eq(htGrades.groupId, parseInt(id)));
        return rows;
      })
      .post("/grades", async (context: any) => {
        const { body } = context;
        const [row] = await db.insert(htGrades).values({
          groupId: body.group_id,
          userId: body.user_id,
          type: body.type,
          title: body.title,
          grade: body.grade,
          maxGrade: body.max_grade,
          comment: body.comment,
          date: body.date ? new Date(body.date) : new Date(),
        }).returning();
        return row;
      }, {
        body: t.Object({
          group_id: t.Number(),
          user_id: t.String(),
          type: t.String(),
          title: t.String(),
          grade: t.String(),
          max_grade: t.Optional(t.String()),
          comment: t.Optional(t.String()),
          date: t.Optional(t.String()),
        })
      })

      // Games
      .get("/groups/:id/games", async (context: any) => {
        const { params: { id } } = context;
        const rows = await db.select().from(htGames).where(eq(htGames.groupId, parseInt(id)));
        return rows;
      })
      .post("/games", async (context: any) => {
        const { body } = context;
        const [row] = await db.insert(htGames).values({
          groupId: body.group_id,
          title: body.title,
          type: body.type,
          config: body.config ? JSON.stringify(body.config) : null,
        }).returning();
        return row;
      }, {
        body: t.Object({
          group_id: t.Number(),
          title: t.String(),
          type: t.String(),
          config: t.Optional(t.Any()),
        })
      })
  );
