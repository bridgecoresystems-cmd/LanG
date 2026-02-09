/**
 * Обновляет роль admin → SUPERUSER. Запуск: bun run scripts/update-admin-role.ts
 */
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const result = await db
    .update(users)
    .set({ role: "SUPERUSER" })
    .where(eq(users.role, "admin"))
    .returning({ id: users.id, username: users.username, role: users.role });

  if (result.length === 0) {
    console.log("Нет пользователей с ролью 'admin' для обновления.");
  } else {
    console.log(`Обновлено ${result.length} пользователь(ей):`, result);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
