import { Elysia } from "elysia";
import { db } from "../../db/index";
import {
  users,
  htGroups,
  htGroupStudents,
  htCourses,
  chatRooms,
  chatMessages,
} from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

// In-memory WebSocket connection map: roomId → Set of WS connections
const rooms = new Map<number, Set<any>>();

function roleIs(userRole: string | undefined | null, target: string): boolean {
  return (userRole ?? "").toUpperCase() === target.toUpperCase();
}

async function getOrCreateRoom(groupId: number, studentId: string) {
  let [room] = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.groupId, groupId), eq(chatRooms.studentId, studentId)))
    .limit(1);
  if (!room) {
    [room] = await db
      .insert(chatRooms)
      .values({ groupId, studentId })
      .returning();
  }
  return room;
}

export const chatRoutes = new Elysia({ prefix: "/chat" })

  // ─── GET /cabinet/chat/groups ────────────────────────────────────────────────
  // Student: groups with teacher info (for group selector on chat page)
  // Teacher: their groups (for chat page group selector)
  .get("/groups", async (context: any) => {
    const { user } = context;
    const now = new Date();

    if (roleIs(user.role, "STUDENT")) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          courseName: htCourses.name,
          teacherFirst: users.first_name,
          teacherLast: users.last_name,
        })
        .from(htGroupStudents)
        .innerJoin(htGroups, eq(htGroupStudents.groupId, htGroups.id))
        .innerJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .leftJoin(users, eq(htGroups.teacherId, users.id))
        .where(eq(htGroupStudents.userId, user.id))
        .orderBy(desc(htGroups.createdAt));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        courseName: r.courseName,
        teacherName:
          [r.teacherFirst, r.teacherLast].filter(Boolean).join(" ") ||
          "Учитель не назначен",
        hasTeacher: !!(r.teacherFirst || r.teacherLast),
        isActive: r.isActive && (!r.endDate || r.endDate > now),
      }));
    }

    if (roleIs(user.role, "TEACHER")) {
      const rows = await db
        .select({
          id: htGroups.id,
          name: htGroups.name,
          endDate: htGroups.endDate,
          isActive: htGroups.isActive,
          courseName: htCourses.name,
        })
        .from(htGroups)
        .innerJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .where(eq(htGroups.teacherId, user.id))
        .orderBy(desc(htGroups.createdAt));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        courseName: r.courseName,
        isActive: r.isActive && (!r.endDate || r.endDate > now),
      }));
    }

    return [];
  })

  // ─── GET /cabinet/chat/rooms/:groupId ────────────────────────────────────────
  // STUDENT only: get or create room for (groupId, studentId=self)
  .get("/rooms/:groupId", async (context: any) => {
    const { user, params, set } = context;
    const gid = parseInt(params.groupId);

    if (!roleIs(user.role, "STUDENT")) {
      set.status = 403;
      return { error: "Students only" };
    }

    // Verify student is in group
    const [m] = await db
      .select({ id: htGroupStudents.id })
      .from(htGroupStudents)
      .where(
        and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, user.id))
      )
      .limit(1);
    if (!m) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const room = await getOrCreateRoom(gid, user.id);
    return { id: room.id, groupId: room.groupId };
  })

  // ─── GET /cabinet/chat/rooms/:groupId/student/:studentId ────────────────────
  // TEACHER only: get or create room for specific student in group
  .get("/rooms/:groupId/student/:studentId", async (context: any) => {
    const { user, params, set } = context;
    const gid = parseInt(params.groupId);
    const sid = params.studentId;

    if (!roleIs(user.role, "TEACHER")) {
      set.status = 403;
      return { error: "Teachers only" };
    }

    // Verify teacher owns this group
    const [g] = await db
      .select({ id: htGroups.id })
      .from(htGroups)
      .where(and(eq(htGroups.id, gid), eq(htGroups.teacherId, user.id)))
      .limit(1);
    if (!g) {
      set.status = 403;
      return { error: "Forbidden: not your group" };
    }

    // Verify student is in group
    const [ms] = await db
      .select({ id: htGroupStudents.id })
      .from(htGroupStudents)
      .where(and(eq(htGroupStudents.groupId, gid), eq(htGroupStudents.userId, sid)))
      .limit(1);
    if (!ms) {
      set.status = 403;
      return { error: "Student not in group" };
    }

    const room = await getOrCreateRoom(gid, sid);
    return { id: room.id, groupId: room.groupId, studentId: room.studentId };
  })

  // ─── GET /cabinet/chat/messages/:roomId ──────────────────────────────────────
  // Get message history for a room (with access control)
  .get("/messages/:roomId", async (context: any) => {
    const { user, params, set } = context;
    const rid = parseInt(params.roomId);

    // Fetch room to check access
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, rid))
      .limit(1);
    if (!room) {
      set.status = 404;
      return { error: "Room not found" };
    }

    // Access check
    if (roleIs(user.role, "STUDENT")) {
      if (room.studentId !== user.id) {
        set.status = 403;
        return { error: "Forbidden" };
      }
    } else if (roleIs(user.role, "TEACHER")) {
      const [g] = await db
        .select({ id: htGroups.id })
        .from(htGroups)
        .where(and(eq(htGroups.id, room.groupId), eq(htGroups.teacherId, user.id)))
        .limit(1);
      if (!g) {
        set.status = 403;
        return { error: "Forbidden" };
      }
    } else {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const msgs = await db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        userId: chatMessages.userId,
        content: chatMessages.content,
        isEdited: chatMessages.isEdited,
        createdAt: chatMessages.createdAt,
        firstName: users.first_name,
        lastName: users.last_name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(
        and(eq(chatMessages.roomId, rid), eq(chatMessages.isDeleted, false))
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);

    return msgs.reverse().map((m) => ({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      content: m.content,
      isEdited: m.isEdited,
      createdAt: m.createdAt?.toISOString(),
      user: {
        id: m.userId,
        name:
          [m.firstName, m.lastName].filter(Boolean).join(" ") ||
          m.username ||
          "Unknown",
        avatar: m.avatar,
        role: m.role,
      },
    }));
  })

  // ─── WS /cabinet/chat/ws/:roomId ─────────────────────────────────────────────
  .ws("/ws/:roomId", {
    open(ws) {
      const roomId = parseInt(ws.data.params.roomId);
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId)!.add(ws);
      console.log(
        `[Chat WS] open room=${roomId} user=${(ws.data as any).user?.username}`
      );
    },

    async message(ws, message: any) {
      const user = (ws.data as any).user;
      if (!user) {
        ws.close();
        return;
      }

      const roomId = parseInt(ws.data.params.roomId);

      if (message?.type === "message" && message.content?.trim()) {
        const [saved] = await db
          .insert(chatMessages)
          .values({
            roomId,
            userId: user.id,
            content: message.content.trim(),
          })
          .returning();

        const payload = JSON.stringify({
          type: "message",
          message: {
            id: saved.id,
            roomId,
            userId: user.id,
            content: saved.content,
            createdAt: saved.createdAt?.toISOString(),
            user: {
              id: user.id,
              name:
                [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                user.username,
              avatar: user.avatar,
              role: user.role,
            },
          },
        });

        rooms.get(roomId)?.forEach((conn) => {
          try {
            conn.send(payload);
          } catch {}
        });
      }

      if (message?.type === "typing") {
        const payload = JSON.stringify({
          type: "typing",
          userId: user.id,
          name:
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.username,
        });
        rooms.get(roomId)?.forEach((conn) => {
          if (conn !== ws) {
            try {
              conn.send(payload);
            } catch {}
          }
        });
      }

      if (message?.type === "stop_typing") {
        const payload = JSON.stringify({
          type: "stop_typing",
          userId: user.id,
        });
        rooms.get(roomId)?.forEach((conn) => {
          if (conn !== ws) {
            try {
              conn.send(payload);
            } catch {}
          }
        });
      }
    },

    close(ws) {
      const roomId = parseInt(ws.data.params.roomId);
      rooms.get(roomId)?.delete(ws);
      if ((rooms.get(roomId)?.size ?? 0) === 0) rooms.delete(roomId);
      console.log(`[Chat WS] close room=${roomId}`);
    },
  });
