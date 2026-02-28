/**
 * Миграция старых данных по оплатам в таблицу ht_group_student.
 * Запуск: bun run scripts/migrate-payments.ts
 */
import { db } from "../src/db";
import { payments, htGroupStudents, htGroups, htCourses, users } from "../src/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function main() {
  console.log("Starting payment migration...");

  // 1. Получаем все платежи, у которых есть studentId и groupId
  const allPayments = await db
    .select({
      studentId: payments.studentId,
      groupId: payments.groupId,
      discount: payments.discount,
    })
    .from(payments)
    .where(sql`${payments.studentId} IS NOT NULL AND ${payments.groupId} IS NOT NULL`);

  console.log(`Found ${allPayments.length} payments to process.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const payment of allPayments) {
    if (!payment.studentId || !payment.groupId) continue;

    const discountValue = parseFloat(payment.discount || "0");

    // Проверяем, есть ли запись в ht_group_student
    const [enrollment] = await db
      .select()
      .from(htGroupStudents)
      .where(
        and(
          eq(htGroupStudents.userId, payment.studentId),
          eq(htGroupStudents.groupId, payment.groupId)
        )
      )
      .limit(1);

    if (enrollment) {
      // Если запись есть, обновляем скидку (накапливаем её, если это логика системы)
      // В данном случае, если в платеже указана скидка, мы добавляем её к записи студента в группе
      if (discountValue > 0) {
        await db
          .update(htGroupStudents)
          .set({
            discount: sql`${htGroupStudents.discount} + ${discountValue.toString()}`,
          })
          .where(
            and(
              eq(htGroupStudents.userId, payment.studentId),
              eq(htGroupStudents.groupId, payment.groupId)
            )
          );
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      // Если записи в ht_group_student нет, но есть платеж — это странно, но мы можем создать запись
      // Для этого нам нужно знать tariffId. Попробуем взять его из курса группы.
      const [group] = await db
        .select({ tariffId: htCourses.tariffId })
        .from(htGroups)
        .leftJoin(htCourses, eq(htGroups.courseId, htCourses.id))
        .where(eq(htGroups.id, payment.groupId))
        .limit(1);

      await db.insert(htGroupStudents).values({
        userId: payment.studentId,
        groupId: payment.groupId,
        tariffId: group?.tariffId || null,
        discount: discountValue.toString(),
      });
      updatedCount++;
      console.log(`Created missing enrollment for student ${payment.studentId} in group ${payment.groupId}`);
    }
  }

  console.log(`Migration finished. Updated/Created: ${updatedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
