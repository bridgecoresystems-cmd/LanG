/**
 * Admin API — полная панель для администратора (Quasar).
 * landing — публичное лицо | admin — всё для админа | cabinet — личные кабинеты пользователей
 */
import { Elysia } from "elysia";
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
import { adminSalesRoutes } from "./sales";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .onBeforeHandle((context: any) => {
    const { user, set, request } = context;
    console.log(`[Admin Access Check] Path: ${request.url}, User: ${user?.username}, Role: ${user?.role}`);

    if (!user) {
      console.log(`[Admin Access Check] Denied: User null in context for ${request.url}`);
      set.status = 403;
      return { error: "Forbidden: требуется авторизация." };
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      console.log(`[Admin Access Check] Denied: Role ${user.role} insufficient`);
      set.status = 403;
      return { error: `Forbidden: роль ${user.role} не имеет доступа.` };
    }

    console.log(`[Admin Access Check] Granted for ${user.username}`);
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
  .use(adminSchoolsRoutes)
  .use(adminSalesRoutes);
