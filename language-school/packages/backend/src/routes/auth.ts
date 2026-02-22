import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, userRoles } from "../db/schema";
import { lucia } from "../auth";
import { eq } from "drizzle-orm";
import { generateId } from "lucia";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", async ({ body, set }) => {
    const { username, password, email } = body;
    
    // 1. Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      set.status = 400;
      return { error: "Username already taken" };
    }

    // 2. Hash password and create user
    const passwordHash = await Bun.password.hash(password);
    const userId = generateId(15);

    await db.insert(users).values({
      id: userId,
      username,
      password_hash: passwordHash,
      email,
      role: "STUDENT" // default role
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    set.headers["Set-Cookie"] = sessionCookie.serialize();

    const [newUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...profile } = newUser!;
    const full_name = [newUser.first_name, newUser.last_name].filter(Boolean).join(" ") || newUser.username;
    
    // Получаем дополнительные роли
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
      } 
    };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
      email: t.Optional(t.String({ format: "email" }))
    })
  })
  .post("/login", async ({ body, set }) => {
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

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    set.headers["Set-Cookie"] = sessionCookie.serialize();
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...profile } = user;
    const full_name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
    
    // Получаем дополнительные роли
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
      } 
    };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })
  .post("/logout", async ({ request, set }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const sessionId = lucia.readSessionCookie(cookieHeader);
    
    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }
    
    const sessionCookie = lucia.createBlankSessionCookie();
    set.headers["Set-Cookie"] = sessionCookie.serialize();
    return { message: "Logged out successfully" };
  });
