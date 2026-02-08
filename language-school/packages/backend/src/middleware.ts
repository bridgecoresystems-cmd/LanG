import { Elysia } from "elysia";
import { verifyRequestOrigin } from "lucia";
import { lucia } from "./auth";

export const authMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    if (request.method !== "GET") {
      const originHeader = request.headers.get("Origin");
      const hostHeader = request.headers.get("Host");
      const forwardedHost = request.headers.get("X-Forwarded-Host");
      
      // В режиме разработки разрешаем любые запросы с localhost или 127.0.0.1
      const isDevOrigin = originHeader && (
        originHeader.includes("localhost") || 
        originHeader.includes("127.0.0.1")
      );

      if (process.env.NODE_ENV !== "development" && !isDevOrigin) {
        const allowedOrigins = [
          hostHeader,
          forwardedHost,
          "localhost:3000",
          "127.0.0.1:3000",
        ].filter(Boolean) as string[];
        
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, allowedOrigins)) {
          console.log(`[Auth] CSRF Blocked: Origin=${originHeader}, Host=${hostHeader}`);
          set.status = 403;
          return { user: null, session: null };
        }
      }
    }

    const cookieHeader = request.headers.get("Cookie") ?? "";
    const sessionId = lucia.readSessionCookie(cookieHeader);
    if (!sessionId) {
      return { user: null, session: null };
    }

    const { session, user } = await lucia.validateSession(sessionId);
    
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    }
    return { user, session };
  });
