/**
 * Admin Users — CRUD пользователей. SUPERUSER.
 * HEAD_TEACHER позже — scope по school_id.
 */
import { Elysia, t } from "elysia";
import { db } from "../../../db";
import { users, schools, userRoles, userSchools } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";
import { generateUniqueUsername, generateRandomPassword } from "../../../services/user-services";

export const adminUsersRoutes = new Elysia({ prefix: "/users" })
  .get("/", async ({ query }) => {
    const role = query.role as string | undefined;
    const search = query.search as string | undefined;
    const schoolIdFilter = query.school_id != null ? Number(query.school_id) : undefined;

    let q = db
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
        is_active: users.is_active,
        can_view_all_schools: users.can_view_all_schools,
        school_id: users.school_id,
        parent_id: users.parent_id,
        can_export_excel: users.can_export_excel,
        created_at: users.created_at,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .orderBy(desc(users.created_at));

    const rows = await q;
    
    // Дополнительные роли
    const allUserRoles = await db.select().from(userRoles);
    const rolesByUserId = new Map<string, string[]>();
    for (const ur of allUserRoles) {
      if (!rolesByUserId.has(ur.userId)) {
        rolesByUserId.set(ur.userId, []);
      }
      rolesByUserId.get(ur.userId)!.push(ur.role);
    }

    // Дополнительные школы (user_school) — ученик может быть в нескольких школах
    const allUserSchools = await db.select().from(userSchools);
    const additionalSchoolsByUserId = new Map<string, number[]>();
    const userIdsInSchool = new Set<string>();
    for (const us of allUserSchools) {
      if (schoolIdFilter != null && us.schoolId === schoolIdFilter) userIdsInSchool.add(us.userId);
      if (!additionalSchoolsByUserId.has(us.userId)) {
        additionalSchoolsByUserId.set(us.userId, []);
      }
      additionalSchoolsByUserId.get(us.userId)!.push(us.schoolId);
    }

    // Все школы для отображения (получаем названия)
    const allSchoolRows = await db.select().from(schools);
    const schoolNamesById = new Map<number, string>();
    for (const s of allSchoolRows) {
      schoolNamesById.set(s.id, s.name || s.name_ru || s.name_tm || s.name_en || `Школа #${s.id}`);
    }

    let filtered = rows;
    if (role) {
      filtered = filtered.filter((r) => r.role === role);
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.username?.toLowerCase().includes(s)) ||
          (r.email?.toLowerCase().includes(s)) ||
          (r.first_name?.toLowerCase().includes(s)) ||
          (r.last_name?.toLowerCase().includes(s))
      );
    }

    // Фильтр по школе: ученики, у которых school_id = X или в user_school есть школа X
    if (schoolIdFilter != null) {
      filtered = filtered.filter(
        (r) =>
          r.school_id === schoolIdFilter || userIdsInSchool.has(r.id)
      );
    }

    return filtered.map((r) => {
      const additionalIds = additionalSchoolsByUserId.get(r.id) || [];
      const schoolsList: string[] = [];
      if (r.school_id) schoolsList.push(schoolNamesById.get(r.school_id) || `Школа #${r.school_id}`);
      for (const sid of additionalIds) {
        if (sid !== r.school_id) schoolsList.push(schoolNamesById.get(sid) || `Школа #${sid}`);
      }
      return {
        ...r,
        full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
        additional_roles: rolesByUserId.get(r.id) || [],
        additional_school_ids: additionalIds,
        schools_display: schoolsList.join(", ") || null,
      };
    });
  }, {
    query: t.Object({
      role: t.Optional(t.String()),
      search: t.Optional(t.String()),
      school_id: t.Optional(t.Union([t.String(), t.Number()])),
    }),
  })
  .get("/:id", async ({ params: { id } }) => {
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
        is_active: users.is_active,
        can_view_all_schools: users.can_view_all_schools,
        school_id: users.school_id,
        parent_id: users.parent_id,
        can_export_excel: users.can_export_excel,
        created_at: users.created_at,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.id, id));
    if (!row) return { error: "Not found" };
    
    const additionalRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, id));

    const additionalSchools = await db
      .select({ schoolId: userSchools.schoolId })
      .from(userSchools)
      .where(eq(userSchools.userId, id));

    return {
      ...row,
      full_name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.username,
      additional_roles: additionalRoles.map(r => r.role),
      additional_school_ids: additionalSchools.map(s => s.schoolId),
    };
  })
  .post("/", async ({ body, set }) => {
    const role = (body.role as string) || ROLES.STUDENT;
    const first_name = (body.first_name as string)?.trim();
    const last_name = (body.last_name as string)?.trim();
    const email = (body.email as string)?.trim();
    const phone = (body.phone as string)?.trim() || null;
    const school_id = body.school_id as number | null | undefined;
    const parent_id = body.parent_id as string | null | undefined;
    const auto_generate = body.auto_generate as boolean | undefined;
    const additional_roles = (body.additional_roles as string[] | undefined) || [];
    const can_export_excel = body.can_export_excel as boolean | undefined || false;

    if (!first_name || !last_name) {
      set.status = 400;
      return { error: "first_name and last_name are required" };
    }

    let username = (body.username as string)?.trim();
    let password = body.password as string | undefined;

    if (role === ROLES.STUDENT && auto_generate) {
      username = await generateUniqueUsername(first_name);
      password = generateRandomPassword();
    } else {
      if (!username) {
        set.status = 400;
        return { error: "username is required when auto_generate is false" };
      }
      if (!password || password.length < 6) {
        set.status = 400;
        return { error: "password is required (min 6 chars) when auto_generate is false" };
      }
    }

    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      set.status = 400;
      return { error: "Логин уже занят" };
    }

    if (email) {
      const emailTaken = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (emailTaken.length > 0) {
        set.status = 400;
        return { error: "Email уже используется другим пользователем" };
      }
    }

    const id = crypto.randomUUID();
    const password_hash = await Bun.password.hash(password, { algorithm: "bcrypt" });

    const avatar = (body.avatar as string)?.trim() || null;
    const rfid_uid = role === ROLES.STUDENT ? ((body.rfid_uid as string)?.trim() || null) : null;

    try {
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
        school_id: school_id ?? null,
        parent_id: parent_id ?? null,
        can_export_excel,
        can_view_all_schools: body.can_view_all_schools as boolean | undefined || false,
      });
    } catch (dbErr: any) {
      set.status = 400;
      const msg = dbErr?.message || "";
      if (msg.includes("username")) return { error: "Логин уже занят" };
      if (msg.includes("email")) return { error: "Email уже используется" };
      if (msg.includes("rfid_uid")) return { error: "RFID UID уже зарегистрирован" };
      return { error: "Ошибка при создании пользователя: " + msg };
    }

    // Сохраняем дополнительные роли (исключаем SUPERUSER, основную роль и пустые строки)
    const validAdditionalRoles = (additional_roles || []).filter(
      r => r && typeof r === 'string' && r.trim() && r !== ROLES.SUPERUSER && r !== role
    );
    if (validAdditionalRoles.length > 0) {
      await db.insert(userRoles).values(
        validAdditionalRoles.map(roleName => ({
          userId: id,
          role: roleName.trim(),
        }))
      );
    }

    // Дополнительные школы (ученик в нескольких школах)
    const additionalSchoolIds = (body.additional_school_ids as number[] || []).filter(
      (sid): sid is number => typeof sid === "number" && sid > 0
    );
    const primarySchoolId = school_id ?? null;
    const toInsert = additionalSchoolIds.filter((sid) => sid !== primarySchoolId);
    if (toInsert.length > 0) {
      await db.insert(userSchools).values(
        toInsert.map((schoolId) => ({ userId: id, schoolId }))
      );
    }

    const [created] = await db.select().from(users).where(eq(users.id, id));
    const { password_hash: _, ...profile } = created!;
    
    // Получаем дополнительные роли для ответа
    const savedRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, id));

    return {
      user: {
        ...profile,
        additional_roles: savedRoles.map(r => r.role),
      },
      credentials: role === ROLES.STUDENT && auto_generate ? { username, password } : undefined,
    };
  }, {
      body: t.Object({
        role: t.String(),
        first_name: t.String(),
        last_name: t.String(),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        username: t.Optional(t.String()),
        password: t.Optional(t.String()),
        avatar: t.Optional(t.String()),
        rfid_uid: t.Optional(t.String()),
        school_id: t.Optional(t.Number()),
        parent_id: t.Optional(t.String()),
        auto_generate: t.Optional(t.Boolean()),
        additional_roles: t.Optional(t.Array(t.String())),
        additional_school_ids: t.Optional(t.Array(t.Number())),
        can_export_excel: t.Optional(t.Boolean()),
        can_view_all_schools: t.Optional(t.Boolean()),
      }),
  })
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const [existing] = await db.select().from(users).where(eq(users.id, id));
      if (!existing) {
        set.status = 404;
        return { error: "Not found" };
      }

      const updates: Record<string, unknown> = {};
      if (body.first_name !== undefined) updates.first_name = (body.first_name as string)?.trim() || null;
      if (body.last_name !== undefined) updates.last_name = (body.last_name as string)?.trim() || null;
      if (body.email !== undefined) updates.email = (body.email as string)?.trim() || null;
      if (body.phone !== undefined) updates.phone = (body.phone as string)?.trim() || null;
      if (body.role !== undefined) updates.role = body.role as string;
      if (body.is_active !== undefined) updates.is_active = body.is_active as boolean;
      if (body.school_id !== undefined) updates.school_id = body.school_id as number | null;
      if (body.parent_id !== undefined) updates.parent_id = body.parent_id as string | null;
      if (body.avatar !== undefined) updates.avatar = (body.avatar as string)?.trim() || null;
      if (existing.role === ROLES.STUDENT && body.rfid_uid !== undefined) updates.rfid_uid = (body.rfid_uid as string)?.trim() || null;
      if (body.can_export_excel !== undefined) updates.can_export_excel = body.can_export_excel as boolean;
      if (body.can_view_all_schools !== undefined) updates.can_view_all_schools = body.can_view_all_schools as boolean;

      if (body.password && (body.password as string).length >= 6) {
        updates.password_hash = await Bun.password.hash(body.password as string, { algorithm: "bcrypt" });
      }

      if (body.username !== undefined) {
        const username = (body.username as string)?.trim();
        if (!username) {
          set.status = 400;
          return { error: "username cannot be empty" };
        }
        const [other] = await db.select().from(users).where(eq(users.username, username));
        if (other && other.id !== id) {
          set.status = 400;
          return { error: "username already exists" };
        }
        updates.username = username;
      }

      if (Object.keys(updates).length === 0) {
        const [row] = await db.select().from(users).where(eq(users.id, id));
        const { password_hash: _, ...profile } = row!;
        return { user: profile };
      }

      await db.update(users).set(updates).where(eq(users.id, id));
      
      // Обновляем дополнительные школы (ученик в нескольких школах)
      if (body.additional_school_ids !== undefined) {
        await db.delete(userSchools).where(eq(userSchools.userId, id));
        const ids = (body.additional_school_ids as number[] || []).filter(
          (sid): sid is number => typeof sid === "number" && sid > 0
        );
        const primaryId = (updates.school_id ?? existing.school_id) as number | null;
        const toInsert = ids.filter((sid) => sid !== primaryId); // не дублируем основную школу
        if (toInsert.length > 0) {
          await db.insert(userSchools).values(
            toInsert.map((schoolId) => ({ userId: id, schoolId }))
          );
        }
      }

      // Обновляем дополнительные роли, если они переданы
      if (body.additional_roles !== undefined) {
        // Удаляем старые дополнительные роли
        await db.delete(userRoles).where(eq(userRoles.userId, id));
        
        // Добавляем новые (исключаем SUPERUSER, основную роль и пустые строки)
        const currentRole = updates.role || existing.role;
        const validAdditionalRoles = (body.additional_roles as string[] || []).filter(
          r => r && typeof r === 'string' && r.trim() && r !== ROLES.SUPERUSER && r !== currentRole
        );
        if (validAdditionalRoles.length > 0) {
          await db.insert(userRoles).values(
            validAdditionalRoles.map(roleName => ({
              userId: id,
              role: roleName.trim(),
            }))
          );
        }
      }
      
      const [updated] = await db.select().from(users).where(eq(users.id, id));
      const { password_hash: _, ...profile } = updated!;
      
      // Получаем дополнительные роли для ответа
      const savedRoles = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, id));
      
      return {
        user: {
          ...profile,
          additional_roles: savedRoles.map(r => r.role),
        },
      };
    },
    {
      body: t.Object({
        first_name: t.Optional(t.String()),
        last_name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        username: t.Optional(t.String()),
        password: t.Optional(t.String()),
        role: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
        avatar: t.Optional(t.String()),
        rfid_uid: t.Optional(t.Union([t.String(), t.Null()])),
        school_id: t.Optional(t.Union([t.Number(), t.Null()])),
        parent_id: t.Optional(t.Union([t.String(), t.Null()])),
        additional_roles: t.Optional(t.Array(t.String())),
        additional_school_ids: t.Optional(t.Array(t.Number())),
        can_export_excel: t.Optional(t.Boolean()),
        can_view_all_schools: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, id));
    return { message: "Deleted successfully" };
  });
