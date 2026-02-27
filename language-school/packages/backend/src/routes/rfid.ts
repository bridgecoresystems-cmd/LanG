import { Elysia, t } from "elysia";
import { db } from "../db/index";
import { users, htAttendance, htLessons, rfidLogs, htGroupStudents } from "../db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const rfidRoutes = new Elysia({ prefix: "/rfid" })
  .post("/scan", async ({ body, set }) => {
    const { rfid_uid, device_id, action, amount } = body;

    // 1. Ищем пользователя по RFID UID
    const [user] = await db
      .select({ id: users.id, parentId: users.parent_id, firstName: users.first_name })
      .from(users)
      .where(eq(users.rfid_uid, rfid_uid))
      .limit(1);

    if (!user) {
      set.status = 404;
      return { error: "RFID UID not found" };
    }

    // 2. Логируем сканирование
    await db.insert(rfidLogs).values({
      rfidUid: rfid_uid,
      userId: user.id,
      deviceId: device_id,
      action: action,
      amount: amount ? String(amount) : null,
    });

    // 3. Обработка входа/выхода (Attendance)
    if (action === "entry" || action === "exit") {
      const now = new Date();
      
      // Ищем текущий урок для этого пользователя (урок, который идет сейчас +/- 30 мин)
      const buffer = 30 * 60 * 1000; // 30 минут
      const startTime = new Date(now.getTime() - buffer);
      const endTime = new Date(now.getTime() + buffer);

      // Находим группы пользователя
      const userGroups = await db
        .select({ groupId: htGroupStudents.groupId })
        .from(htGroupStudents)
        .where(eq(htGroupStudents.userId, user.id));
      
      const groupIds = userGroups.map(g => g.groupId);
      if (groupIds.length === 0) return { message: "User has no groups", user: user.firstName };

      // Находим урок в этих группах на текущее время
      const [currentLesson] = await db
        .select({ id: htLessons.id, title: htLessons.title })
        .from(htLessons)
        .where(and(
          gte(htLessons.lessonDate, startTime),
          lte(htLessons.lessonDate, endTime)
        ))
        .limit(1);

      if (currentLesson) {
        // Обновляем или создаем запись посещаемости
        const [existing] = await db
          .select()
          .from(htAttendance)
          .where(and(eq(htAttendance.lessonId, currentLesson.id), eq(htAttendance.userId, user.id)))
          .limit(1);

        if (existing) {
          await db.update(htAttendance)
            .set({
              [action === "entry" ? "entryTime" : "exitTime"]: now,
              status: "present", // Если пришел, значит присутствует
              updatedAt: now
            })
            .where(eq(htAttendance.id, existing.id));
        } else {
          await db.insert(htAttendance).values({
            lessonId: currentLesson.id,
            userId: user.id,
            status: "present",
            [action === "entry" ? "entryTime" : "exitTime"]: now,
          });
        }

        // TODO: Отправить уведомление родителю (user.parentId)
        console.log(`Notification to parent of ${user.firstName}: Child ${action === "entry" ? "arrived at" : "left"} school at ${now.toLocaleTimeString()}`);
      }
    }

    // 4. Обработка оплаты (Canteen)
    if (action === "payment" && amount) {
      // Здесь будет логика списания гемов/баланса
      console.log(`Payment of ${amount} gems for user ${user.firstName}`);
    }

    return { 
      success: true, 
      user: user.firstName,
      action: action,
      time: new Date().toISOString()
    };
  }, {
    body: t.Object({
      rfid_uid: t.String(),
      device_id: t.String(),
      action: t.Union([t.Literal("entry"), t.Literal("exit"), t.Literal("payment")]),
      amount: t.Optional(t.Number()), // Только для оплаты
    })
  });