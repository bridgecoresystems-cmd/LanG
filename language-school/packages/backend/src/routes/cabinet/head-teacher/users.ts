import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { users, userSchools, schools } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";
import { generateUniqueUsername, generateRandomPassword } from "../../../services/user-services";

export const headTeacherUserRoutes = new Elysia()
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

    const id = crypto.randomUUID();
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
  });
