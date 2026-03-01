import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { users, sessions, accounts, verifications } from "../db/schema";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 8010}`,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  user: {
    fields: {
      // Better Auth внутри использует "name" и "image" — маппим на наши колонки
      name: "username",
      image: "avatar",
      emailVerified: "email_verified",
      updatedAt: "updated_at",
      createdAt: "created_at",
    },
    additionalFields: {
      role: { type: "string", defaultValue: "student" },
      first_name: { type: "string", nullable: true },
      last_name: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      rfid_uid: { type: "string", nullable: true },
      video: { type: "string", nullable: true },
      is_active: { type: "boolean", defaultValue: true },
      can_export_excel: { type: "boolean", defaultValue: false },
      can_view_all_schools: { type: "boolean", defaultValue: false },
      school_id: { type: "number", nullable: true },
      parent_id: { type: "string", nullable: true },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 дней
    updateAge: 60 * 60 * 24,       // обновлять если старше 1 дня
    // fields не нужны — Drizzle field names (userId, expiresAt, etc.) уже совпадают с Better Auth
  },

  advanced: {
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        attributes: {
          sameSite: "lax",
          path: "/",
          httpOnly: true,
          secure: isProduction,
        },
      },
    },
  },

  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8010",
    ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []),
  ],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
export type BetterAuthUser = typeof auth.$Infer.Session.user;

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней в секундах

/** Создаёт сессию напрямую в БД (Better Auth читает её через getSession по token). */
export async function createUserSession(
  userId: string,
  options?: { ip?: string | null; userAgent?: string | null }
): Promise<{ cookie: string }> {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    token,
    expiresAt,
    ipAddress: options?.ip ?? null,
    userAgent: options?.userAgent ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const secure = isProduction ? "; Secure" : "";
  const cookie = `better-auth.session_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`;
  return { cookie };
}
