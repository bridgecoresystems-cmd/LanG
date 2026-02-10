import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { lucia } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { landingRoutes } from "./routes/landing";
import { userRoutes } from "./routes/users";

import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin/index";
import { cabinetRoutes } from "./routes/cabinet/index";
import { uploadRoutes } from "./routes/upload";
import { wsRoutes } from "./routes/ws";
import { staticPlugin } from "@elysiajs/static";

const app = new Elysia()
  .onRequest(({ request }) => {
    console.log(`🦊 [Request] ${request.method} ${request.url}`);
  })
  .use(cors({
    origin: true, // Разрешаем все origins в dev режиме
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie']
  }))
  .use(swagger())
  .get("/", () => "Hello LanG API")
  .group("/api/v1", (app) =>
    app
      .get("/health", () => ({ status: "ok" }))
      .use(authRoutes) // authRoutes не требуют аутентификации
      .use(landingRoutes) // landingRoutes не требуют аутентификации
      .use(wsRoutes) // WebSocket для real-time
  )
  // Защищённые роуты /api/v1 — применяем authMiddleware внутри группы
  .group("/api/v1", (protectedApp) =>
    protectedApp
      // Внутренний derive для всех защищённых /api/v1/* — читаем куку Lucia и подставляем user в контекст
      .derive(async ({ request, set }) => {
        const url = new URL(request.url);
        const cookieHeader = request.headers.get("Cookie") ?? "";

        console.log(`[AuthInline] ${request.method} ${url.pathname}`);
        console.log(`[AuthInline] Cookie Header: "${cookieHeader}"`);

        const sessionId = lucia.readSessionCookie(cookieHeader);
        if (!sessionId) {
          console.log("[AuthInline] ❌ No session ID in cookies");
          return { user: null, session: null };
        }

        const { session, user } = await lucia.validateSession(sessionId);

        if (!session) {
          console.log("[AuthInline] Invalid or expired session, clearing cookie");
          const blank = lucia.createBlankSessionCookie();
          set.headers["Set-Cookie"] = blank.serialize();
          return { user: null, session: null };
        }

        if (session.fresh) {
          console.log(`[AuthInline] Refreshing fresh session for user: ${user?.username}`);
          const sessionCookie = lucia.createSessionCookie(session.id);
          set.headers["Set-Cookie"] = sessionCookie.serialize();
        }

        console.log(`[AuthInline] Authenticated as: ${user?.username} (${user?.role})`);
        return { user, session };
      })
      .get("/me", async ({ user }) => {
        console.log(`[API /me] User: ${user?.username}`);
        if (!user) return { error: "Unauthorized", status: 401 };

        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
        if (!dbUser) return { error: "User not found" };

        const { password_hash, ...profile } = dbUser;
        const full_name = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || dbUser.username;
        return { user: { ...profile, full_name } };
      })
      .use(userRoutes)
      .use(cabinetRoutes)
      .use(adminRoutes)
      .use(uploadRoutes)
  )
  .use(staticPlugin({
    assets: "public",
    prefix: "/"
  }))
  .listen(process.env.PORT || 8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
