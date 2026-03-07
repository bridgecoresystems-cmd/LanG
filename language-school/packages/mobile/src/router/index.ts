import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/auth/login',
  },
  {
    path: '/auth/login',
    component: () => import('@/pages/auth/LoginPage.vue'),
  },

  // Student tabs
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    meta: { requiresAuth: true, role: 'student' },
    children: [
      { path: '', redirect: '/student/dashboard' },
      { path: 'dashboard', component: () => import('@/pages/student/DashboardPage.vue') },
      { path: 'schedule', component: () => import('@/pages/student/SchedulePage.vue') },
      { path: 'grades', component: () => import('@/pages/student/GradesPage.vue') },
      { path: 'profile', component: () => import('@/pages/student/ProfilePage.vue') },
    ],
  },

  // Parent tabs
  {
    path: '/parent',
    component: () => import('@/layouts/ParentLayout.vue'),
    meta: { requiresAuth: true, role: 'parent' },
    children: [
      { path: '', redirect: '/parent/dashboard' },
      { path: 'dashboard', component: () => import('@/pages/parent/DashboardPage.vue') },
      { path: 'children', component: () => import('@/pages/parent/ChildrenPage.vue') },
      { path: 'payments', component: () => import('@/pages/parent/PaymentsPage.vue') },
      { path: 'profile', component: () => import('@/pages/parent/ProfilePage.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/auth/login'
  }
})

export default router
