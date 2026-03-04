import { Elysia } from "elysia";
import { db } from "../../db/index";
import { gemsTopupRequests, gemsTopupLogs, gemsWallets, gemsTransactions, users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { pushGemsBalance } from "../../ws/gems-broadcast";

async function getOrCreateWallet(userId: string) {
  const [existing] = await db.select().from(gemsWallets).where(eq(gemsWallets.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(gemsWallets).values({ userId }).returning();
  return created;
}

export const adminGemsRoutes = new Elysia({ prefix: "/gems" })

  // GET /admin/gems/topup-requests — all requests with user info
  .get("/topup-requests", async (_context: any) => {
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
        updatedAt: gemsTopupRequests.updatedAt,
        requestedById: gemsTopupRequests.requestedById,
        directorId: gemsTopupRequests.directorId,
        adminId: gemsTopupRequests.adminId,
        requesterFirst: users.first_name,
        requesterLast: users.last_name,
      })
      .from(gemsTopupRequests)
      .innerJoin(users, eq(gemsTopupRequests.requestedById, users.id))
      .orderBy(desc(gemsTopupRequests.createdAt));

    // Enrich with director and admin names
    const enriched = await Promise.all(rows.map(async (r) => {
      let directorName = null;
      let adminName = null;

      if (r.directorId) {
        const [dir] = await db.select({ first_name: users.first_name, last_name: users.last_name })
          .from(users).where(eq(users.id, r.directorId)).limit(1);
        directorName = dir ? [dir.first_name, dir.last_name].filter(Boolean).join(" ") : null;
      }
      if (r.adminId) {
        const [adm] = await db.select({ first_name: users.first_name, last_name: users.last_name })
          .from(users).where(eq(users.id, r.adminId)).limit(1);
        adminName = adm ? [adm.first_name, adm.last_name].filter(Boolean).join(" ") : null;
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
        updatedAt: r.updatedAt,
        requestedById: r.requestedById,
        requesterName: [r.requesterFirst, r.requesterLast].filter(Boolean).join(" ") || r.requestedById,
        directorName,
        adminName,
        logs: logs.map(l => ({
          id: l.id,
          actorId: l.actorId,
          actorRole: l.actorRole,
          action: l.action,
          comment: l.comment,
          createdAt: l.createdAt,
          actorName: [l.firstName, l.lastName].filter(Boolean).join(" ") || l.actorId || "",
        })),
      };
    }));

    return enriched;
  })

  // POST /admin/gems/topup-requests/:id/complete — fund HEAD_ACCOUNTANT wallet
  .post("/topup-requests/:id/complete", async (context: any) => {
    const { user, params, set } = context;

    const [req] = await db.select().from(gemsTopupRequests)
      .where(eq(gemsTopupRequests.id, parseInt(params.id))).limit(1);

    if (!req) { set.status = 404; return { error: "Not found" }; }
    if (req.status !== "pending_admin") {
      set.status = 400;
      return { error: "Request is not pending admin completion" };
    }

    const amount = Number(req.amount);

    // Get or create wallet for HEAD_ACCOUNTANT (requestedBy)
    const wallet = await getOrCreateWallet(req.requestedById);
    const newBalance = Number(wallet.balance) + amount;

    await db.update(gemsWallets)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(gemsWallets.userId, req.requestedById));

    await db.insert(gemsTransactions).values({
      senderId: null,
      receiverId: req.requestedById,
      amount: String(amount),
      type: "system",
      comment: `Пополнение по заявке #${req.id} «${req.title}»`,
    });

    const [updated] = await db.update(gemsTopupRequests)
      .set({
        status: "completed",
        adminId: user!.id,
        adminActedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gemsTopupRequests.id, req.id))
      .returning();

    await db.insert(gemsTopupLogs).values({
      requestId: req.id,
      actorId: user!.id,
      actorRole: user!.role || "SUPERUSER",
      action: "admin_completed",
      comment: `Баланс пополнен на ${amount} 💎`,
    });

    // Push real-time balance update to HEAD_ACCOUNTANT
    pushGemsBalance(req.requestedById, newBalance);

    return { ...updated, amount: Number(updated.amount), newBalance };
  });
