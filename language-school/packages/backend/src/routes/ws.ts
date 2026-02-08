import { Elysia, t } from "elysia";
import { lucia } from "../auth";
import { adminClients, publicClients } from "../ws/contact-broadcast";

export const wsRoutes = new Elysia()
  .ws("/ws", {
    query: t.Object({
      channel: t.Union([t.Literal("admin"), t.Literal("public")]),
    }),
    async beforeHandle({ query, request, set }) {
      if (query.channel === "admin") {
        const cookieHeader = request.headers.get("Cookie") ?? "";
        const sessionId = lucia.readSessionCookie(cookieHeader);
        if (!sessionId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const { session, user } = await lucia.validateSession(sessionId);
        if (!session || !user || user.role !== "admin") {
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
