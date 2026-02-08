import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authMiddleware } from "./middleware";
import { lucia } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { landingRoutes } from "./routes/landing";
import { userRoutes } from "./routes/users";

import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { uploadRoutes } from "./routes/upload";
import { wsRoutes } from "./routes/ws";
import { staticPlugin } from "@elysiajs/static";

const app = new Elysia()
  .use(cors({
    origin: [
      'http://localhost:3000', 'http://127.0.0.1:3000',
      'http://localhost:3001', 'http://127.0.0.1:3001',
    ],
    credentials: true,
  }))
  .use(swagger())
  .use(staticPlugin({
    assets: "public",
    prefix: "/"
  }))
  .get("/", () => "Hello LanG API")
  .group("/api/v1", (app) =>
    app
      .get("/health", () => ({ status: "ok" }))
      .use(authRoutes) // authRoutes не требуют аутентификации
      .use(landingRoutes) // landingRoutes не требуют аутентификации
      .use(wsRoutes) // WebSocket для real-time
      .use(authMiddleware) // Применяем authMiddleware для защищенных роутов
      .derive(async ({ request, set }) => {
        // Применяем authMiddleware непосредственно к /me
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
      })
      .get("/me", async ({ user }) => {
        if (!user) return { error: "Unauthorized", status: 401 };
        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
        if (!dbUser) return { error: "User not found" };
        const { password_hash, ...profile } = dbUser;
        const full_name = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || dbUser.username;
        return { user: { ...profile, full_name } };
      })
      .use(userRoutes)
      .use(adminRoutes)
      .use(uploadRoutes)
  )
  .listen(process.env.PORT || 8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
