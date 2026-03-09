import { Elysia } from "elysia";
import { db } from "../../../db/index";
import {
  users,
  htGroupStudents,
  htGroups,
  htCourses,
  payments,
  gemsWallets,
  gemsTransactions,
  schools,
  htExamSchemes,
  htExamSchemeItems,
  htExamTypes,
  htExamGrades,
} from "../../../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";
import { getStudentMyGroups } from "../student";

async function verifyChildOwnership(parentId: string, childId: string): Promise<boolean> {
  const [child] = await db
    .select({ id: users.id, parentId: users.parent_id })
    .from(users)
    .where(eq(users.id, childId))
    .limit(1);
  return child?.parentId === parentId;
}

export const parentRoutes = new Elysia({ prefix: "/parent" })
  .onBeforeHandle(async (context: any) => {
    const { user, set } = context;
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const [u] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (u?.role !== ROLES.PARENT && u?.role !== ROLES.SUPERUSER) {
      set.status = 403;
      return { error: "Forbidden: Parent role required" };
    }
  })

  // GET /parent/children/:childId/groups
  .get("/children/:childId/groups", async (context: any) => {
    const { user, params: { childId }, set } = context;
    const isOwner = await verifyChildOwnership(user.id, childId);
    if (!isOwner) {
      set.status = 403;
      return { error: "Forbidden: This child does not belong to you" };
    }
    return getStudentMyGroups(childId);
  })

  // GET /parent/children/:childId/gems
  .get("/children/:childId/gems", async (context: any) => {
    const { user, params: { childId }, set } = context;
    const isOwner = await verifyChildOwnership(user.id, childId);
    if (!isOwner) {
      set.status = 403;
      return { error: "Forbidden: This child does not belong to you" };
    }

    // Get or create wallet
    let [wallet] = await db
      .select({ balance: gemsWallets.balance })
      .from(gemsWallets)
      .where(eq(gemsWallets.userId, childId))
      .limit(1);
    const balance = wallet ? Number(wallet.balance) : 0;

    // Get transactions
    const txRows = await db
      .select({
        id: gemsTransactions.id,
        amount: gemsTransactions.amount,
        type: gemsTransactions.type,
        comment: gemsTransactions.comment,
        createdAt: gemsTransactions.createdAt,
        senderId: gemsTransactions.senderId,
        receiverId: gemsTransactions.receiverId,
      })
      .from(gemsTransactions)
      .where(
        or(
          eq(gemsTransactions.senderId, childId),
          eq(gemsTransactions.receiverId, childId)
        )
      )
      .orderBy(desc(gemsTransactions.createdAt))
      .limit(100);

    // Enrich with sender/receiver names
    const enriched = await Promise.all(
      txRows.map(async (row) => {
        let senderName: string | null = null;
        let receiverName: string | null = null;

        if (row.senderId) {
          const [s] = await db
            .select({ first_name: users.first_name, last_name: users.last_name })
            .from(users)
            .where(eq(users.id, row.senderId))
            .limit(1);
          senderName = s ? [s.first_name, s.last_name].filter(Boolean).join(" ") : null;
        }
        if (row.receiverId) {
          const [r] = await db
            .select({ first_name: users.first_name, last_name: users.last_name })
            .from(users)
            .where(eq(users.id, row.receiverId))
            .limit(1);
          receiverName = r ? [r.first_name, r.last_name].filter(Boolean).join(" ") : null;
        }

        return {
          id: row.id,
          amount: Number(row.amount),
          type: row.type,
          comment: row.comment,
          createdAt: row.createdAt?.toISOString(),
          direction: row.senderId === childId ? "out" : "in",
          senderName,
          receiverName,
        };
      })
    );

    return { balance, transactions: enriched };
  })

  // GET /parent/children/:childId/payments
  .get("/children/:childId/payments", async (context: any) => {
    const { user, params: { childId }, set } = context;
    const isOwner = await verifyChildOwnership(user.id, childId);
    if (!isOwner) {
      set.status = 403;
      return { error: "Forbidden: This child does not belong to you" };
    }

    const rows = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        discount: payments.discount,
        total: payments.total,
        method: payments.method,
        purpose: payments.purpose,
        isPartial: payments.isPartial,
        createdAt: payments.createdAt,
        groupId: payments.groupId,
        groupName: htGroups.name,
        courseName: htCourses.name,
        schoolId: payments.schoolId,
        schoolName: schools.name,
      })
      .from(payments)
      .leftJoin(htGroups, eq(payments.groupId, htGroups.id))
      .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
      .leftJoin(schools, eq(payments.schoolId, schools.id))
      .where(eq(payments.studentId, childId))
      .orderBy(desc(payments.createdAt));

    return rows.map((r) => ({
      id: r.id,
      amount: parseFloat(r.amount),
      discount: parseFloat(r.discount || "0"),
      total: parseFloat(r.total),
      method: r.method,
      purpose: r.purpose,
      is_partial: r.isPartial,
      created_at: r.createdAt?.toISOString(),
      group_id: r.groupId,
      group_name: r.groupName,
      course_name: r.courseName,
      school_id: r.schoolId,
      school_name: r.schoolName,
    }));
  })

  // GET /parent/children/:childId/grades/:groupId
  .get("/children/:childId/grades/:groupId", async (context: any) => {
    const { user, params: { childId, groupId }, set } = context;
    const isOwner = await verifyChildOwnership(user.id, childId);
    if (!isOwner) {
      set.status = 403;
      return { error: "Forbidden: This child does not belong to you" };
    }

    const gid = parseInt(groupId);

    // Verify student is in this group
    const [membership] = await db
      .select({ id: htGroupStudents.id })
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, childId)))
      .limit(1);

    if (!membership) {
      set.status = 403;
      return { error: "Child is not enrolled in this group" };
    }

    const [group] = await db
      .select({ examSchemeId: htGroups.examSchemeId })
      .from(htGroups)
      .where(eq(htGroups.id, gid))
      .limit(1);

    if (!group?.examSchemeId) {
      return { scheme: null, grades: [], certificateScore: null };
    }

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
      .where(and(eq(htExamGrades.groupId, gid), eq(htExamGrades.userId, childId)));

    const gradeMap: Record<number, (typeof grades)[0]> = {};
    for (const g of grades) gradeMap[g.schemeItemId] = g;

    let certificateScore = 0;
    let allTaken = true;
    const enrichedItems = items.map((item) => {
      const grade = gradeMap[item.id] || null;
      const totalMax =
        (item.writingMax || 0) +
        (item.listeningMax || 0) +
        (item.readingMax || 0) +
        (item.speakingMax || 0);
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
