/**
 * Admin Users — CRUD пользователей. SUPERUSER.
 * HEAD_TEACHER позже — scope по school_id.
 */
import { Elysia, t } from "elysia";
import { db } from "../../../db";
import { users, schools } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";
import { generateUniqueUsername, generateRandomPassword } from "../../../services/user-services";
import { generateId } from "lucia";

export const adminUsersRoutes = new Elysia({ prefix: "/users" })
  .get("/", async ({ query }) => {
    const role = query.role as string | undefined;
    const search = query.search as string | undefined;

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
        is_active: users.is_active,
        school_id: users.school_id,
        parent_id: users.parent_id,
        created_at: users.created_at,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .orderBy(desc(users.created_at));

    const rows = await q;

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

    return filtered.map((r) => ({
      ...r,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
    }));
  }, {
    query: t.Object({
      role: t.Optional(t.String()),
      search: t.Optional(t.String()),
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
        is_active: users.is_active,
        school_id: users.school_id,
        parent_id: users.parent_id,
        created_at: users.created_at,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.id))
      .where(eq(users.id, id));
    if (!row) return { error: "Not found" };
    return { ...row, full_name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.username };
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
      return { error: "username already exists" };
    }

    const id = generateId(15);
    const password_hash = await Bun.password.hash(password, { algorithm: "bcrypt" });

    const avatar = (body.avatar as string)?.trim() || null;

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
      school_id: school_id ?? null,
      parent_id: parent_id ?? null,
    });

    const [created] = await db.select().from(users).where(eq(users.id, id));
    const { password_hash: _, ...profile } = created!;

    return {
      user: profile,
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
      school_id: t.Optional(t.Number()),
      parent_id: t.Optional(t.String()),
      auto_generate: t.Optional(t.Boolean()),
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
      const [updated] = await db.select().from(users).where(eq(users.id, id));
      const { password_hash: _, ...profile } = updated!;
      return { user: profile };
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
        school_id: t.Optional(t.Union([t.Number(), t.Null()])),
        parent_id: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, id));
    return { message: "Deleted successfully" };
  });
