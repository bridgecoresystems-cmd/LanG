import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { ROLES } from "../constants/roles";
import { adminClients, publicClients } from "../ws/contact-broadcast";

export const wsRoutes = new Elysia()
  .ws("/ws", {
    query: t.Object({
      channel: t.Union([t.Literal("admin"), t.Literal("public")]),
    }),
    async beforeHandle({ query, request, set }) {
      if (query.channel === "admin") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const user = session.user as typeof session.user & { role: string };
        if (user.role !== ROLES.SUPERUSER) {
          set.status = 403;
          return { error: "Forbidden" };
        }
      }
    },
    open(ws) {
      const channel = ws.data?.query?.channel;
      if (channel === "admin") {
        adminClients.add(ws);
      } else if (channel === "public") {
        publicClients.add(ws);
      }
    },
    close(ws) {
      adminClients.delete(ws);
      publicClients.delete(ws);
    },
  });
