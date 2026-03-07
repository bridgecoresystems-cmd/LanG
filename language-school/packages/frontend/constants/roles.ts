/**
 * User roles (RBAC). Synced with backend. Use these constants, never magic strings.
 */
export const ROLES = {
  SUPERUSER: "SUPERUSER",
  GEN_DIRECTOR: "GEN_DIRECTOR",
  HEAD_ACCOUNTANT: "HEAD_ACCOUNTANT",
  DIRECTOR: "DIRECTOR",
  HEAD_TEACHER: "HEAD_TEACHER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  MERCHANT: "MERCHANT",
  SALES: "SALES",
  RECEPTIONIST: "RECEPTIONIST",
  EDITOR: "EDITOR",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Роли с доступом к админ-панели */
export const ADMIN_ROLES: Role[] = [
  ROLES.SUPERUSER,
  ROLES.GEN_DIRECTOR,
  ROLES.HEAD_ACCOUNTANT,
  ROLES.ACCOUNTANT,
  ROLES.EDITOR,
  ROLES.HEAD_TEACHER,
  ROLES.SALES,
  ROLES.RECEPTIONIST,
  ROLES.DIRECTOR,
];

export function isAdminRole(role: string | null | undefined): boolean {
  return role != null && ADMIN_ROLES.includes(role as Role);
}
