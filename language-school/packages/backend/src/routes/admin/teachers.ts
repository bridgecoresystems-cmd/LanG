import { Elysia } from "elysia";
import { db } from "../../db";
import { teachers } from "../../db/schema";

export const adminTeachersRoutes = new Elysia({ prefix: "/teachers" })
  .post("/", async ({ body }) => {
    return await db.insert(teachers).values(body as any).returning();
  });
