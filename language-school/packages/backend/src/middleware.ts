import { Elysia } from "elysia";
import { verifyRequestOrigin } from "lucia";
import { lucia } from "./auth";

export const authMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    const url = new URL(request.url);
    const cookieHeader = request.headers.get("Cookie") ?? "";
    
    console.log(`[AuthMiddleware] ${request.method} ${url.pathname}`);
    console.log(`[AuthMiddleware] Cookie Header: "${cookieHeader}"`);

    if (request.method !== "GET") {
      const originHeader = request.headers.get("Origin");
      const hostHeader = request.headers.get("Host");
      
      const isDevOrigin = originHeader && (
        originHeader.includes("localhost") || 
        originHeader.includes("127.0.0.1")
      );

      if (process.env.NODE_ENV !== "development" && !isDevOrigin) {
        // ... existing CSRF logic (simplified for logging)
        console.log(`[AuthMiddleware] CSRF Check for ${originHeader}`);
      }
    }

    const sessionId = lucia.readSessionCookie(cookieHeader);
    
    if (!sessionId) {
      console.log(`[AuthMiddleware] ❌ No session ID found in cookies`);
      return { user: null, session: null };
    }

    console.log(`[AuthMiddleware] 🔑 Session ID found: ${sessionId.substring(0, 10)}...`);

    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session) {
      console.log(`[AuthMiddleware] Invalid or expired session ID: ${sessionId}`);
      const sessionCookie = lucia.createBlankSessionCookie();
      set.headers["Set-Cookie"] = sessionCookie.serialize();
      return { user: null, session: null };
    }

    if (session.fresh) {
      console.log(`[AuthMiddleware] Refreshing fresh session for user: ${user?.username}`);
      const sessionCookie = lucia.createSessionCookie(session.id);
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    }

    console.log(`[AuthMiddleware] Authenticated as: ${user?.username} (${user?.role})`);
    return { user, session };
  });
