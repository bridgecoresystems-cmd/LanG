import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users, userRoles, sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";
import { landingRoutes } from "./routes/landing";
import { userRoutes } from "./routes/users";

import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin/index";
import { cabinetRoutes } from "./routes/cabinet/index";
import { uploadRoutes } from "./routes/upload";
import { wsRoutes } from "./routes/ws";
import { wsGemsRoutes } from "./routes/ws-gems";
import { terminalRoutes } from "./routes/terminal";
import { staticPlugin } from "@elysiajs/static";

export const app = new Elysia()
  .onRequest(({ request }) => {
    console.log(`🦊 [Request] ${request.method} ${request.url}`);
  })
  .use(cors({
    origin: true,
    credentials: true,
    preflight: true,
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
      .use(wsRoutes) // WebSocket для real-time (contact broadcast)
      .use(wsGemsRoutes) // WebSocket для gems balance real-time
      .use(terminalRoutes) // ESP32 terminal — no session auth, uses terminalId+authToken
  )
  // Защищённые роуты /api/v1 — применяем authMiddleware внутри группы
  .group("/api/v1", (protectedApp) =>
    protectedApp
      // Внутренний derive для всех защищённых /api/v1/* — валидируем сессию напрямую через Drizzle
      .derive(async ({ request, set }) => {
        const url = new URL(request.url);
        const cookieHeader = request.headers.get("Cookie") ?? "";
        console.log(`[AuthInline] ${request.method} ${url.pathname}`);

        const token = cookieHeader.match(/better-auth\.session_token=([^;]+)/)?.[1];
        if (!token) {
          console.log("[AuthInline] ❌ No session token in cookies");
          return { user: null, session: null };
        }

        const now = new Date();
        const [session] = await db
          .select()
          .from(sessions)
          .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
          .limit(1);

        if (!session) {
          console.log("[AuthInline] ❌ Session not found or expired");
          const isProduction = process.env.NODE_ENV === "production";
          set.headers["Set-Cookie"] = `better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`;
          return { user: null, session: null };
        }

        const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
        if (!user) {
          console.log("[AuthInline] ❌ User not found");
          return { user: null, session: null };
        }

        console.log(`[AuthInline] ✅ Authenticated as: ${user.username} (${user.role})`);
        return { user, session };
      })
      .get("/me", async ({ user }) => {
        console.log(`[API /me] User: ${user?.username}`);
        if (!user) return { error: "Unauthorized", status: 401 };

        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
        if (!dbUser) return { error: "User not found" };

        // Получаем дополнительные роли
        const { userRoles } = await import("./db/schema");
        const additionalRoles = await db
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));

        const { password_hash, ...profile } = dbUser;
        const full_name = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || dbUser.username;
        return { 
          user: { 
            ...profile, 
            full_name,
            additional_roles: additionalRoles.map(r => r.role),
          } 
        };
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
  .listen({
  port: Number(process.env.PORT) || 8010,
  hostname: "0.0.0.0", // доступ по IP в локальной сети (телефон, ESP32 терминал)
});

console.log(
  `🦊 Elysia is running at http://0.0.0.0:${app.server?.port} (LAN: http://<твой_IP>:${app.server?.port})`
);

export type App = typeof app;
