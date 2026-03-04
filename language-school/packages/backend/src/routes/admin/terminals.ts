/**
 * Admin Terminals — CRUD for vendor/terminal profiles.
 * Only SUPERUSER / GEN_DIRECTOR can manage.
 * Each terminal is linked to a MERCHANT role user.
 */
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { gemsVendors, users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const adminTerminalRoutes = new Elysia({ prefix: "/terminals" })

  // GET /admin/terminals — list all terminals with merchant user info
  .get("/", async () => {
    const rows = await db
      .select({
        id: gemsVendors.id,
        userId: gemsVendors.userId,
        name: gemsVendors.name,
        address: gemsVendors.address,
        terminalId: gemsVendors.terminalId,
        authToken: gemsVendors.authToken,
        isActive: gemsVendors.isActive,
        createdAt: gemsVendors.createdAt,
        firstName: users.first_name,
        lastName: users.last_name,
        phone: users.phone,
        email: users.email,
        username: users.username,
      })
      .from(gemsVendors)
      .innerJoin(users, eq(gemsVendors.userId, users.id))
      .orderBy(desc(gemsVendors.createdAt));

    return rows.map((r) => ({
      ...r,
      merchantName: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.username,
    }));
  })

  // GET /admin/terminals/merchants — list of MERCHANT users without a terminal yet
  .get("/merchants", async () => {
    const allMerchants = await db
      .select({ id: users.id, first_name: users.first_name, last_name: users.last_name, phone: users.phone, email: users.email, username: users.username })
      .from(users)
      .where(eq(users.role, "MERCHANT"));

    const existingVendors = await db.select({ userId: gemsVendors.userId }).from(gemsVendors);
    const usedIds = new Set(existingVendors.map((v) => v.userId));

    return allMerchants
      .filter((m) => !usedIds.has(m.id))
      .map((m) => ({
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username,
        phone: m.phone,
        email: m.email,
        username: m.username,
      }));
  })

  // GET /admin/terminals/:id — single terminal detail
  .get("/:id", async ({ params, set }) => {
    const [row] = await db
      .select({
        id: gemsVendors.id,
        userId: gemsVendors.userId,
        name: gemsVendors.name,
        address: gemsVendors.address,
        terminalId: gemsVendors.terminalId,
        authToken: gemsVendors.authToken,
        isActive: gemsVendors.isActive,
        createdAt: gemsVendors.createdAt,
        firstName: users.first_name,
        lastName: users.last_name,
        phone: users.phone,
        email: users.email,
        username: users.username,
      })
      .from(gemsVendors)
      .innerJoin(users, eq(gemsVendors.userId, users.id))
      .where(eq(gemsVendors.id, parseInt(params.id)))
      .limit(1);

    if (!row) { set.status = 404; return { error: "Not found" }; }

    return { ...row, merchantName: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.username };
  })

  // POST /admin/terminals — create a terminal for a MERCHANT user
  .post("/", async ({ body, set }) => {
    const { userId, name, address, terminalId } = body;

    // Check MERCHANT user exists
    const [merchant] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!merchant) { set.status = 404; return { error: "User not found" }; }
    if (merchant.role.toUpperCase() !== "MERCHANT") {
      set.status = 400;
      return { error: "User must have MERCHANT role" };
    }

    // Check no duplicate terminal for this user
    const [existing] = await db
      .select({ id: gemsVendors.id })
      .from(gemsVendors)
      .where(eq(gemsVendors.userId, userId))
      .limit(1);

    if (existing) {
      set.status = 409;
      return { error: "This merchant already has a terminal. Edit it instead." };
    }

    const authToken = crypto.randomUUID();

    const [created] = await db.insert(gemsVendors).values({
      userId,
      name,
      address: address || null,
      terminalId: terminalId || null,
      authToken,
    }).returning();

    return { ...created, authToken }; // Show full token on creation — only time it's fully visible
  }, {
    body: t.Object({
      userId: t.String(),
      name: t.String(),
      address: t.Optional(t.String()),
      terminalId: t.Optional(t.String()),
    }),
  })

  // PATCH /admin/terminals/:id — update name, address, terminalId, isActive
  .patch("/:id", async ({ params, body, set }) => {
    const id = parseInt(params.id);
    const { name, address, terminalId, isActive } = body;

    const [existing] = await db.select({ id: gemsVendors.id }).from(gemsVendors).where(eq(gemsVendors.id, id)).limit(1);
    if (!existing) { set.status = 404; return { error: "Not found" }; }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (terminalId !== undefined) updateData.terminalId = terminalId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db.update(gemsVendors).set(updateData).where(eq(gemsVendors.id, id)).returning();
    return updated;
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      address: t.Optional(t.String()),
      terminalId: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
    }),
  })

  // DELETE /admin/terminals/:id — remove terminal profile (user stays)
  .delete("/:id", async ({ params, set }) => {
    const id = parseInt(params.id);
    const [existing] = await db.select({ id: gemsVendors.id }).from(gemsVendors).where(eq(gemsVendors.id, id)).limit(1);
    if (!existing) { set.status = 404; return { error: "Not found" }; }
    await db.delete(gemsVendors).where(eq(gemsVendors.id, id));
    return { ok: true };
  });
