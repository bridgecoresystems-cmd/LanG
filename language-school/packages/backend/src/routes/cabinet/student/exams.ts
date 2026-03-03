import { Elysia } from "elysia";
import { db } from "../../../db/index";
import {
  htGroups, htGroupStudents, htExamSchemes, htExamSchemeItems,
  htExamTypes, htExamGrades,
} from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export const studentExamRoutes = new Elysia()
  // GET /student/groups/:groupId/exam-results
  // Returns student's own exam grades + certificate score calculation
  .get("/groups/:groupId/exam-results", async (context: any) => {
    const { user, params: { groupId }, set } = context;
    const gid = parseInt(groupId);

    // Verify student is in this group
    const [membership] = await db
      .select({ id: htGroupStudents.id })
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, user!.id)))
      .limit(1);

    if (!membership) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [group] = await db
      .select({ examSchemeId: htGroups.examSchemeId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group?.examSchemeId) {
      return { scheme: null, grades: [], certificateScore: null };
    }

    // Load scheme + items + exam types
    const [scheme] = await db
      .select()
      .from(htExamSchemes)
      .where(eq(htExamSchemes.id, group.examSchemeId))
      .limit(1);

    const items = await db
      .select({
        id: htExamSchemeItems.id,
        order: htExamSchemeItems.order,
        weightPercentage: htExamSchemeItems.weightPercentage,
        examTypeName: htExamTypes.name,
        writingMax: htExamTypes.writingMax,
        listeningMax: htExamTypes.listeningMax,
        readingMax: htExamTypes.readingMax,
        speakingMax: htExamTypes.speakingMax,
      })
      .from(htExamSchemeItems)
      .leftJoin(htExamTypes, eq(htExamSchemeItems.examTypeId, htExamTypes.id))
      .where(eq(htExamSchemeItems.schemeId, group.examSchemeId))
      .orderBy(htExamSchemeItems.order);

    // Load student's grades for this group
    const grades = await db
      .select({
        id: htExamGrades.id,
        schemeItemId: htExamGrades.schemeItemId,
        writing: htExamGrades.writing,
        listening: htExamGrades.listening,
        reading: htExamGrades.reading,
        speaking: htExamGrades.speaking,
        totalScore: htExamGrades.totalScore,
      })
      .from(htExamGrades)
      .where(and(eq(htExamGrades.groupId, gid), eq(htExamGrades.userId, user!.id)));

    const gradeMap: Record<number, typeof grades[0]> = {};
    for (const g of grades) gradeMap[g.schemeItemId] = g;

    // Calculate certificate score
    // formula: sum( grade.totalScore * (schemeItem.weightPercentage / 100) )
    let certificateScore = 0;
    let allTaken = true;
    const enrichedItems = items.map((item) => {
      const grade = gradeMap[item.id] || null;
      const totalMax = (item.writingMax || 0) + (item.listeningMax || 0) +
        (item.readingMax || 0) + (item.speakingMax || 0);
      let contribution: number | null = null;
      if (grade) {
        const total = Number(grade.totalScore ?? 0);
        contribution = parseFloat((total * (item.weightPercentage / 100)).toFixed(2));
        certificateScore += contribution;
      } else {
        allTaken = false;
      }
      return {
        ...item,
        totalMax,
        grade,
        contribution,
      };
    });

    return {
      scheme: { id: scheme.id, name: scheme.name },
      items: enrichedItems,
      certificateScore: parseFloat(certificateScore.toFixed(2)),
      allTaken,
    };
  });
