import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { tariffs, users } from "../../../db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

// Helper to check roles
async function hasRole(userId: string, role: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === role || user?.role === ROLES.SUPERUSER) return true;
  return false;
}

export const tariffRoutes = new Elysia({ prefix: "/tariffs" })
  .onBeforeHandle(async (context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async () => {
    // Get all active tariffs for all accountants
    return await db
      .select({
        id: tariffs.id,
        name: tariffs.name,
        category: tariffs.category,
        price: tariffs.price,
        description: tariffs.description,
        isActive: tariffs.isActive,
        createdAt: tariffs.createdAt,
      })
      .from(tariffs)
      .where(eq(tariffs.isActive, true))
      .orderBy(desc(tariffs.createdAt));
  })
  .get("/history", async (context: any) => {
    const { user, set } = context;
    const isHeadAccountant = await hasRole(user.id, ROLES.HEAD_ACCOUNTANT);
    const isGenDirector = await hasRole(user.id, ROLES.GEN_DIRECTOR);
    
    if (!isHeadAccountant && !isGenDirector) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    return await db
      .select({
        id: tariffs.id,
        name: tariffs.name,
        category: tariffs.category,
        price: tariffs.price,
        description: tariffs.description,
        isActive: tariffs.isActive,
        createdAt: tariffs.createdAt,
        updatedAt: tariffs.updatedAt,
        createdByName: sql<string>`concat(${users.first_name}, ' ', ${users.last_name})`,
      })
      .from(tariffs)
      .leftJoin(users, eq(tariffs.createdById, users.id))
      .orderBy(desc(tariffs.createdAt));
  })
  .post("/", async (context: any) => {
    const { user, body, set } = context;
    const isHeadAccountant = await hasRole(user.id, ROLES.HEAD_ACCOUNTANT);
    const isGenDirector = await hasRole(user.id, ROLES.GEN_DIRECTOR);
    
    if (!isHeadAccountant && !isGenDirector) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const { name, category, price, description } = body;

    const [newTariff] = await db.insert(tariffs).values({
      name,
      category,
      price: price.toString(),
      description,
      createdById: user.id,
    }).returning();

    return newTariff;
  }, {
    body: t.Object({
      name: t.String(),
      category: t.String(),
      price: t.Number(),
      description: t.Optional(t.String()),
    })
  })
  .patch("/:id/deactivate", async (context: any) => {
    const { user, params: { id }, set } = context;
    const isHeadAccountant = await hasRole(user.id, ROLES.HEAD_ACCOUNTANT);
    const isGenDirector = await hasRole(user.id, ROLES.GEN_DIRECTOR);
    
    if (!isHeadAccountant && !isGenDirector) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [updated] = await db.update(tariffs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tariffs.id, parseInt(id)))
      .returning();

    return updated;
  });
