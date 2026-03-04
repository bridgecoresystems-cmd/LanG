import { Elysia } from "elysia";
import { db } from "../db/index";
import { sessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { gemsConnections } from "../ws/gems-broadcast";

// Track which userId each WS connection belongs to (for cleanup)
const wsUserMap = new Map<any, string>();

export const wsGemsRoutes = new Elysia()
  .derive(async ({ request }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const token = cookieHeader.match(/better-auth\.session_token=([^;]+)/)?.[1];
    if (!token) return { wsGemsUser: null as null | { id: string } };

    const [session] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (!session) return { wsGemsUser: null as null | { id: string } };
    return { wsGemsUser: { id: session.userId } };
  })
  .ws("/ws/gems", {
    beforeHandle({ wsGemsUser, set }: any) {
      if (!wsGemsUser) {
        set.status = 401;
        return "Unauthorized";
      }
    },
    open(ws: any) {
      const userId = ws.data?.wsGemsUser?.id;
      if (!userId) { ws.close(); return; }

      if (!gemsConnections.has(userId)) gemsConnections.set(userId, new Set());
      gemsConnections.get(userId)!.add(ws);
      wsUserMap.set(ws, userId);
    },
    close(ws: any) {
      const userId = wsUserMap.get(ws);
      if (userId) {
        const sockets = gemsConnections.get(userId);
        sockets?.delete(ws);
        if (sockets?.size === 0) gemsConnections.delete(userId);
      }
      wsUserMap.delete(ws);
    },
  });
