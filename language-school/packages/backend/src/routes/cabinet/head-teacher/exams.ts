import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { htExamTypes, htExamSchemes, htExamSchemeItems } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const headTeacherExamRoutes = new Elysia()
  .get("/exam-types", async () => {
    return await db.select().from(htExamTypes).orderBy(htExamTypes.name);
  })
  .post("/exam-types", async ({ body }: any) => {
    const [row] = await db.insert(htExamTypes).values(body).returning();
    return row;
  }, {
    body: t.Object({
      name: t.String(),
      writingMax: t.Optional(t.Number()),
      listeningMax: t.Optional(t.Number()),
      readingMax: t.Optional(t.Number()),
      speakingMax: t.Optional(t.Number()),
    })
  })
  .delete("/exam-types/:id", async ({ params: { id } }) => {
    await db.delete(htExamTypes).where(eq(htExamTypes.id, parseInt(id)));
    return { success: true };
  })
  .get("/exam-schemes", async () => {
    const schemes = await db.select().from(htExamSchemes).orderBy(htExamSchemes.name);
    const items = await db.select({
      id: htExamSchemeItems.id,
      schemeId: htExamSchemeItems.schemeId,
      examTypeId: htExamSchemeItems.examTypeId,
      weightPercentage: htExamSchemeItems.weightPercentage,
      order: htExamSchemeItems.order,
      examTypeName: htExamTypes.name,
    }).from(htExamSchemeItems)
      .leftJoin(htExamTypes, eq(htExamSchemeItems.examTypeId, htExamTypes.id))
      .orderBy(htExamSchemeItems.order);
    
    return schemes.map(s => ({
      ...s,
      items: items.filter(i => i.schemeId === s.id)
    }));
  })
  .post("/exam-schemes", async ({ body }: any) => {
    const { name, items } = body;
    const [scheme] = await db.insert(htExamSchemes).values({ name }).returning();
    if (items && items.length > 0) {
      for (const item of items) {
        await db.insert(htExamSchemeItems).values({
          schemeId: scheme.id,
          examTypeId: item.examTypeId,
          weightPercentage: item.weightPercentage,
          order: item.order || 1,
        });
      }
    }
    return scheme;
  }, {
    body: t.Object({
      name: t.String(),
      items: t.Optional(t.Array(t.Object({
        examTypeId: t.Number(),
        weightPercentage: t.Number(),
        order: t.Optional(t.Number()),
      })))
    })
  })
  .delete("/exam-schemes/:id", async ({ params: { id } }) => {
    await db.delete(htExamSchemes).where(eq(htExamSchemes.id, parseInt(id)));
    return { success: true };
  });
