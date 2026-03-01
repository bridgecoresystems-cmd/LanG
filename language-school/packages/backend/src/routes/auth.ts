import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, userRoles, sessions } from "../db/schema";
import { createUserSession } from "../auth";
import { eq } from "drizzle-orm";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_CLEAR = `better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`;

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", async ({ body, set, request }) => {
    const { username, password, email } = body;

    // 1. Проверяем что пользователь не существует
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      set.status = 400;
      return { error: "Username already taken" };
    }

    // 2. Хэшируем пароль и создаём пользователя
    const passwordHash = await Bun.password.hash(password);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      username,
      password_hash: passwordHash,
      email,
      role: "STUDENT",
    });

    // 3. Создаём сессию
    const { cookie } = await createUserSession(userId, {
      userAgent: request.headers.get("User-Agent"),
    });
    set.headers["Set-Cookie"] = cookie;

    const [newUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const { password_hash: _, ...profile } = newUser!;
    const full_name = [newUser.first_name, newUser.last_name].filter(Boolean).join(" ") || newUser.username;

    const additionalRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    return {
      message: "Registered successfully",
      user: {
        ...profile,
        full_name,
        additional_roles: additionalRoles.map(r => r.role),
      },
    };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
      email: t.Optional(t.String({ format: "email" })),
    }),
  })

  .post("/login", async ({ body, set, request }) => {
    const { username, password } = body;

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      set.status = 400;
      return { error: "Invalid username or password" };
    }

    const validPassword = await Bun.password.verify(password, user.password_hash);
    if (!validPassword) {
      set.status = 400;
      return { error: "Invalid username or password" };
    }

    // Создаём сессию
    const { cookie } = await createUserSession(user.id, {
      userAgent: request.headers.get("User-Agent"),
    });
    set.headers["Set-Cookie"] = cookie;

    const { password_hash: _, ...profile } = user;
    const full_name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

    const additionalRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    return {
      message: "Logged in successfully",
      user: {
        ...profile,
        full_name,
        additional_roles: additionalRoles.map(r => r.role),
      },
    };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })

  .post("/logout", async ({ request, set }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const token = cookieHeader.match(/better-auth\.session_token=([^;]+)/)?.[1];

    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    set.headers["Set-Cookie"] = COOKIE_CLEAR;
    return { message: "Logged out successfully" };
  });
