import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { mailingMessages, mailingRecipients, users, userSchools } from "../../../db/schema";
import { eq, desc, and, inArray, or } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

export const headTeacherMailingRoutes = new Elysia()
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
  });
