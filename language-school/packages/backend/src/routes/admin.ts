import { Elysia, t } from "elysia";
import { db } from "../db";
import { contactMessages, changelog, courseCategories, courseSubCategories, courses, news, teachers, users } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { lucia } from "../auth";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .derive(async ({ request, set }) => {
    // Встраиваем логику аутентификации непосредственно здесь
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const sessionId = lucia.readSessionCookie(cookieHeader);
    if (!sessionId) {
      return { user: null, session: null };
    }

    const { session, user } = await lucia.validateSession(sessionId);
    
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    }
    return { user, session };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden: Admins only" };
    }
  })
  // --- Admin Profile ---
  .get("/profile", async ({ user }) => {
    if (!user) return { error: "Unauthorized" };
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!dbUser) return { error: "User not found" };
    const { password_hash, ...profile } = dbUser;
    return profile;
  })
  .patch("/profile", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const payload = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (payload.first_name !== undefined) updateData.first_name = payload.first_name;
    if (payload.last_name !== undefined) updateData.last_name = payload.last_name;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
    if (payload.email !== undefined) updateData.email = payload.email;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, user.id)).returning();
    if (!updated) return { error: "Not found" };
    const { password_hash, ...profile } = updated;
    return profile;
  })

  // --- Admin Password Change ---
  .post("/change-password", async ({ user, body, set }) => {
    if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
    }
    const { currentPassword, newPassword } = body;
    
    // Получаем пользователя из базы чтобы проверить пароль
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    
    if (!dbUser) {
        set.status = 404;
        return { error: "User not found" };
    }

    const isValid = await Bun.password.verify(currentPassword, dbUser.password_hash);
    if (!isValid) {
        set.status = 400;
        return { error: "Invalid current password" };
    }

    const newHash = await Bun.password.hash(newPassword);
    
    await db.update(users)
        .set({ password_hash: newHash })
        .where(eq(users.id, user.id));
        
    return { message: "Password changed successfully" };
  }, {
    body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String()
    })
  })

  // --- Course Categories ---
  .get("/categories", async () => {
    return await db.select().from(courseCategories);
  })
  .post("/categories", async ({ body }) => {
    return await db.insert(courseCategories).values(body).returning();
  }, {
    body: t.Object({
      name: t.String(),
      name_tm: t.Optional(t.String()),
      name_ru: t.Optional(t.String()),
      name_en: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      image: t.Optional(t.String()),
      order: t.Optional(t.Number()),
      is_active: t.Optional(t.Boolean())
    })
  })
  .patch("/categories/:id", async ({ params: { id }, body }) => {
    return await db.update(courseCategories)
      .set(body)
      .where(eq(courseCategories.id, parseInt(id)))
      .returning();
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      name_tm: t.String(),
      name_ru: t.String(),
      name_en: t.String(),
      icon: t.String(),
      image: t.String(),
      order: t.Number(),
      is_active: t.Boolean()
    }))
  })
  .delete("/categories/:id", async ({ params: { id } }) => {
    await db.delete(courseCategories).where(eq(courseCategories.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })

  // --- Course Subcategories ---
  .get("/subcategories", async () => {
    const rows = await db.select({
      id: courseSubCategories.id,
      categoryId: courseSubCategories.categoryId,
      name: courseSubCategories.name,
      name_tm: courseSubCategories.name_tm,
      name_ru: courseSubCategories.name_ru,
      name_en: courseSubCategories.name_en,
      description: courseSubCategories.description,
      image: courseSubCategories.image,
      order: courseSubCategories.order,
      is_active: courseSubCategories.is_active,
      category_name_tm: courseCategories.name_tm,
      category_name_ru: courseCategories.name_ru,
      category_name_en: courseCategories.name_en,
    }).from(courseSubCategories)
      .leftJoin(courseCategories, eq(courseSubCategories.categoryId, courseCategories.id))
      .orderBy(desc(courseSubCategories.order));
    return rows;
  })
  .get("/subcategories/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(courseSubCategories).where(eq(courseSubCategories.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/subcategories", async ({ body }) => {
    const p = body as any;
    const [created] = await db.insert(courseSubCategories).values({
      categoryId: p.category_id ?? p.categoryId,
      name: p.name_ru || p.name_tm || p.name_en || "",
      name_tm: p.name_tm,
      name_ru: p.name_ru,
      name_en: p.name_en,
      description: p.description,
      image: p.image,
      order: p.order ?? 0,
      is_active: p.is_active ?? true,
    }).returning();
    return created;
  })
  .patch("/subcategories/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.name_tm !== undefined) updateData.name_tm = payload.name_tm;
    if (payload.name_ru !== undefined) updateData.name_ru = payload.name_ru;
    if (payload.name_en !== undefined) updateData.name_en = payload.name_en;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.order !== undefined) updateData.order = payload.order;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courseSubCategories).set(updateData).where(eq(courseSubCategories.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .put("/subcategories/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.name_tm !== undefined) updateData.name_tm = payload.name_tm;
    if (payload.name_ru !== undefined) updateData.name_ru = payload.name_ru;
    if (payload.name_en !== undefined) updateData.name_en = payload.name_en;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.order !== undefined) updateData.order = payload.order;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courseSubCategories).set(updateData).where(eq(courseSubCategories.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .delete("/subcategories/:id", async ({ params: { id } }) => {
    await db.delete(courseSubCategories).where(eq(courseSubCategories.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })

  // --- Courses ---
  .get("/courses", async () => {
    const rows = await db.select({
      id: courses.id,
      categoryId: courses.categoryId,
      subcategoryId: courses.subcategoryId,
      title: courses.title,
      title_tm: courses.title_tm,
      title_ru: courses.title_ru,
      title_en: courses.title_en,
      description: courses.description,
      image: courses.image,
      duration_weeks: courses.duration_weeks,
      hours_per_week: courses.hours_per_week,
      price: courses.price,
      discount_price: courses.discount_price,
      is_active: courses.is_active,
      category_name_tm: courseCategories.name_tm,
      category_name_ru: courseCategories.name_ru,
      category_name_en: courseCategories.name_en,
      subcategory_name_tm: courseSubCategories.name_tm,
      subcategory_name_ru: courseSubCategories.name_ru,
      subcategory_name_en: courseSubCategories.name_en,
    }).from(courses)
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .leftJoin(courseSubCategories, eq(courses.subcategoryId, courseSubCategories.id));
    return rows;
  })
  .get("/courses/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(courses).where(eq(courses.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/courses", async ({ body }) => {
    const payload = body as any;
    const [created] = await db.insert(courses).values({
      categoryId: payload.category_id,
      subcategoryId: payload.subcategory_id,
      title: payload.title || payload.title_ru || payload.title_tm || "",
      title_tm: payload.title_tm,
      title_ru: payload.title_ru,
      title_en: payload.title_en,
      description: payload.description || payload.description_ru || payload.description_tm || "",
      description_tm: payload.description_tm,
      description_ru: payload.description_ru,
      description_en: payload.description_en,
      image: payload.image,
      duration_weeks: payload.duration_weeks ?? 0,
      hours_per_week: payload.hours_per_week ?? 0,
      price: payload.price ?? "0",
      discount_price: payload.discount_price,
      is_active: payload.is_active ?? true,
    }).returning();
    return created;
  })
  .patch("/courses/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.subcategory_id !== undefined) updateData.subcategoryId = payload.subcategory_id;
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.description_tm !== undefined) updateData.description_tm = payload.description_tm;
    if (payload.description_ru !== undefined) updateData.description_ru = payload.description_ru;
    if (payload.description_en !== undefined) updateData.description_en = payload.description_en;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.duration_weeks !== undefined) updateData.duration_weeks = payload.duration_weeks;
    if (payload.hours_per_week !== undefined) updateData.hours_per_week = payload.hours_per_week;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.discount_price !== undefined) updateData.discount_price = payload.discount_price;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courses).set(updateData).where(eq(courses.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .put("/courses/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.category_id !== undefined) updateData.categoryId = payload.category_id;
    if (payload.subcategory_id !== undefined) updateData.subcategoryId = payload.subcategory_id;
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.description_tm !== undefined) updateData.description_tm = payload.description_tm;
    if (payload.description_ru !== undefined) updateData.description_ru = payload.description_ru;
    if (payload.description_en !== undefined) updateData.description_en = payload.description_en;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.duration_weeks !== undefined) updateData.duration_weeks = payload.duration_weeks;
    if (payload.hours_per_week !== undefined) updateData.hours_per_week = payload.hours_per_week;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.discount_price !== undefined) updateData.discount_price = payload.discount_price;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    const [updated] = await db.update(courses).set(updateData).where(eq(courses.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  })
  .delete("/courses/:id", async ({ params: { id } }) => {
    await db.delete(courses).where(eq(courses.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })

  // --- News ---
  .get("/news", async () => {
    return await db.select().from(news).orderBy(desc(news.created_at));
  })
  .get("/news/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(news).where(eq(news.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .post("/news", async ({ body }) => {
    const payload = body as any;
    const insertData = {
      title: payload.title || payload.title_ru || payload.title_tm || "",
      title_tm: payload.title_tm ?? null,
      title_ru: payload.title_ru ?? null,
      title_en: payload.title_en ?? null,
      content: payload.content || payload.content_ru || payload.content_tm || "",
      content_tm: payload.content_tm ?? null,
      content_ru: payload.content_ru ?? null,
      content_en: payload.content_en ?? null,
      preview: payload.preview ?? null,
      image: payload.image ?? null,
      is_featured: payload.is_featured ?? false,
    };
    const [created] = await db.insert(news).values(insertData).returning();
    return created;
  }, {
    body: t.Object({
      title_tm: t.Optional(t.String()),
      title_ru: t.Optional(t.String()),
      title_en: t.Optional(t.String()),
      content_tm: t.Optional(t.String()),
      content_ru: t.Optional(t.String()),
      content_en: t.Optional(t.String()),
      preview: t.Optional(t.String()),
      image: t.Optional(t.String()),
      is_featured: t.Optional(t.Boolean()),
    })
  })
  .patch("/news/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, any> = {};
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.content_tm !== undefined) updateData.content_tm = payload.content_tm;
    if (payload.content_ru !== undefined) updateData.content_ru = payload.content_ru;
    if (payload.content_en !== undefined) updateData.content_en = payload.content_en;
    if (payload.preview !== undefined) updateData.preview = payload.preview;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.is_featured !== undefined) updateData.is_featured = payload.is_featured;
    updateData.updated_at = new Date();
    const [updated] = await db.update(news).set(updateData).where(eq(news.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, {
    body: t.Partial(t.Object({
      title_tm: t.String(),
      title_ru: t.String(),
      title_en: t.String(),
      content_tm: t.String(),
      content_ru: t.String(),
      content_en: t.String(),
      preview: t.String(),
      image: t.String(),
      is_featured: t.Boolean(),
    }))
  })
  .put("/news/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, any> = {};
    if (payload.title_tm !== undefined) updateData.title_tm = payload.title_tm;
    if (payload.title_ru !== undefined) updateData.title_ru = payload.title_ru;
    if (payload.title_en !== undefined) updateData.title_en = payload.title_en;
    if (payload.content_tm !== undefined) updateData.content_tm = payload.content_tm;
    if (payload.content_ru !== undefined) updateData.content_ru = payload.content_ru;
    if (payload.content_en !== undefined) updateData.content_en = payload.content_en;
    if (payload.preview !== undefined) updateData.preview = payload.preview;
    if (payload.image !== undefined) updateData.image = payload.image;
    if (payload.is_featured !== undefined) updateData.is_featured = payload.is_featured;
    updateData.updated_at = new Date();
    const [updated] = await db.update(news).set(updateData).where(eq(news.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, {
    body: t.Partial(t.Object({
      title_tm: t.String(),
      title_ru: t.String(),
      title_en: t.String(),
      content_tm: t.String(),
      content_ru: t.String(),
      content_en: t.String(),
      preview: t.String(),
      image: t.String(),
      is_featured: t.Boolean(),
    }))
  })
  .delete("/news/:id", async ({ params: { id } }) => {
    await db.delete(news).where(eq(news.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })

  // --- Contact Messages ---
  .get("/contact-messages", async ({ query }) => {
    const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.created_at));
    const status = query.status as string | undefined;
    if (status) {
      return rows.filter(r => r.status === status);
    }
    return rows;
  }, {
    query: t.Object({ status: t.Optional(t.String()) })
  })
  .get("/contact-messages/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    return item;
  })
  .patch("/contact-messages/:id", async ({ params: { id }, body }) => {
    const payload = body as any;
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.message !== undefined) updateData.message = payload.message;
    if (payload.status !== undefined) updateData.status = payload.status;
    const [updated] = await db.update(contactMessages).set(updateData).where(eq(contactMessages.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    if (updated.status === "approved") {
      const { broadcastToPublic } = await import("../ws/contact-broadcast");
      broadcastToPublic({
        type: "message_approved",
        message: {
          id: updated.id,
          name: updated.name,
          message: updated.message,
          likes: updated.likes || 0,
          created_at: updated.created_at,
        },
      });
    }
    return updated;
  })
  .post("/contact-messages/:id/toggle-approval", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    const newStatus = item.status === "approved" ? "pending" : "approved";
    const [updated] = await db.update(contactMessages).set({ status: newStatus }).where(eq(contactMessages.id, parseInt(id))).returning();
    if (updated && newStatus === "approved") {
      const { broadcastToPublic } = await import("../ws/contact-broadcast");
      broadcastToPublic({
        type: "message_approved",
        message: {
          id: updated.id,
          name: updated.name,
          message: updated.message,
          likes: updated.likes || 0,
          created_at: updated.created_at,
        },
      });
    }
    return updated;
  })
  .post("/contact-messages/:id/like", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    const newLikes = (item.likes || 0) + 1;
    const [updated] = await db.update(contactMessages).set({ likes: newLikes }).where(eq(contactMessages.id, parseInt(id))).returning();
    return updated;
  })
  .delete("/contact-messages/:id", async ({ params: { id } }) => {
    await db.delete(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    return { message: "Deleted successfully" };
  })

  // --- Teachers ---
  .post("/teachers", async ({ body }) => {
    return await db.insert(teachers).values(body as any).returning();
  })

  // --- Changelog ---
  .get("/changelog", async () => {
    return await db.select().from(changelog).orderBy(desc(changelog.date));
  })
  .post("/changelog", async ({ body }) => {
    const [created] = await db.insert(changelog).values({
      date: new Date(body.date),
      text: body.text
    }).returning();
    return created;
  }, {
    body: t.Object({
      date: t.String(),
      text: t.String()
    })
  })
  .patch("/changelog/:id", async ({ params: { id }, body }) => {
    const payload = body as { date?: string; text?: string };
    const updateData: Record<string, unknown> = {};
    if (payload.date !== undefined) updateData.date = new Date(payload.date);
    if (payload.text !== undefined) updateData.text = payload.text;
    const [updated] = await db.update(changelog).set(updateData).where(eq(changelog.id, parseInt(id))).returning();
    if (!updated) return { error: "Not found" };
    return updated;
  }, {
    body: t.Partial(t.Object({
      date: t.String(),
      text: t.String()
    }))
  })
  .delete("/changelog/:id", async ({ params: { id } }) => {
    await db.delete(changelog).where(eq(changelog.id, parseInt(id)));
    return { message: "Deleted successfully" };
  });
