import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db";
import { sessions, users } from "../db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

const isProduction = process.env.NODE_ENV === "production";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      /**
       * В dev режиме:
       * - SameSite=None, чтобы кука отправлялась с фронта (localhost:3000) на API (localhost:8000)
       * - secure=false, т.к. работаем по http, а не https
       *
       * В production:
       * - SameSite=lax и secure=true (обычное поведение)
       */
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      // Не устанавливаем Domain для localhost
      // domain: undefined,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      role: attributes.role,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      role: string;
    };
  }
}
