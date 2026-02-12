import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
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

    // 3. Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    set.headers["Set-Cookie"] = sessionCookie.serialize();
    return { message: "Registered successfully", user: { username, email } };
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
    
    console.log(`[Login] Created session for user: ${user.username}`);
    console.log(`[Login] Session ID: ${session.id}`);
    console.log(`[Login] Cookie: ${sessionCookie.serialize()}`);
    
    set.headers["Set-Cookie"] = sessionCookie.serialize();
    return { message: "Logged in successfully", user: { id: user.id, username: user.username, role: user.role } };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })
  .post("/logout", async ({ session, set }) => {
    if (session) {
      await lucia.invalidateSession(session.id);
    }
    const sessionCookie = lucia.createBlankSessionCookie();
    set.headers["Set-Cookie"] = sessionCookie.serialize();
    return { message: "Logged out successfully" };
  });
