/**
 * User services — генерация username, password (как в Django).
 */
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { ROLES } from "../constants/roles";

function toSeptenary(n: number): string {
  if (n === 0) return "0";
  const digits: string[] = [];
  let x = n;
  while (x > 0) {
    digits.push(String(x % 7));
    x = Math.floor(x / 7);
  }
  return digits.reverse().join("");
}

function cleanTurkmenName(text: string): string {
  const replacements: Record<string, string> = {
    ž: "z", Ž: "z", ä: "a", Ä: "a", ň: "n", Ň: "n",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u", ý: "y", Ý: "y",
    ж: "z", Ж: "z", ш: "s", Ш: "s", ч: "c", Ч: "c",
  };
  let result = text.toLowerCase();
  for (const [char, replacement] of Object.entries(replacements)) {
    result = result.replaceAll(char, replacement);
  }
  return result.replace(/[^a-z0-9]/g, "");
}

/**
 * Генерирует уникальный username в формате merjen00025 (имя + 5 цифр в 7-ричной системе).
 */
export async function generateUniqueUsername(firstName: string): Promise<string> {
  const baseName = cleanTurkmenName(firstName) || "user";
  const allStudents = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.role, ROLES.STUDENT));

  let maxDecimal = 0;
  for (const row of allStudents) {
    const uname = row.username || "";
    if (uname.length >= 5) {
      const suffix = uname.slice(-5);
      if (/^[0-6]+$/.test(suffix)) {
        const decimal = parseInt(suffix, 7);
        if (!isNaN(decimal) && decimal > maxDecimal) maxDecimal = decimal;
      }
    }
  }

  const nextSeptenary = toSeptenary(maxDecimal + 1).padStart(5, "0");
  return `${baseName}${nextSeptenary}`;
}

/**
 * Генерирует случайный пароль (буквы + цифры).
 */
export function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
