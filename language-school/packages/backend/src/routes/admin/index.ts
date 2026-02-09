/**
 * Admin API — полная панель для администратора (Quasar).
 * landing — публичное лицо | admin — всё для админа | cabinet — личные кабинеты пользователей
 */
import { Elysia } from "elysia";
import { lucia } from "../../auth";
import { ADMIN_ROLES } from "../../constants/roles";
import { adminProfileRoutes } from "./profile";
import { adminCategoriesRoutes } from "./landing/categories";
import { adminSubcategoriesRoutes } from "./landing/subcategories";
import { adminCoursesRoutes } from "./landing/courses";
import { adminNewsRoutes } from "./landing/news";
import { adminContactRoutes } from "./landing/contact";
import { adminTeachersRoutes } from "./teachers";
import { adminChangelogRoutes } from "./changelog";
import { adminUsersRoutes } from "./users/index";
import { adminSchoolsRoutes } from "./schools";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .derive(async ({ request, set }) => {
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
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      set.status = 403;
      return { error: "Forbidden: требуется роль администратора. Выйдите и войдите снова." };
    }
  })
  .use(adminProfileRoutes)
  .use(adminCategoriesRoutes)
  .use(adminSubcategoriesRoutes)
  .use(adminCoursesRoutes)
  .use(adminNewsRoutes)
  .use(adminContactRoutes)
  .use(adminTeachersRoutes)
  .use(adminChangelogRoutes)
  .use(adminUsersRoutes)
  .use(adminSchoolsRoutes);
