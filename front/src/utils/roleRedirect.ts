/**
 * Centralized role-based redirect logic after login.
 * Similar to Django's PostLoginRedirectView pattern.
 * 
 * Порядок проверки ролей (по приоритету):
 * 1. Суперпользователь (is_superuser) → /management
 * 2. Head Teacher (role === 'head_teacher') → /cabinet/head-teacher/teachers
 * 3. Director (role === 'director') → /cabinet/director
 * 4. Teacher (role === 'teacher') → /cabinet/teacher
 * 5. Student (role === 'student') → /cabinet
 * 6. Admin (role === 'admin' && is_staff) → /management (only if is_superuser)
 * 7. Fallback → / (home page)
 */

import type { User } from '@/types/user'

/**
 * Get the appropriate redirect path based on user role and permissions.
 * This function implements strict role-based access control.
 * 
 * @param user - The authenticated user object
 * @returns The redirect path for the user
 */
export function getRoleBasedRedirect(user: User | null): string {
  if (!user) {
    console.warn('getRoleBasedRedirect: User is null, redirecting to home')
    return '/'
  }

  console.log(`getRoleBasedRedirect: Checking user ${user.username} (role: ${user.role}, is_superuser: ${user.is_superuser}, is_staff: ${user.is_staff})`)

  // 1. Суперпользователь → /management
  // ТОЛЬКО is_superuser имеет доступ к /management/*
  if (user.is_superuser) {
    console.log(`getRoleBasedRedirect: ${user.username} is superuser → /management`)
    return '/management'
  }

  // 2. Head Teacher → /cabinet/head-teacher/teachers
  if (user.role === 'head_teacher') {
    console.log(`getRoleBasedRedirect: ${user.username} is head_teacher → /cabinet/head-teacher/teachers`)
    return '/cabinet/head-teacher/teachers'
  }

  // 3. Director → /cabinet/director
  if (user.role === 'director') {
    console.log(`getRoleBasedRedirect: ${user.username} is director → /cabinet/director`)
    return '/cabinet/director'
  }

  // 4. Teacher → /cabinet/teacher
  if (user.role === 'teacher') {
    console.log(`getRoleBasedRedirect: ${user.username} is teacher → /cabinet/teacher`)
    return '/cabinet/teacher'
  }

  // 5. Student → /cabinet/student
  if (user.role === 'student') {
    console.log(`getRoleBasedRedirect: ${user.username} is student → /cabinet/student`)
    return '/cabinet/student'
  }

  // 6. Merchant/Vendor → /cabinet/vendor
  if (user.role === 'merchant') {
    console.log(`getRoleBasedRedirect: ${user.username} is merchant → /cabinet/vendor`)
    return '/cabinet/vendor'
  }

  // 7. Admin role (but not superuser) → should not have access to /management
  // If someone has role='admin' but is not superuser, redirect to home
  if (user.role === 'admin') {
    if (user.is_staff && !user.is_superuser) {
      // Regular admin (not superuser) - should not access /management
      console.warn(`getRoleBasedRedirect: ${user.username} has role='admin' but is not superuser. Redirecting to home.`)
      return '/'
    }
    // This shouldn't happen, but fallback
    console.warn(`getRoleBasedRedirect: ${user.username} has role='admin' but unexpected state. Redirecting to home.`)
    return '/'
  }

  // 7. Fallback → home page
  console.warn(`getRoleBasedRedirect: ${user.username} has unknown role '${user.role}'. Redirecting to home.`)
  return '/'
}

/**
 * Check if user has access to a specific route based on their role.
 * 
 * @param user - The authenticated user object
 * @param routePath - The route path to check
 * @returns true if user has access, false otherwise
 */
export function hasRouteAccess(user: User | null, routePath: string): boolean {
  if (!user) {
    return false
  }

  // Management routes (starting with /management) - ONLY for superusers
  if (routePath.startsWith('/management')) {
    return user.is_superuser === true
  }

  // Head teacher routes
  if (routePath.startsWith('/cabinet/head-teacher')) {
    return user.role === 'head_teacher'
  }

  // Director routes
  if (routePath.startsWith('/cabinet/director')) {
    return user.role === 'director'
  }

  // Teacher routes
  if (routePath.startsWith('/cabinet/teacher')) {
    return user.role === 'teacher'
  }

  // Merchant/Vendor routes
  if (routePath.startsWith('/cabinet/vendor')) {
    return user.role === 'merchant'
  }

  // Student routes
  if (routePath.startsWith('/cabinet/student')) {
    return user.role === 'student'
  }

  // Common cabinet routes (profile, messages)
  if (routePath === '/cabinet/profile' || routePath.startsWith('/cabinet/messages')) {
    return true
  }

  // Public routes are accessible to everyone
  return true
}

