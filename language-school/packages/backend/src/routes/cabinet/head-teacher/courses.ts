import { Elysia, t } from "elysia";
import { db } from "../../../db/index";
import { htCourses, users, htGroups, htExamGrades, htExamSchemeItems } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { ROLES } from "../../../constants/roles";

export const headTeacherCourseRoutes = new Elysia()
  .get("/courses", async (context: any) => {
    const { user, query } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const rows = u?.role === ROLES.SUPERUSER
      ? await db.select().from(htCourses).orderBy(desc(htCourses.createdAt))
      : await db.select().from(htCourses).where(eq(htCourses.schoolId, u!.school_id!)).orderBy(desc(htCourses.createdAt));
    const search = (query.search as string)?.trim();
    const isActive = query.is_active;
    let filtered = rows;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.name?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.language?.toLowerCase().includes(s) ||
        r.level?.toLowerCase().includes(s)
      );
    }
    if (isActive === "true" || isActive === "false") {
      filtered = filtered.filter((r) => r.isActive === (isActive === "true"));
    }
    return filtered.map((r) => ({
      id: r.id,
      name: r.name,
      language: r.language,
      level: r.level,
      description: r.description,
      duration_months: r.durationMonths,
      is_active: r.isActive,
      school_id: r.schoolId,
      created_at: r.createdAt?.toISOString(),
    }));
  })
  .get("/courses/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      level: row.level,
      description: row.description,
      duration_months: row.durationMonths,
      is_active: row.isActive,
      school_id: row.schoolId,
      created_at: row.createdAt?.toISOString(),
      updated_at: row.updatedAt?.toISOString(),
    };
  })
  .post("/courses", async (context: any) => {
    const { user, body } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const name = (body.name as string)?.trim();
    const language = (body.language as string)?.trim();
    const level = (body.level as string)?.trim();
    if (!name || !language || !level) throw new Error("name, language, level are required");
    const [created] = await db
      .insert(htCourses)
      .values({
        name,
        language,
        level,
        description: (body.description as string)?.trim() || null,
        durationMonths: (body.duration_months as number) ?? 3,
        schoolId: u?.school_id ?? null,
        isActive: (body.is_active as boolean) !== false,
      })
      .returning();
    return {
      id: created.id,
      name: created.name,
      language: created.language,
      level: created.level,
      description: created.description,
      duration_months: created.durationMonths,
      is_active: created.isActive,
      created_at: created.createdAt?.toISOString(),
    };
  }, {
    body: t.Object({
      name: t.String(),
      language: t.String(),
      level: t.String(),
      description: t.Optional(t.String()),
      duration_months: t.Optional(t.Number()),
      is_active: t.Optional(t.Boolean()),
    }),
  })
  .patch("/courses/:id", async (context: any) => {
    const { user, params: { id }, body, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.name !== undefined) updateData.name = String(payload.name).trim();
    if (payload.language !== undefined) updateData.language = String(payload.language).trim();
    if (payload.level !== undefined) updateData.level = String(payload.level).trim();
    if (payload.description !== undefined) updateData.description = (payload.description as string)?.trim() || null;
    if (payload.duration_months !== undefined) updateData.durationMonths = payload.duration_months as number;
    if (payload.is_active !== undefined) updateData.isActive = payload.is_active as boolean;
    const [updated] = await db.update(htCourses).set(updateData as any).where(eq(htCourses.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return {
      id: updated.id,
      name: updated.name,
      language: updated.language,
      level: updated.level,
      description: updated.description,
      duration_months: updated.durationMonths,
      is_active: updated.isActive,
      updated_at: updated.updatedAt?.toISOString(),
    };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      language: t.Optional(t.String()),
      level: t.Optional(t.String()),
      description: t.Optional(t.String()),
      duration_months: t.Optional(t.Number()),
      is_active: t.Optional(t.Boolean()),
    }),
  })
  .delete("/courses/:id", async (context: any) => {
    const { user, params: { id }, set } = context;
    const [u] = await db.select({ role: users.role, school_id: users.school_id }).from(users).where(eq(users.id, user!.id)).limit(1);
    const [row] = await db.select().from(htCourses).where(eq(htCourses.id, parseInt(id))).limit(1);
    if (!row || (u?.role === ROLES.HEAD_TEACHER && row.schoolId !== u.school_id)) {
      set.status = 404;
      return { error: "Not found" };
    }
    await db.delete(htCourses).where(eq(htCourses.id, parseInt(id)));
    return { message: "Deleted" };
  })
  .get("/courses/:id/statistics", async (context: any) => {
    const { params: { id }, set } = context;
    const courseId = parseInt(id);
    const [course] = await db.select().from(htCourses).where(eq(htCourses.id, courseId)).limit(1);
    if (!course) {
      set.status = 404;
      return { error: "Course not found" };
    }
    const groups = await db.select({
      id: htGroups.id,
      name: htGroups.name,
      teacherId: htGroups.teacherId,
      teacherFirstName: users.first_name,
      teacherLastName: users.last_name,
    }).from(htGroups)
      .leftJoin(users, eq(htGroups.teacherId, users.id))
      .where(eq(htGroups.courseId, courseId));
    const groupsData = [];
    for (const group of groups) {
      const examAverages: Record<number, number | null> = { 1: null, 2: null, 3: null, 4: null };
      const grades = await db.select({
        totalScore: htExamGrades.totalScore,
        schemeItemId: htExamGrades.schemeItemId,
        order: htExamSchemeItems.order,
      }).from(htExamGrades)
        .leftJoin(htExamSchemeItems, eq(htExamGrades.schemeItemId, htExamSchemeItems.id))
        .where(eq(htExamGrades.groupId, group.id));
      const byOrder: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
      grades.forEach(g => {
        const order = g.order || 1;
        if (order >= 1 && order <= 4) {
          byOrder[order].push(Number(g.totalScore || 0));
        }
      });
      for (let i = 1; i <= 4; i++) {
        if (byOrder[i].length > 0) {
          examAverages[i] = byOrder[i].reduce((a, b) => a + b, 0) / byOrder[i].length;
        }
      }
      groupsData.push({
        id: group.id,
        name: group.name,
        teacher: [group.teacherFirstName, group.teacherLastName].filter(Boolean).join(" ") || null,
        exam_averages: examAverages,
      });
    }
    return {
      course: {
        id: course.id,
        name: course.name,
        language: course.language,
        level: course.level,
      },
      groups: groupsData,
    };
  });
