import { Elysia } from "elysia";
import { auth } from "./auth";

// Этот middleware не используется напрямую (protected group использует inline derive в index.ts).
// Оставлен для справки / будущего использования.
export const authMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    const url = new URL(request.url);
    console.log(`[AuthMiddleware] ${request.method} ${url.pathname}`);

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      console.log("[AuthMiddleware] ❌ No valid session");
      return { user: null, session: null };
    }

    const user = session.user as typeof session.user & { username: string; role: string };
    console.log(`[AuthMiddleware] Authenticated as: ${user.username ?? user.name} (${user.role})`);
    return { user, session: session.session };
  });
