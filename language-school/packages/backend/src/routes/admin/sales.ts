/**
 * Admin Sales — управление звонками sales менеджеров. SUPERUSER, HEAD_TEACHER.
 */
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { salesCalls, users } from "../../db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export const adminSalesRoutes = new Elysia({ prefix: "/sales" })
  .get("/calls", async ({ query }) => {
    const salesManagerId = query.salesManagerId as string | undefined;
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;
    const outcome = query.outcome as string | undefined;

    let q = db
      .select({
        id: salesCalls.id,
        salesManagerId: salesCalls.salesManagerId,
        firstName: salesCalls.firstName,
        lastName: salesCalls.lastName,
        phone: salesCalls.phone,
        datetime: salesCalls.datetime,
        outcome: salesCalls.outcome,
        notes: salesCalls.notes,
        created_at: salesCalls.created_at,
        updated_at: salesCalls.updated_at,
        sales_manager_name: users.first_name,
        sales_manager_surname: users.last_name,
      })
      .from(salesCalls)
      .leftJoin(users, eq(salesCalls.salesManagerId, users.id))
      .orderBy(desc(salesCalls.datetime));

    const rows = await q;

    let filtered = rows;
    if (salesManagerId) {
      filtered = filtered.filter((r) => r.salesManagerId === salesManagerId);
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((r) => r.datetime && new Date(r.datetime) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.datetime && new Date(r.datetime) <= toDate);
    }
    if (outcome) {
      filtered = filtered.filter((r) => r.outcome === outcome);
    }

    return filtered;
  }, {
    query: t.Object({
      salesManagerId: t.Optional(t.String()),
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
      outcome: t.Optional(t.String()),
    }),
  })
  .post("/calls", async ({ body }) => {
    const payload = body as {
      firstName: string;
      lastName: string;
      phone: string;
      datetime: string | Date;
      outcome: string;
      notes?: string;
      salesManagerId: string;
    };
    
    let datetimeValue: Date;
    if (payload.datetime instanceof Date) {
      datetimeValue = payload.datetime;
    } else if (typeof payload.datetime === 'string') {
      datetimeValue = new Date(payload.datetime);
    } else {
      return { error: "Invalid datetime format" };
    }
    
    if (isNaN(datetimeValue.getTime())) {
      return { error: "Invalid datetime value" };
    }
    
    const [created] = await db
      .insert(salesCalls)
      .values({
        salesManagerId: payload.salesManagerId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        datetime: datetimeValue,
        outcome: payload.outcome,
        notes: payload.notes || null,
      })
      .returning();
    return created;
  }, {
    body: t.Object({
      firstName: t.String(),
      lastName: t.String(),
      phone: t.String(),
      datetime: t.String(),
      outcome: t.String(),
      notes: t.Optional(t.String()),
      salesManagerId: t.String(),
    }),
  })
  .get("/calls/:id", async ({ params: { id } }) => {
    const [item] = await db
      .select({
        id: salesCalls.id,
        salesManagerId: salesCalls.salesManagerId,
        firstName: salesCalls.firstName,
        lastName: salesCalls.lastName,
        phone: salesCalls.phone,
        datetime: salesCalls.datetime,
        outcome: salesCalls.outcome,
        notes: salesCalls.notes,
        created_at: salesCalls.created_at,
        updated_at: salesCalls.updated_at,
      })
      .from(salesCalls)
      .where(eq(salesCalls.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .patch("/calls/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.datetime !== undefined) updateData.datetime = payload.datetime;
    if (payload.outcome !== undefined) updateData.outcome = payload.outcome;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    updateData.updated_at = new Date();
    const [updated] = await db
      .update(salesCalls)
      .set(updateData)
      .where(eq(salesCalls.id, parseInt(id)))
      .returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, {
    body: t.Object({
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      datetime: t.Optional(t.Date()),
      outcome: t.Optional(t.String()),
      notes: t.Optional(t.String()),
    }),
  })
  .delete("/calls/:id", async ({ params: { id } }) => {
    await db.delete(salesCalls).where(eq(salesCalls.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })
  .get("/stats", async ({ query }) => {
    const salesManagerId = query.salesManagerId as string | undefined;
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;

    let conditions: any[] = [];
    if (salesManagerId) {
      conditions.push(eq(salesCalls.salesManagerId, salesManagerId));
    }
    if (dateFrom) {
      conditions.push(gte(salesCalls.datetime, new Date(dateFrom)));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(salesCalls.datetime, toDate));
    }

    const allCalls = conditions.length > 0
      ? await db.select().from(salesCalls).where(and(...conditions))
      : await db.select().from(salesCalls);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayCalls = allCalls.filter(
      (call) => call.datetime && new Date(call.datetime) >= today && new Date(call.datetime) < tomorrow
    );
    const weekCalls = allCalls.filter(
      (call) => call.datetime && new Date(call.datetime) >= weekAgo
    );

    const outcomeStats = {
      no_answer: allCalls.filter((c) => c.outcome === "no_answer").length,
      interested: allCalls.filter((c) => c.outcome === "interested").length,
      not_interested: allCalls.filter((c) => c.outcome === "not_interested").length,
      follow_up: allCalls.filter((c) => c.outcome === "follow_up").length,
    };

    return {
      total: allCalls.length,
      today: todayCalls.length,
      last7Days: weekCalls.length,
      outcomes: outcomeStats,
    };
  }, {
    query: t.Object({
      salesManagerId: t.Optional(t.String()),
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
    }),
  });
