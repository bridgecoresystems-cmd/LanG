import { Elysia } from "elysia";
import { db } from "../../db";
import { users, auditLogs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ROLES } from "../../constants/roles";
import { createUserSession } from "../../auth";

const isProduction = process.env.NODE_ENV === "production";

export const adminImpersonateRoutes = new Elysia()
  /**
   * POST /admin/impersonate/:userId
   * SUPERUSER only. Creates a session for target user, returns token in cookie.
   * Original admin session is NOT touched — frontend stores it separately.
   */
  .post("/impersonate/:userId", async (context: any) => {
    const { user, params: { userId }, set, request } = context;

    // Only SUPERUSER can impersonate
    if (user?.role !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden: только SUPERUSER может использовать impersonate." };
    }

    // Can't impersonate yourself
    if (user.id === userId) {
      set.status = 400;
      return { error: "Нельзя войти под собственной учётной записью." };
    }

    // Target user must exist
    const [target] = await db
      .select({ id: users.id, username: users.username, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      set.status = 404;
      return { error: "Пользователь не найден." };
    }

    // Can't impersonate another SUPERUSER
    if (target.role === ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Нельзя войти под учётной записью другого суперпользователя." };
    }

    // Create a session for the target user
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent");
    const { cookie } = await createUserSession(target.id, { ip, userAgent });

    // Extract just the token value from the cookie string for response body
    const tokenMatch = cookie.match(/better-auth\.session_token=([^;]+)/);
    const impersonateToken = tokenMatch?.[1] ?? "";

    // Log to audit_logs
    await db.insert(auditLogs).values({
      actorId: user.id,
      targetId: target.id,
      action: "impersonate_start",
      meta: JSON.stringify({
        actorUsername: user.username,
        targetUsername: target.username,
        targetRole: target.role,
      }),
      ip,
    });

    // Set the impersonate session cookie
    set.headers["Set-Cookie"] = cookie;

    return {
      success: true,
      impersonateToken,
      targetUser: {
        id: target.id,
        username: target.username,
        role: target.role,
      },
    };
  })

  /**
   * POST /admin/impersonate/stop
   * Logs the end of impersonation session. Frontend handles the token swap.
   */
  .post("/impersonate/stop", async (context: any) => {
    const { user, request, set } = context;
    if (!user) { set.status = 401; return { error: "Unauthorized" }; }

    const ip = request.headers.get("x-forwarded-for") || null;

    await db.insert(auditLogs).values({
      actorId: user.id,
      targetId: null,
      action: "impersonate_stop",
      meta: JSON.stringify({ username: user.username, role: user.role }),
      ip,
    });

    return { success: true };
  });
