import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/apps/landing/HomePage.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/apps/landing/AboutPage.vue')
  },
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('@/apps/landing/CoursesPage.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/apps/landing/ContactPage.vue')
  },
  {
    path: '/teacher/:id',
    name: 'Teacher',
    component: () => import('@/apps/landing/TeacherPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/apps/landing/LoginPage.vue')
  },
  {
    path: '/courses/category/:id',
    name: 'Category',
    component: () => import('@/apps/landing/CategoryPage.vue')
  },
  {
    path: '/courses/subcategory/:id',
    name: 'SubCategory',
    component: () => import('@/apps/landing/SubCategoryPage.vue')
  },
  {
    path: '/courses/course/:id',
    name: 'CourseDetail',
    component: () => import('@/apps/landing/CourseDetailPage.vue')
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('@/apps/landing/AchievementsPage.vue')
  },
  // Cabinet routes - Student
  {
    path: '/cabinet/student',
    name: 'Cabinet',
    component: () => import('@/apps/cabinet/pages/student/DashboardPage.vue'),
    meta: { requiresAuth: true, requiresStudent: true, title: 'Dashboard' }
  },
  {
    path: '/cabinet/student/courses',
    name: 'CabinetCourses',
    component: () => import('@/apps/cabinet/pages/student/CoursesPage.vue'),
    meta: { requiresAuth: true, requiresStudent: true, title: 'Courses' }
  },
  {
    path: '/cabinet/student/courses/:id',
    name: 'CabinetCourseDetail',
    component: () => import('@/apps/cabinet/pages/student/CourseDetailPage.vue'),
    meta: { requiresAuth: true, requiresStudent: true, title: 'Course Detail' }
  },
  {
    path: '/cabinet/student/schedule',
    name: 'CabinetSchedule',
    component: () => import('@/apps/cabinet/pages/student/SchedulePage.vue'),
    meta: { requiresAuth: true, requiresStudent: true, title: 'Schedule' }
  },
  {
    path: '/cabinet/student/grades',
    name: 'CabinetGrades',
    component: () => import('@/apps/cabinet/pages/student/GradesPage.vue'),
    meta: { requiresAuth: true, requiresStudent: true, title: 'Grades' }
  },
  // Teacher routes
  {
    path: '/cabinet/teacher',
    name: 'TeacherDashboard',
    component: () => import('@/apps/cabinet/pages/teacher/DashboardPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Dashboard' }
  },
  {
    path: '/cabinet/teacher/courses',
    name: 'TeacherCourses',
    component: () => import('@/apps/cabinet/pages/teacher/courses/CoursesPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Courses' }
  },
  {
    path: '/cabinet/teacher/courses/:id',
    name: 'TeacherCourseDetail',
    component: () => import('@/apps/cabinet/pages/teacher/courses/CourseDetailPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Course Detail' }
  },
  {
    path: '/cabinet/teacher/courses/:id/games/add',
    name: 'TeacherGameAdd',
    component: () => import('@/apps/cabinet/pages/teacher/courses/GameEditorPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Add Game' }
  },
  {
    path: '/cabinet/teacher/courses/:id/games/:gameId/edit',
    name: 'TeacherGameEdit',
    component: () => import('@/apps/cabinet/pages/teacher/courses/GameEditorPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Edit Game' }
  },
  {
    path: '/cabinet/teacher/schedule',
    name: 'TeacherSchedule',
    component: () => import('@/apps/cabinet/pages/teacher/SchedulePage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Schedule' }
  },
  {
    path: '/cabinet/teacher/students',
    name: 'TeacherStudents',
    component: () => import('@/apps/cabinet/pages/teacher/StudentsPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Students' }
  },
  {
    path: '/cabinet/teacher/grades',
    name: 'TeacherGrades',
    component: () => import('@/apps/cabinet/pages/teacher/GradesPage.vue'),
    meta: { requiresAuth: true, requiresTeacher: true, title: 'Grades' }
  },
  // Director routes
  {
    path: '/cabinet/director',
    name: 'DirectorDashboard',
    component: () => import('@/apps/cabinet/pages/director/DashboardPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Dashboard' }
  },
  {
    path: '/cabinet/director/teachers',
    name: 'DirectorTeachers',
    component: () => import('@/apps/cabinet/pages/director/TeachersPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Teachers' }
  },
  {
    path: '/cabinet/director/students',
    name: 'DirectorStudents',
    component: () => import('@/apps/cabinet/pages/director/StudentsPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Students' }
  },
  {
    path: '/cabinet/director/courses',
    name: 'DirectorCourses',
    component: () => import('@/apps/cabinet/pages/director/CoursesPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Courses' }
  },
  {
    path: '/cabinet/director/schedule',
    name: 'DirectorSchedule',
    component: () => import('@/apps/cabinet/pages/director/SchedulePage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Schedule' }
  },
  {
    path: '/cabinet/director/reports',
    name: 'DirectorReports',
    component: () => import('@/apps/cabinet/pages/director/ReportsPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Reports' }
  },
  {
    path: '/cabinet/director/gems',
    name: 'DirectorGems',
    component: () => import('@/apps/cabinet/pages/director/GemsPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Gems Distribution' }
  },
  {
    path: '/cabinet/director/gems/reports',
    name: 'DirectorGemsReports',
    component: () => import('@/apps/cabinet/pages/director/GemsReportsPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Gems Reports' }
  },
  {
    path: '/cabinet/director/payments/reports',
    name: 'DirectorPaymentReports',
    component: () => import('@/apps/cabinet/pages/shared/PaymentReportsPage.vue'),
    meta: { requiresAuth: true, requiresDirector: true, title: 'Payment Reports' }
  },
  // Merchant/Vendor routes
  {
    path: '/cabinet/vendor',
    name: 'VendorDashboard',
    component: () => import('@/apps/cabinet/pages/vendor/VendorDashboard.vue'),
    meta: { requiresAuth: true, requiresMerchant: true, title: 'Vendor Dashboard' }
  },
  {
    path: '/cabinet/vendor/transactions',
    name: 'VendorTransactions',
    component: () => import('@/apps/cabinet/pages/vendor/TransactionsPage.vue'),
    meta: { requiresAuth: true, requiresMerchant: true, title: 'Vendor Transactions' }
  },
  // Legacy routes for backward compatibility (redirect to role-specific routes)
  {
    path: '/cabinet/students',
    name: 'CabinetStudents',
    redirect: (to) => {
      const authStore = useAuthStore()
      const role = authStore.user?.role
      if (role === 'teacher') return '/cabinet/teacher/students'
      if (role === 'director') return '/cabinet/director/students'
      return '/cabinet'
    },
    meta: { requiresAuth: true, title: 'Students' }
  },
  {
    path: '/cabinet/teachers',
    name: 'CabinetTeachers',
    redirect: (to) => {
      const authStore = useAuthStore()
      const role = authStore.user?.role
      if (role === 'director') return '/cabinet/director/teachers'
      return '/cabinet'
    },
    meta: { requiresAuth: true, title: 'Teachers' }
  },
  {
    path: '/cabinet/reports',
    name: 'CabinetReports',
    redirect: (to) => {
      const authStore = useAuthStore()
      const role = authStore.user?.role
      if (role === 'director') return '/cabinet/director/reports'
      return '/cabinet'
    },
    meta: { requiresAuth: true, title: 'Reports' }
  },
  {
    path: '/cabinet/profile',
    name: 'CabinetProfile',
    component: () => import('@/apps/cabinet/pages/ProfilePage.vue'),
    meta: { requiresAuth: true, title: 'Profile' }
  },
  // Head Teacher routes (for role 'head_teacher')
  {
    path: '/cabinet/head-teacher/courses',
    name: 'HeadTeacherCourses',
    component: () => import('@/apps/cabinet/pages/head-teacher/CoursesListPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Courses' }
  },
  {
    path: '/cabinet/head-teacher/courses/add',
    name: 'HeadTeacherCourseAdd',
    component: () => import('@/apps/cabinet/pages/head-teacher/CourseAddPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Add Course' }
  },
  {
    path: '/cabinet/head-teacher/courses/:id/change',
    name: 'HeadTeacherCourseEdit',
    component: () => import('@/apps/cabinet/pages/head-teacher/CourseEditPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Edit Course' }
  },
  {
    path: '/cabinet/head-teacher/courses/:id/statistics',
    name: 'HeadTeacherCourseStats',
    component: () => import('@/apps/cabinet/pages/head-teacher/CourseStatsPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Course Statistics' }
  },
  {
    path: '/cabinet/head-teacher/teachers',
    name: 'HeadTeacherTeachers',
    component: () => import('@/apps/cabinet/pages/head-teacher/TeachersListPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Teachers' }
  },
  {
    path: '/cabinet/head-teacher/teachers/add',
    name: 'HeadTeacherTeacherAdd',
    component: () => import('@/apps/cabinet/pages/head-teacher/TeacherAddPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Add Teacher' }
  },
  {
    path: '/cabinet/head-teacher/teachers/:id/change',
    name: 'HeadTeacherTeacherEdit',
    component: () => import('@/apps/cabinet/pages/head-teacher/TeacherEditPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Edit Teacher' }
  },
  {
    path: '/cabinet/head-teacher/students',
    name: 'HeadTeacherStudents',
    component: () => import('@/apps/cabinet/pages/head-teacher/StudentsListPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Students' }
  },
  {
    path: '/cabinet/head-teacher/students/add',
    name: 'HeadTeacherStudentAdd',
    component: () => import('@/apps/cabinet/pages/head-teacher/StudentAddPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Add Student' }
  },
  {
    path: '/cabinet/head-teacher/students/:id/change',
    name: 'HeadTeacherStudentEdit',
    component: () => import('@/apps/cabinet/pages/head-teacher/StudentEditPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Edit Student' }
  },
  {
    path: '/cabinet/head-teacher/groups',
    name: 'HeadTeacherGroups',
    component: () => import('@/apps/cabinet/pages/head-teacher/GroupsListPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Groups' }
  },
  {
    path: '/cabinet/head-teacher/groups/add',
    name: 'HeadTeacherGroupAdd',
    component: () => import('@/apps/cabinet/pages/head-teacher/GroupAddPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Add Group' }
  },
  {
    path: '/cabinet/head-teacher/groups/:id',
    name: 'HeadTeacherGroupDetail',
    component: () => import('@/apps/cabinet/pages/shared/GroupDetailPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Group Detail' }
  },
  {
    path: '/cabinet/head-teacher/groups/:id/change',
    name: 'HeadTeacherGroupEdit',
    component: () => import('@/apps/cabinet/pages/head-teacher/GroupEditPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Edit Group' }
  },
  {
    path: '/cabinet/head-teacher/payments/add',
    name: 'HeadTeacherPaymentAdd',
    component: () => import('@/apps/cabinet/pages/head-teacher/PaymentAddPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Add Payment' }
  },
  {
    path: '/cabinet/head-teacher/payments/reports',
    name: 'HeadTeacherPaymentReports',
    component: () => import('@/apps/cabinet/pages/shared/PaymentReportsPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Payment Reports' }
  },
  {
    path: '/cabinet/head-teacher/mailing',
    name: 'HeadTeacherMailing',
    component: () => import('@/apps/cabinet/pages/head-teacher/MailingListPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Mailing' }
  },
  {
    path: '/cabinet/head-teacher/mailing/create',
    name: 'HeadTeacherMailingCreate',
    component: () => import('@/apps/cabinet/pages/head-teacher/MailingCreatePage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Create Message' }
  },
  {
    path: '/cabinet/head-teacher/mailing/:id',
    name: 'HeadTeacherMailingDetail',
    component: () => import('@/apps/cabinet/pages/head-teacher/MailingDetailPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Mailing Detail' }
  },
  {
    path: '/cabinet/head-teacher/gems',
    name: 'HeadTeacherGems',
    component: () => import('@/apps/cabinet/pages/head-teacher/GemsPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Gems Distribution' }
  },
  {
    path: '/cabinet/head-teacher/exam-settings',
    name: 'HeadTeacherExamSettings',
    component: () => import('@/apps/cabinet/pages/head-teacher/ExamSettingsPage.vue'),
    meta: { requiresAuth: true, requiresHeadTeacher: true, title: 'Exam Settings' }
  },
  // Messages page for all users
  {
    path: '/cabinet/messages',
    name: 'CabinetMessages',
    component: () => import('@/apps/cabinet/pages/MessagesPage.vue'),
    meta: { requiresAuth: true, title: 'Messages' }
  },
  {
    path: '/cabinet/messages/:id',
    name: 'CabinetMessageDetail',
    component: () => import('@/apps/cabinet/pages/MessageDetailPage.vue'),
    meta: { requiresAuth: true, title: 'Message Detail' }
  },
  {
    path: '/cabinet/ai-assistant',
    name: 'AIChat',
    component: () => import('@/apps/cabinet/pages/ai/AIChatPage.vue'),
    meta: { requiresAuth: true, title: 'AI Assistant' }
  },
  // Management routes (only for superuser)
  {
    path: '/management',
    name: 'Admin',
    component: () => import('@/apps/admin/pages/DashboardPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Management' }
  },
  // Landing Section
  {
    path: '/management/landing',
    name: 'AdminLandingDashboard',
    component: () => import('@/apps/admin/pages/landing/LandingDashboardPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Landing Dashboard' }
  },
  {
    path: '/management/landing/news',
    name: 'AdminNews',
    component: () => import('@/apps/admin/pages/landing/news/NewsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'News' }
  },
  {
    path: '/management/directors',
    name: 'AdminDirectors',
    component: () => import('@/apps/admin/pages/users/directors/DirectorsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Directors' }
  },
  {
    path: '/management/administrators',
    name: 'AdminAdministrators',
    component: () => import('@/apps/admin/pages/users/administrators/AdministratorsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Administrators' }
  },
  {
    path: '/management/landing/courses',
    name: 'AdminCourses',
    component: () => import('@/apps/admin/pages/landing/courses/CoursesListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Courses' }
  },
  {
    path: '/management/landing/contact-messages',
    name: 'AdminContactMessages',
    component: () => import('@/apps/admin/pages/landing/contact/ContactMessagesListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Contact Messages' }
  },
  {
    path: '/management/landing/contact-messages/:id/change',
    name: 'AdminContactMessageEdit',
    component: () => import('@/apps/admin/pages/landing/contact/ContactMessageEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Contact Message' }
  },
  {
    path: '/management/landing/leaderboards',
    name: 'AdminLeaderboards',
    component: () => import('@/apps/admin/pages/landing/leaderboards/LeaderboardsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Leaderboards' }
  },
  // Mailing routes
  {
    path: '/management/mailing',
    name: 'AdminMailing',
    component: () => import('@/apps/admin/pages/mailing/MailingListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Mailing' }
  },
  {
    path: '/management/mailing/add',
    name: 'AdminMailingAdd',
    component: () => import('@/apps/admin/pages/mailing/MailingCreatePage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Create Mailing' }
  },
  {
    path: '/management/mailing/:id',
    name: 'AdminMailingDetail',
    component: () => import('@/apps/admin/pages/mailing/MailingDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Mailing Detail' }
  },
  {
    path: '/management/teachers',
    name: 'AdminTeachers',
    component: () => import('@/apps/admin/pages/users/teachers/TeachersListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Teachers' }
  },
  {
    path: '/management/students',
    name: 'AdminStudents',
    component: () => import('@/apps/admin/pages/users/students/StudentsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Students' }
  },
  {
    path: '/management/merchants',
    name: 'AdminMerchants',
    component: () => import('@/apps/admin/pages/users/merchants/MerchantsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Merchants' }
  },
  {
    path: '/management/merchants/add',
    name: 'AdminMerchantAdd',
    component: () => import('@/apps/admin/pages/users/merchants/MerchantAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Merchant' }
  },
  {
    path: '/management/merchants/:id',
    name: 'AdminMerchantDetail',
    component: () => import('@/apps/admin/pages/users/merchants/MerchantDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Merchant Detail' }
  },
  {
    path: '/management/merchants/:id/change',
    name: 'AdminMerchantEdit',
    component: () => import('@/apps/admin/pages/users/merchants/MerchantEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Merchant' }
  },
  // News add/edit routes
  {
    path: '/management/landing/news/add',
    name: 'AdminNewsAdd',
    component: () => import('@/apps/admin/pages/landing/news/NewsAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add News' }
  },
  {
    path: '/management/landing/news/:id/change',
    name: 'AdminNewsEdit',
    component: () => import('@/apps/admin/pages/landing/news/NewsEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit News' }
  },
  // Directors add/edit routes
  {
    path: '/management/directors/add',
    name: 'AdminDirectorAdd',
    component: () => import('@/apps/admin/pages/users/directors/DirectorAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Director' }
  },
  {
    path: '/management/directors/:id',
    name: 'AdminDirectorDetail',
    component: () => import('@/apps/admin/pages/users/directors/DirectorDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Director Detail' }
  },
  {
    path: '/management/directors/:id/change',
    name: 'AdminDirectorEdit',
    component: () => import('@/apps/admin/pages/users/directors/DirectorEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Director' }
  },
  // Head Teachers list/add/edit routes
  {
    path: '/management/head-teachers',
    name: 'AdminHeadTeachers',
    component: () => import('@/apps/admin/pages/users/head-teachers/HeadTeachersListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Head Teachers' }
  },
  {
    path: '/management/head-teachers/add',
    name: 'AdminHeadTeacherAdd',
    component: () => import('@/apps/admin/pages/users/head-teachers/HeadTeacherAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Head Teacher' }
  },
  {
    path: '/management/head-teachers/:id',
    name: 'AdminHeadTeacherDetail',
    component: () => import('@/apps/admin/pages/users/head-teachers/HeadTeacherDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Head Teacher Detail' }
  },
  {
    path: '/management/head-teachers/:id/change',
    name: 'AdminHeadTeacherEdit',
    component: () => import('@/apps/admin/pages/users/head-teachers/HeadTeacherEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Head Teacher' }
  },
  // Administrators add/edit routes
  {
    path: '/management/administrators/add',
    name: 'AdminAdministratorAdd',
    component: () => import('@/apps/admin/pages/users/administrators/AdministratorAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Administrator' }
  },
  {
    path: '/management/administrators/:id/change',
    name: 'AdminAdministratorEdit',
    component: () => import('@/apps/admin/pages/users/administrators/AdministratorEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Administrator' }
  },
  // Courses add/edit routes
  {
    path: '/management/landing/courses/add',
    name: 'AdminCourseAdd',
    component: () => import('@/apps/admin/pages/landing/courses/CourseAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Course' }
  },
  {
    path: '/management/landing/courses/:id/change',
    name: 'AdminCourseEdit',
    component: () => import('@/apps/admin/pages/landing/courses/CourseEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Course' }
  },
  {
    path: '/management/landing/course-categories',
    name: 'AdminCourseCategories',
    component: () => import('@/apps/admin/pages/landing/course-categories/CourseCategoriesListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Course Categories' }
  },
  {
    path: '/management/landing/course-categories/add',
    name: 'AdminCourseCategoryAdd',
    component: () => import('@/apps/admin/pages/landing/course-categories/CourseCategoryAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Course Category' }
  },
  {
    path: '/management/landing/course-categories/:id/change',
    name: 'AdminCourseCategoryEdit',
    component: () => import('@/apps/admin/pages/landing/course-categories/CourseCategoryEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Course Category' }
  },
  {
    path: '/management/landing/course-subcategories',
    name: 'AdminCourseSubCategories',
    component: () => import('@/apps/admin/pages/landing/course-subcategories/CourseSubCategoriesListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Course SubCategories' }
  },
  {
    path: '/management/landing/course-subcategories/add',
    name: 'AdminCourseSubCategoryAdd',
    component: () => import('@/apps/admin/pages/landing/course-subcategories/CourseSubCategoryAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Course SubCategory' }
  },
  {
    path: '/management/landing/course-subcategories/:id/change',
    name: 'AdminCourseSubCategoryEdit',
    component: () => import('@/apps/admin/pages/landing/course-subcategories/CourseSubCategoryEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Course SubCategory' }
  },
  // Teachers add/edit routes
  {
    path: '/management/teachers/add',
    name: 'AdminTeacherAdd',
    component: () => import('@/apps/admin/pages/users/teachers/TeacherAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Teacher' }
  },
  {
    path: '/management/teachers/:id',
    name: 'AdminTeacherDetail',
    component: () => import('@/apps/admin/pages/users/teachers/TeacherDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Teacher Detail' }
  },
  {
    path: '/management/teachers/:id/change',
    name: 'AdminTeacherEdit',
    component: () => import('@/apps/admin/pages/users/teachers/TeacherEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Teacher' }
  },
  // Students add/edit routes
  {
    path: '/management/students/add',
    name: 'AdminStudentAdd',
    component: () => import('@/apps/admin/pages/users/students/StudentAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Student' }
  },
  {
    path: '/management/students/:id',
    name: 'AdminStudentDetail',
    component: () => import('@/apps/admin/pages/users/students/StudentDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Student Detail' }
  },
  {
    path: '/management/students/:id/change',
    name: 'AdminStudentEdit',
    component: () => import('@/apps/admin/pages/users/students/StudentEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Student' }
  },
  // Placeholder for legacy user routes
  {
    path: '/management/users',
    redirect: '/management/students'
  },
  {
    path: '/management/users/add',
    redirect: '/management/students/add'
  },
  {
    path: '/management/users/:id/change',
    redirect: (to) => `/management/students/${to.params.id}/change`
  },
  // Vendor management routes
  {
    path: '/management/vendors',
    name: 'AdminVendors',
    component: () => import('@/apps/admin/pages/vendors/VendorsListPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Vendors' }
  },
  {
    path: '/management/vendors/add',
    name: 'AdminVendorAdd',
    component: () => import('@/apps/admin/pages/vendors/VendorAddPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Add Vendor' }
  },
  {
    path: '/management/vendors/:id',
    name: 'AdminVendorDetail',
    component: () => import('@/apps/admin/pages/vendors/VendorDetailPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Vendor Detail' }
  },
  {
    path: '/management/vendors/:id/change',
    name: 'AdminVendorEdit',
    component: () => import('@/apps/admin/pages/vendors/VendorEditPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Edit Vendor' }
  },
  // Points & RFID management routes
  {
    path: '/management/points/transactions',
    name: 'AdminTransactions',
    component: () => import('@/apps/admin/pages/points/TransactionsPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Transactions' }
  },
  {
    path: '/management/points/reports',
    name: 'AdminReports',
    component: () => import('@/apps/admin/pages/points/ReportsPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Reports' }
  },
  // Settings route
  {
    path: '/management/activity-logs',
    name: 'AdminActivityLogs',
    component: () => import('@/apps/admin/pages/logs/ActivityLogsPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Activity Logs' }
  },
  {
    path: '/management/settings',
    name: 'AdminSettings',
    component: () => import('@/apps/admin/pages/SettingsPage.vue'),
    meta: { requiresAuth: true, requiresSuperuser: true, title: 'Settings' }
  },
  // Примеры UI библиотек (для разработки)
  {
    path: '/examples/admin',
    name: 'AdminExample',
    component: () => import('@/examples/AdminExample.vue'),
    meta: { title: 'Quasar Example' }
  },
  {
    path: '/examples/cabinet',
    name: 'CabinetExample',
    component: () => import('@/examples/CabinetExample.vue'),
    meta: { title: 'Naive UI Example' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Route guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth if we have a token but no user data
  if (authStore.accessToken && !authStore.user && !authStore.loading) {
    try {
      await authStore.initializeAuth()
    } catch (error) {
      // If initialization fails, continue - route guard will handle redirect
      console.error('Auth initialization failed:', error)
    }
  }
  
  // Wait a bit if user is still loading (max 2 seconds)
  if (authStore.accessToken && authStore.loading && !authStore.user) {
    let attempts = 0
    while (authStore.loading && attempts < 40 && !authStore.user) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }
  }
  
  // STRICT PROTECTION: Block access to /management/* for non-superusers
  // This is checked BEFORE requiresAuth to prevent any unauthorized access
  if (to.path.startsWith('/management')) {
    if (!authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // Wait for user data if needed
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only superusers can access /management/*
    if (!authStore.user || !authStore.user.is_superuser) {
      console.error(`BLOCKED: User ${authStore.user?.username || 'unknown'} attempted to access ${to.path} but is not superuser`)
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresSuperuser) {
    // Wait for user to load if we have token but no user data yet
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    // Wait for user data to load (max 2 seconds)
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        // If user loaded, break
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only is_superuser can access /management routes
    if (!authStore.user || !authStore.user.is_superuser) {
      console.error(`Access denied to ${to.path}: User is not superuser. User:`, authStore.user)
      // Redirect to role-based dashboard instead of home
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  if (to.meta.requiresHeadTeacher) {
    // Wait for user to load if we have token but no user data yet
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    // Wait for user data to load (max 2 seconds)
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        // If user loaded, break
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only head_teacher can access head-teacher routes
    if (!authStore.user || authStore.user.role !== 'head_teacher') {
      console.error(`Access denied to ${to.path}: User is not head_teacher. Role:`, authStore.user?.role)
      // Redirect to role-based dashboard
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  if (to.meta.requiresStudent) {
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only student can access student routes
    if (!authStore.user || authStore.user.role !== 'student') {
      console.error(`Access denied to ${to.path}: User is not student. Role:`, authStore.user?.role)
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  if (to.meta.requiresTeacher) {
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only teacher can access teacher routes
    if (!authStore.user || authStore.user.role !== 'teacher') {
      console.error(`Access denied to ${to.path}: User is not teacher. Role:`, authStore.user?.role)
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  if (to.meta.requiresDirector) {
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only director can access director routes
    if (!authStore.user || authStore.user.role !== 'director') {
      console.error(`Access denied to ${to.path}: User is not director. Role:`, authStore.user?.role)
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }

  if (to.meta.requiresMerchant) {
    if (authStore.accessToken && !authStore.user && !authStore.loading) {
      try {
        await authStore.initializeAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    if (authStore.accessToken && !authStore.user) {
      let attempts = 0
      while (!authStore.user && attempts < 40 && (authStore.loading || authStore.accessToken)) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
        if (authStore.user) break
      }
    }
    
    // STRICT CHECK: Only merchant can access vendor routes
    if (!authStore.user || authStore.user.role !== 'merchant') {
      console.error(`Access denied to ${to.path}: User is not merchant. Role:`, authStore.user?.role)
      const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
      const redirectPath = getRoleBasedRedirect(authStore.user)
      next(redirectPath)
      return
    }
  }
  
  next()
})

// Automatic activity logging for navigation
router.afterEach((to, from) => {
  // Don't log if it's the same route
  if (to.path === from.path) {
    return
  }

  // Import and use activity log
  import('@/composables/useActivityLog').then(({ logActivityDirect }) => {
    import('@/stores/authStore').then(({ useAuthStore }) => {
      const authStore = useAuthStore()
      
      // Only log if user is authenticated
      if (!authStore.isAuthenticated) {
        return
      }

      const componentName = to.name?.toString() || to.path.split('/').pop() || ''
      
      // Determine action type based on route
      let actionType: 'view' | 'login' | 'logout' | 'other' = 'view'
      if (to.path.includes('/login')) {
        actionType = 'login'
      } else if (to.path.includes('/logout')) {
        actionType = 'logout'
      }

      // Log the navigation
      // Use English descriptions to avoid encoding issues
      const description = actionType === 'login' 
        ? 'Login to system' 
        : actionType === 'logout'
        ? 'Logout from system'
        : `Navigate to ${to.path}`
      
      logActivityDirect(
        to.path,
        componentName,
        actionType,
        description,
        undefined,
        undefined,
        undefined
      )
    })
  }).catch(() => {
    // Silently fail if module not loaded
  })
})

export default router

