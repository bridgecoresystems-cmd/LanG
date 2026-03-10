import { Elysia, t } from "elysia";
import { db } from "../db";
import { contactMessages, courseCategories, courseSubCategories, courses, news, newsSubscribers } from "../db/schema";
import { desc, eq } from "drizzle-orm";

const tr = (obj: any, key: string, l: string) => obj[`${key}_${l}`] || obj[key];

export const landingRoutes = new Elysia({ prefix: "/landing" })
  .get("/course-categories", async ({ query }) => {
    const lang = query.lang || "ru";
    const categories = await db.select().from(courseCategories).where(eq(courseCategories.is_active, true)).orderBy(courseCategories.order);
    return categories.map(c => ({
      id: c.id,
      name: (c as any)[`name_${lang}`] || c.name,
      description: (c as any)[`description_${lang}`] || c.description,
      image: c.image,
      icon: c.icon,
      order: c.order,
      is_active: c.is_active,
    }));
  }, {
    query: t.Object({ lang: t.Optional(t.String()) })
  })
  .get("/course-categories/:id", async ({ params, query }) => {
    const lang = query.lang || "ru";
    const [c] = await db.select().from(courseCategories).where(eq(courseCategories.id, parseInt(params.id))).limit(1);
    if (!c) return { error: "Not found" };
    return {
      id: c.id,
      name: (c as any)[`name_${lang}`] || c.name,
      description: (c as any)[`description_${lang}`] || c.description,
      image: c.image,
      icon: c.icon,
      order: c.order,
      is_active: c.is_active,
    };
  }, {
    params: t.Object({ id: t.String() }),
    query: t.Object({ lang: t.Optional(t.String()) })
  })
  .get("/course-subcategories", async ({ query }) => {
    const lang = query.lang || "ru";
    const categoryId = query.category ? parseInt(query.category) : undefined;
    if (categoryId) {
      const subs = await db.select().from(courseSubCategories).where(eq(courseSubCategories.categoryId, categoryId));
      const [cat] = await db.select().from(courseCategories).where(eq(courseCategories.id, categoryId)).limit(1);
      const categoryName = cat ? tr(cat, "name", lang) : "";
      return subs.map(s => ({
        id: s.id,
        category_id: s.categoryId,
        category_name: categoryName,
        name: tr(s, "name", lang),
        description: tr(s, "description", lang),
        image: s.image,
        order: s.order,
        is_active: s.is_active,
      }));
    }
    const subs = await db.select().from(courseSubCategories).orderBy(courseSubCategories.order);
    const cats = await db.select().from(courseCategories);
    const catMap = Object.fromEntries(cats.map(c => [c.id, tr(c, "name", lang)]));
    return subs.map(s => ({
      id: s.id,
      category_id: s.categoryId,
      category_name: catMap[s.categoryId] || "",
      name: tr(s, "name", lang),
      description: tr(s, "description", lang),
      image: s.image,
      order: s.order,
      is_active: s.is_active,
    }));
  }, {
    query: t.Object({ lang: t.Optional(t.String()), category: t.Optional(t.String()) })
  })
  .get("/course-subcategories/:id", async ({ params, query }) => {
    const lang = query.lang || "ru";
    const [s] = await db.select().from(courseSubCategories).where(eq(courseSubCategories.id, parseInt(params.id))).limit(1);
    if (!s) return { error: "Not found" };
    const [cat] = await db.select().from(courseCategories).where(eq(courseCategories.id, s.categoryId)).limit(1);
    return {
      id: s.id,
      category_id: s.categoryId,
      category_name: cat ? tr(cat, "name", lang) : "",
      name: tr(s, "name", lang),
      description: tr(s, "description", lang),
      image: s.image,
      order: s.order,
      is_active: s.is_active,
    };
  }, {
    params: t.Object({ id: t.String() }),
    query: t.Object({ lang: t.Optional(t.String()) })
  })
  .get("/courses", async ({ query }) => {
    const lang = query.lang || "ru";
    const subcategoryId = query.subcategory ? parseInt(query.subcategory) : undefined;
    const allCourses = subcategoryId
      ? await db.select().from(courses).where(eq(courses.subcategoryId, subcategoryId))
      : await db.select().from(courses).where(eq(courses.is_active, true));
    const [cats, subs] = await Promise.all([
      db.select().from(courseCategories),
      db.select().from(courseSubCategories),
    ]);
    const catMap = Object.fromEntries(cats.map(c => [c.id, tr(c, "name", lang)]));
    const subMap = Object.fromEntries(subs.map(s => [s.id, tr(s, "name", lang)]));
    return allCourses.map(c => ({
      id: c.id,
      category_id: c.categoryId,
      category_name: catMap[c.categoryId] || "",
      subcategory_id: c.subcategoryId,
      subcategory_name: subMap[c.subcategoryId] || "",
      title: (c as any)[`title_${lang}`] || c.title,
      description: (c as any)[`description_${lang}`] || c.description,
      image: c.image,
      duration_weeks: c.duration_weeks,
      hours_per_week: c.hours_per_week,
      price: Number(c.price),
      discount_price: c.discount_price ? Number(c.discount_price) : null,
      is_active: c.is_active,
    }));
  }, {
    query: t.Object({ lang: t.Optional(t.String()), subcategory: t.Optional(t.String()) })
  })
  .get("/courses/:id", async ({ params, query }) => {
    const lang = query.lang || "ru";
    const [c] = await db.select().from(courses).where(eq(courses.id, parseInt(params.id))).limit(1);
    if (!c) return { error: "Not found" };
    const [[cat], [sub]] = await Promise.all([
      db.select().from(courseCategories).where(eq(courseCategories.id, c.categoryId)).limit(1),
      db.select().from(courseSubCategories).where(eq(courseSubCategories.id, c.subcategoryId)).limit(1),
    ]);
    return {
      id: c.id,
      category_id: c.categoryId,
      category_name: cat ? tr(cat, "name", lang) : "",
      subcategory_id: c.subcategoryId,
      subcategory_name: sub ? tr(sub, "name", lang) : "",
      title: (c as any)[`title_${lang}`] || c.title,
      description: (c as any)[`description_${lang}`] || c.description,
      image: c.image,
      duration_weeks: c.duration_weeks,
      hours_per_week: c.hours_per_week,
      price: Number(c.price),
      discount_price: c.discount_price ? Number(c.discount_price) : null,
      is_active: c.is_active,
    };
  }, {
    params: t.Object({ id: t.String() }),
    query: t.Object({ lang: t.Optional(t.String()) })
  })
  // --- Contact Messages (public) ---
  .get("/contact-messages", async ({ query }) => {
    const rows = await db.select().from(contactMessages)
      .where(eq(contactMessages.status, "approved"))
      .orderBy(desc(contactMessages.created_at));
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query.page_size ? parseInt(query.page_size) : 10;
    const start = (page - 1) * pageSize;
    const paginated = rows.slice(start, start + pageSize);
    return {
      results: paginated.map(r => ({
        id: r.id,
        name: r.name,
        message: r.message,
        likes: r.likes || 0,
        created_at: r.created_at,
      })),
      count: rows.length,
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      page_size: t.Optional(t.String()),
    })
  })
  .post("/contact-messages", async ({ body }) => {
    const payload = body as any;
    const [created] = await db.insert(contactMessages).values({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      message: payload.message,
      status: "pending",
      likes: 0,
    }).returning();
    if (created) {
      const { broadcastToAdmin } = await import("../ws/contact-broadcast");
      broadcastToAdmin({ type: "new_message", message: created });
    }
    return created;
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      phone: t.Optional(t.String()),
      message: t.String(),
    })
  })
  .post("/contact-messages/:id/like", async ({ params: { id } }) => {
    const [item] = await db.select().from(contactMessages).where(eq(contactMessages.id, parseInt(id)));
    if (!item) return { error: "Not found" };
    const newLikes = (item.likes || 0) + 1;
    const [updated] = await db.update(contactMessages).set({ likes: newLikes }).where(eq(contactMessages.id, parseInt(id))).returning();
    return updated;
  })

  .get("/news", async ({ query }) => {
    const lang = query.lang || "ru";
    const allNews = await db.select().from(news).orderBy(desc(news.created_at));
    return allNews.map(n => {
      const content = (n as any)[`content_${lang}`] || n.content || "";
      return {
      id: n.id,
      title: (n as any)[`title_${lang}`] || n.title,
      content,
      preview: String(content).slice(0, 200),
      image: n.image,
      views: n.views,
      is_featured: n.is_featured,
      created_at: n.created_at,
      updated_at: n.updated_at,
    };
    });
  }, {
    query: t.Object({
      lang: t.Optional(t.String())
    })
  })
  .post("/news-views/:id", async ({ params: { id } }) => {
    const [item] = await db.select().from(news).where(eq(news.id, parseInt(id))).limit(1);
    if (!item) return { error: "Not found" };
    const newViews = (item.views || 0) + 1;
    const [updated] = await db.update(news).set({ views: newViews }).where(eq(news.id, parseInt(id))).returning();
    return updated;
  })
  .post("/news/subscribe", async ({ body }) => {
    const { email } = body as { email: string };
    try {
      const [existing] = await db.select().from(newsSubscribers).where(eq(newsSubscribers.email, email)).limit(1);
      if (existing) {
        if (!existing.isActive) {
          await db.update(newsSubscribers).set({ isActive: true }).where(eq(newsSubscribers.email, email));
        }
        return { success: true, message: "Already subscribed" };
      }
      await db.insert(newsSubscribers).values({ email });
      return { success: true };
    } catch (e) {
      return { error: "Failed to subscribe" };
    }
  }, {
    body: t.Object({ email: t.String({ format: 'email' }) })
  });
