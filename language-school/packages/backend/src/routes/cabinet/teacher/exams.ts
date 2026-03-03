import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import {
  htGroups, htGroupStudents, htExamSchemes, htExamSchemeItems,
  htExamTypes, htExamGrades, users,
} from "../../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const teacherExamRoutes = new Elysia()
  // GET /teacher/groups/:groupId/exam-schema
  // Returns exam scheme + items + exam types for the group
  .get("/groups/:groupId/exam-schema", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);

    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId, examSchemeId: htGroups.examSchemeId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    if (!group.examSchemeId) return null;

    const [scheme] = await db
      .select()
      .from(htExamSchemes)
      .where(eq(htExamSchemes.id, group.examSchemeId))
      .limit(1);
    if (!scheme) return null;

    const items = await db
      .select({
        id: htExamSchemeItems.id,
        order: htExamSchemeItems.order,
        weightPercentage: htExamSchemeItems.weightPercentage,
        examTypeId: htExamSchemeItems.examTypeId,
        examTypeName: htExamTypes.name,
        writingMax: htExamTypes.writingMax,
        listeningMax: htExamTypes.listeningMax,
        readingMax: htExamTypes.readingMax,
        speakingMax: htExamTypes.speakingMax,
      })
      .from(htExamSchemeItems)
      .leftJoin(htExamTypes, eq(htExamSchemeItems.examTypeId, htExamTypes.id))
      .where(eq(htExamSchemeItems.schemeId, scheme.id))
      .orderBy(htExamSchemeItems.order);

    return { ...scheme, items };
  })

  // GET /teacher/groups/:groupId/exam-grades
  // Returns all exam grades for all students in the group
  .get("/groups/:groupId/exam-grades", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);

    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({
        id: htExamGrades.id,
        userId: htExamGrades.userId,
        schemeItemId: htExamGrades.schemeItemId,
        writing: htExamGrades.writing,
        listening: htExamGrades.listening,
        reading: htExamGrades.reading,
        speaking: htExamGrades.speaking,
        totalScore: htExamGrades.totalScore,
      })
      .from(htExamGrades)
      .where(eq(htExamGrades.groupId, gid));

    return rows;
  })

  // GET /teacher/groups/:groupId/students-list
  // Returns students with name for the grade table
  .get("/groups/:groupId/students-list", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);

    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const rows = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(htGroupStudents)
      .innerJoin(users, eq(htGroupStudents.userId, users.id))
      .where(eq(htGroupStudents.groupId, gid));

    return rows.map((r) => ({
      id: r.id,
      full_name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "—",
    }));
  })

  // PUT /teacher/groups/:groupId/exam-grades
  // Upsert a grade for one student + one scheme item
  .put("/groups/:groupId/exam-grades", async (context: any) => {
    const { user, params: { groupId }, body, set } = context;
    const gid = parseInt(groupId);
    const { userId, schemeItemId, writing, listening, reading, speaking } = body as any;

    const [group] = await db
      .select({ id: htGroups.id, teacherId: htGroups.teacherId, examSchemeId: htGroups.examSchemeId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group || group.teacherId !== user!.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    // Verify scheme item belongs to this group's scheme
    if (group.examSchemeId) {
      const [item] = await db
        .select({ id: htExamSchemeItems.id })
        .from(htExamSchemeItems)
        .where(and(
          eq(htExamSchemeItems.id, schemeItemId),
          eq(htExamSchemeItems.schemeId, group.examSchemeId)
        ))
        .limit(1);
      if (!item) {
        set.status = 400;
        return { error: "Scheme item does not belong to this group" };
      }
    }

    const w = Number(writing ?? 0);
    const l = Number(listening ?? 0);
    const r = Number(reading ?? 0);
    const s = Number(speaking ?? 0);
    const total = (w + l + r + s).toFixed(2);

    // Check if grade already exists
    const [existing] = await db
      .select({ id: htExamGrades.id })
      .from(htExamGrades)
      .where(and(
        eq(htExamGrades.userId, userId),
        eq(htExamGrades.groupId, gid),
        eq(htExamGrades.schemeItemId, schemeItemId)
      ))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(htExamGrades)
        .set({
          writing: String(w),
          listening: String(l),
          reading: String(r),
          speaking: String(s),
          totalScore: total,
          updatedAt: new Date(),
        })
        .where(eq(htExamGrades.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(htExamGrades)
        .values({
          userId,
          groupId: gid,
          schemeItemId,
          writing: String(w),
          listening: String(l),
          reading: String(r),
          speaking: String(s),
          totalScore: total,
        })
        .returning();
      return created;
    }
  }, {
    body: t.Object({
      userId: t.String(),
      schemeItemId: t.Number(),
      writing: t.Optional(t.Number()),
      listening: t.Optional(t.Number()),
      reading: t.Optional(t.Number()),
      speaking: t.Optional(t.Number()),
    })
  });
