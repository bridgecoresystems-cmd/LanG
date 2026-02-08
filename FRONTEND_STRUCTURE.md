# Структура проекта LanG — Frontend и Backend

Обзор страниц, маршрутов, API и структуры проекта LanG.

---

# Frontend

**Стек:** Vue 3, TypeScript, Vite, Quasar, PrimeVue, Naive UI, Vue Router, Pinia, Vue i18n

**Языки интерфейса:** ru, en, tm (туркменский)

---

## 1. Landing (публичные страницы)

Доступны без авторизации.


| Путь                       | Название     | Компонент            | Описание               |
| -------------------------- | ------------ | -------------------- | ---------------------- |
| `/`                        | Home         | HomePage.vue         | Главная страница       |
| `/about`                   | About        | AboutPage.vue        | О нас                  |
| `/courses`                 | Courses      | CoursesPage.vue      | Каталог курсов         |
| `/courses/category/:id`    | Category     | CategoryPage.vue     | Курсы по категории     |
| `/courses/subcategory/:id` | SubCategory  | SubCategoryPage.vue  | Курсы по подкатегории  |
| `/courses/course/:id`      | CourseDetail | CourseDetailPage.vue | Страница курса         |
| `/teacher/:id`             | Teacher      | TeacherPage.vue      | Страница преподавателя |
| `/contact`                 | Contact      | ContactPage.vue      | Контакты               |
| `/login`                   | Login        | LoginPage.vue        | Вход                   |
| `/achievements`            | Achievements | AchievementsPage.vue | Достижения             |


---

## 2. Cabinet — Личный кабинет

### 2.1 Общие страницы (для всех авторизованных)


| Путь                    | Название             | Компонент             | Описание             |
| ----------------------- | -------------------- | --------------------- | -------------------- |
| `/cabinet/profile`      | CabinetProfile       | ProfilePage.vue       | Профиль пользователя |
| `/cabinet/messages`     | CabinetMessages      | MessagesPage.vue      | Список сообщений     |
| `/cabinet/messages/:id` | CabinetMessageDetail | MessageDetailPage.vue | Просмотр сообщения   |
| `/cabinet/ai-assistant` | AIChat               | AIChatPage.vue        | AI-ассистент         |


---

### 2.2 Student — Студент (`requiresStudent`)


| Путь                           | Название            | Компонент                   |
| ------------------------------ | ------------------- | --------------------------- |
| `/cabinet/student`             | Cabinet             | DashboardPage.vue — дашборд |
| `/cabinet/student/courses`     | CabinetCourses      | CoursesPage.vue             |
| `/cabinet/student/courses/:id` | CabinetCourseDetail | CourseDetailPage.vue        |
| `/cabinet/student/schedule`    | CabinetSchedule     | SchedulePage.vue            |
| `/cabinet/student/grades`      | CabinetGrades       | GradesPage.vue              |


**Табы в CourseDetailPage (студент):**

- AttendanceTab.vue
- GamesTab.vue
- GradesTab.vue
- PaymentsTab.vue

---

### 2.3 Teacher — Учитель (`requiresTeacher`)


| Путь                                              | Название            | Компонент            |
| ------------------------------------------------- | ------------------- | -------------------- |
| `/cabinet/teacher`                                | TeacherDashboard    | DashboardPage.vue    |
| `/cabinet/teacher/courses`                        | TeacherCourses      | CoursesPage.vue      |
| `/cabinet/teacher/courses/:id`                    | TeacherCourseDetail | CourseDetailPage.vue |
| `/cabinet/teacher/courses/:id/games/add`          | TeacherGameAdd      | GameEditorPage.vue   |
| `/cabinet/teacher/courses/:id/games/:gameId/edit` | TeacherGameEdit     | GameEditorPage.vue   |
| `/cabinet/teacher/schedule`                       | TeacherSchedule     | SchedulePage.vue     |
| `/cabinet/teacher/students`                       | TeacherStudents     | StudentsPage.vue     |
| `/cabinet/teacher/grades`                         | TeacherGrades       | GradesPage.vue       |


**Табы в CourseDetailPage (учитель):**

- AttendanceTab.vue
- GamesTab.vue, GamesDetailView.vue
- GradesTab.vue
- LessonsTab.vue
- StudentsTab.vue

---

### 2.4 Director — Директор (`requiresDirector`)


| Путь                                 | Название               | Компонент                       |
| ------------------------------------ | ---------------------- | ------------------------------- |
| `/cabinet/director`                  | DirectorDashboard      | DashboardPage.vue               |
| `/cabinet/director/teachers`         | DirectorTeachers       | TeachersPage.vue                |
| `/cabinet/director/students`         | DirectorStudents       | StudentsPage.vue                |
| `/cabinet/director/courses`          | DirectorCourses        | CoursesPage.vue                 |
| `/cabinet/director/schedule`         | DirectorSchedule       | SchedulePage.vue                |
| `/cabinet/director/reports`          | DirectorReports        | ReportsPage.vue                 |
| `/cabinet/director/gems`             | DirectorGems           | GemsPage.vue                    |
| `/cabinet/director/gems/reports`     | DirectorGemsReports    | GemsReportsPage.vue             |
| `/cabinet/director/payments/reports` | DirectorPaymentReports | PaymentReportsPage.vue (shared) |


---

### 2.5 Head Teacher — Завуч (`requiresHeadTeacher`)


| Путь                                           | Название                  | Компонент                       |
| ---------------------------------------------- | ------------------------- | ------------------------------- |
| `/cabinet/head-teacher/courses`                | HeadTeacherCourses        | CoursesListPage.vue             |
| `/cabinet/head-teacher/courses/add`            | HeadTeacherCourseAdd      | CourseAddPage.vue               |
| `/cabinet/head-teacher/courses/:id/change`     | HeadTeacherCourseEdit     | CourseEditPage.vue              |
| `/cabinet/head-teacher/courses/:id/statistics` | HeadTeacherCourseStats    | CourseStatsPage.vue             |
| `/cabinet/head-teacher/teachers`               | HeadTeacherTeachers       | TeachersListPage.vue            |
| `/cabinet/head-teacher/teachers/add`           | HeadTeacherTeacherAdd     | TeacherAddPage.vue              |
| `/cabinet/head-teacher/teachers/:id/change`    | HeadTeacherTeacherEdit    | TeacherEditPage.vue             |
| `/cabinet/head-teacher/students`               | HeadTeacherStudents       | StudentsListPage.vue            |
| `/cabinet/head-teacher/students/add`           | HeadTeacherStudentAdd     | StudentAddPage.vue              |
| `/cabinet/head-teacher/students/:id/change`    | HeadTeacherStudentEdit    | StudentEditPage.vue             |
| `/cabinet/head-teacher/groups`                 | HeadTeacherGroups         | GroupsListPage.vue              |
| `/cabinet/head-teacher/groups/add`             | HeadTeacherGroupAdd       | GroupAddPage.vue                |
| `/cabinet/head-teacher/groups/:id`             | HeadTeacherGroupDetail    | GroupDetailPage.vue (shared)    |
| `/cabinet/head-teacher/groups/:id/change`      | HeadTeacherGroupEdit      | GroupEditPage.vue               |
| `/cabinet/head-teacher/payments/add`           | HeadTeacherPaymentAdd     | PaymentAddPage.vue              |
| `/cabinet/head-teacher/payments/reports`       | HeadTeacherPaymentReports | PaymentReportsPage.vue (shared) |
| `/cabinet/head-teacher/mailing`                | HeadTeacherMailing        | MailingListPage.vue             |
| `/cabinet/head-teacher/mailing/create`         | HeadTeacherMailingCreate  | MailingCreatePage.vue           |
| `/cabinet/head-teacher/mailing/:id`            | HeadTeacherMailingDetail  | MailingDetailPage.vue           |
| `/cabinet/head-teacher/gems`                   | HeadTeacherGems           | GemsPage.vue                    |
| `/cabinet/head-teacher/exam-settings`          | HeadTeacherExamSettings   | ExamSettingsPage.vue            |


### 2.6 Vendor / Merchant (`requiresMerchant`)


| Путь                           | Название           | Компонент            |
| ------------------------------ | ------------------ | -------------------- |
| `/cabinet/vendor`              | VendorDashboard    | VendorDashboard.vue  |
| `/cabinet/vendor/transactions` | VendorTransactions | TransactionsPage.vue |


---

### 2.7 Legacy-маршруты (редиректы по роли)


| Путь                | Куда перенаправляет                                                            |
| ------------------- | ------------------------------------------------------------------------------ |
| `/cabinet/students` | teacher → `/cabinet/teacher/students`, director → `/cabinet/director/students` |
| `/cabinet/teachers` | director → `/cabinet/director/teachers`                                        |
| `/cabinet/reports`  | director → `/cabinet/director/reports`                                         |


---

## 3. Management — Админ-панель (Superuser)

Доступ: `requiresSuperuser` (is_superuser).

### 3.1 Общее


| Путь                        | Название          | Компонент            |
| --------------------------- | ----------------- | -------------------- |
| `/management`               | Admin             | DashboardPage.vue    |
| `/management/settings`      | AdminSettings     | SettingsPage.vue     |
| `/management/activity-logs` | AdminActivityLogs | ActivityLogsPage.vue |


### 3.2 Landing


| Путь                                                  | Название                   | Компонент                       |
| ----------------------------------------------------- | -------------------------- | ------------------------------- |
| `/management/landing`                                 | AdminLandingDashboard      | LandingDashboardPage.vue        |
| `/management/landing/news`                            | AdminNews                  | NewsListPage.vue                |
| `/management/landing/news/add`                        | AdminNewsAdd               | NewsAddPage.vue                 |
| `/management/landing/news/:id/change`                 | AdminNewsEdit              | NewsEditPage.vue                |
| `/management/landing/courses`                         | AdminCourses               | CoursesListPage.vue             |
| `/management/landing/courses/add`                     | AdminCourseAdd             | CourseAddPage.vue               |
| `/management/landing/courses/:id/change`              | AdminCourseEdit            | CourseEditPage.vue              |
| `/management/landing/course-categories`               | AdminCourseCategories      | CourseCategoriesListPage.vue    |
| `/management/landing/course-categories/add`           | AdminCourseCategoryAdd     | CourseCategoryAddPage.vue       |
| `/management/landing/course-categories/:id/change`    | AdminCourseCategoryEdit    | CourseCategoryEditPage.vue      |
| `/management/landing/course-subcategories`            | AdminCourseSubCategories   | CourseSubCategoriesListPage.vue |
| `/management/landing/course-subcategories/add`        | AdminCourseSubCategoryAdd  | CourseSubCategoryAddPage.vue    |
| `/management/landing/course-subcategories/:id/change` | AdminCourseSubCategoryEdit | CourseSubCategoryEditPage.vue   |
| `/management/landing/contact-messages`                | AdminContactMessages       | ContactMessagesListPage.vue     |
| `/management/landing/contact-messages/:id/change`     | AdminContactMessageEdit    | ContactMessageEditPage.vue      |
| `/management/landing/leaderboards`                    | AdminLeaderboards          | LeaderboardsListPage.vue        |


### 3.3 Пользователи


| Путь                                    | Название               | Компонент                  |
| --------------------------------------- | ---------------------- | -------------------------- |
| `/management/directors`                 | AdminDirectors         | DirectorsListPage.vue      |
| `/management/directors/add`             | AdminDirectorAdd       | DirectorAddPage.vue        |
| `/management/directors/:id`             | AdminDirectorDetail    | DirectorDetailPage.vue     |
| `/management/directors/:id/change`      | AdminDirectorEdit      | DirectorEditPage.vue       |
| `/management/head-teachers`             | AdminHeadTeachers      | HeadTeachersListPage.vue   |
| `/management/head-teachers/add`         | AdminHeadTeacherAdd    | HeadTeacherAddPage.vue     |
| `/management/head-teachers/:id`         | AdminHeadTeacherDetail | HeadTeacherDetailPage.vue  |
| `/management/head-teachers/:id/change`  | AdminHeadTeacherEdit   | HeadTeacherEditPage.vue    |
| `/management/administrators`            | AdminAdministrators    | AdministratorsListPage.vue |
| `/management/administrators/add`        | AdminAdministratorAdd  | AdministratorAddPage.vue   |
| `/management/administrators/:id/change` | AdminAdministratorEdit | AdministratorEditPage.vue  |
| `/management/teachers`                  | AdminTeachers          | TeachersListPage.vue       |
| `/management/teachers/add`              | AdminTeacherAdd        | TeacherAddPage.vue         |
| `/management/teachers/:id`              | AdminTeacherDetail     | TeacherDetailPage.vue      |
| `/management/teachers/:id/change`       | AdminTeacherEdit       | TeacherEditPage.vue        |
| `/management/students`                  | AdminStudents          | StudentsListPage.vue       |
| `/management/students/add`              | AdminStudentAdd        | StudentAddPage.vue         |
| `/management/students/:id`              | AdminStudentDetail     | StudentDetailPage.vue      |
| `/management/students/:id/change`       | AdminStudentEdit       | StudentEditPage.vue        |
| `/management/merchants`                 | AdminMerchants         | MerchantsListPage.vue      |
| `/management/merchants/add`             | AdminMerchantAdd       | MerchantAddPage.vue        |
| `/management/merchants/:id`             | AdminMerchantDetail    | MerchantDetailPage.vue     |
| `/management/merchants/:id/change`      | AdminMerchantEdit      | MerchantEditPage.vue       |


### 3.4 Vendors, Points, Mailing


| Путь                              | Название           | Компонент             |
| --------------------------------- | ------------------ | --------------------- |
| `/management/vendors`             | AdminVendors       | VendorsListPage.vue   |
| `/management/vendors/add`         | AdminVendorAdd     | VendorAddPage.vue     |
| `/management/vendors/:id`         | AdminVendorDetail  | VendorDetailPage.vue  |
| `/management/vendors/:id/change`  | AdminVendorEdit    | VendorEditPage.vue    |
| `/management/points/transactions` | AdminTransactions  | TransactionsPage.vue  |
| `/management/points/reports`      | AdminReports       | ReportsPage.vue       |
| `/management/mailing`             | AdminMailing       | MailingListPage.vue   |
| `/management/mailing/add`         | AdminMailingAdd    | MailingCreatePage.vue |
| `/management/mailing/:id`         | AdminMailingDetail | MailingDetailPage.vue |


### 3.5 Legacy user routes (редиректы)


| Путь                           | Редирект                            |
| ------------------------------ | ----------------------------------- |
| `/management/users`            | → `/management/students`            |
| `/management/users/add`        | → `/management/students/add`        |
| `/management/users/:id/change` | → `/management/students/:id/change` |


---

## 4. Examples (страницы для разработки)


| Путь                | Название       | Компонент                     |
| ------------------- | -------------- | ----------------------------- |
| `/examples/admin`   | AdminExample   | AdminExample.vue (Quasar)     |
| `/examples/cabinet` | CabinetExample | CabinetExample.vue (Naive UI) |


---

## 5. Компоненты (`src/components/`)


| Компонент                 | Описание                  |
| ------------------------- | ------------------------- |
| AnimatedLogo.vue          | Анимированный логотип     |
| ChatButton.vue            | Кнопка чата               |
| ChatWidget.vue            | Виджет чата               |
| CourseCard.vue            | Карточка курса            |
| CourseCategoryCard.vue    | Карточка категории курсов |
| CourseSubCategoryCard.vue | Карточка подкатегории     |
| Footer.vue                | Подвал                    |
| LeaderboardModal.vue      | Модальное окно лидерборда |
| LeaderboardSection.vue    | Блок лидерборда           |
| MainLayout.vue            | Основной layout           |
| Navbar.vue                | Навигация                 |
| NewsCard.vue              | Карточка новости          |
| NewsCarousel.vue          | Карусель новостей         |
| NewsModal.vue             | Модальное окно новости    |
| SearchBar.vue             | Поиск                     |
| TeacherCard.vue           | Карточка преподавателя    |
| UserAvatar.vue            | Аватар пользователя       |


---

## 6. Layouts


| Layout            | Использование                                |
| ----------------- | -------------------------------------------- |
| AdminLayout.vue   | `src/apps/admin/layouts/` — админ-панель     |
| CabinetLayout.vue | `src/apps/cabinet/layouts/` — личный кабинет |


---

## 7. Composables


| Composable           | Назначение             |
| -------------------- | ---------------------- |
| useActivityLog.ts    | Логирование активности |
| useAdminApi.ts       | API для админки        |
| useAuth.ts           | Авторизация            |
| useCabinet.ts        | Логика кабинета        |
| useChat.ts           | Чат                    |
| useCourses.ts        | Курсы                  |
| useHeadTeacherApi.ts | API завуча             |
| useLanguage.ts       | Язык / i18n            |
| useMailingApi.ts     | Рассылки               |
| useNews.ts           | Новости                |
| useNotifications.ts  | Уведомления            |
| usePoints.ts         | Очки / транзакции      |
| useTeachers.ts       | Преподаватели          |
| useVendors.ts        | Вендоры                |


---

## 8. Stores (Pinia)


| Store           | Назначение                |
| --------------- | ------------------------- |
| authStore.ts    | Авторизация, пользователь |
| mailingStore.ts | Рассылки                  |
| pointsStore.ts  | Очки и транзакции         |


---

## 9. Типы (`src/types/`)

- contact.ts
- course.ts
- news.ts
- teacher.ts
- user.ts

---

## 10. Локализация

- `locales/ru.json`
- `locales/en.json`
- `locales/tm.json`

---

## 11. Роли пользователей


| Роль         | Префикс маршрутов       |
| ------------ | ----------------------- |
| student      | `/cabinet/student`      |
| teacher      | `/cabinet/teacher`      |
| director     | `/cabinet/director`     |
| head_teacher | `/cabinet/head-teacher` |
| merchant     | `/cabinet/vendor`       |
| superuser    | `/management`           |


---

## 12. Безопасность

- Маршруты `/management/*` доступны только для `is_superuser`
- Для каждого ролевого раздела используется свой `requires*` guard
- Редирект на роль-специфичный дашборд при неверной роли
- Логирование навигации через `router.afterEach` и `logActivityDirect`

---

# Backend

**Стек:** Django 5.x, Django REST Framework, JWT (SimpleJWT), PostgreSQL, Channels (WebSocket), Celery, Redis, Daphne

**Структура:** `back/` — корневая папка бэкенда

---

## 1. Общая конфигурация


| Файл                 | Назначение              |
| -------------------- | ----------------------- |
| `config/settings.py` | Настройки Django        |
| `config/urls.py`     | Корневые URL            |
| `config/asgi.py`     | ASGI (в т.ч. WebSocket) |
| `config/routing.py`  | WebSocket routing       |
| `manage.py`          | Управление проектом     |


---

## 2. Аутентификация (JWT)


| Путь                               | View                | Описание                  |
| ---------------------------------- | ------------------- | ------------------------- |
| `POST /api/v1/auth/token/`         | TokenObtainPairView | Получить access + refresh |
| `POST /api/v1/auth/token/refresh/` | TokenRefreshView    | Обновить access           |
| `POST /api/v1/auth/token/verify/`  | TokenVerifyView     | Проверить токен           |


---

## 3. Приложения (apps)

### 3.1 landing

**Базовый путь:** `api/v1/landing/` (публичные), `api/v1/admin/landing/` (superuser)


| Ресурс               | Эндпоинты (REST) | Модели              |
| -------------------- | ---------------- | ------------------- |
| news                 | CRUD             | News                |
| contact-messages     | CRUD             | ContactMessage      |
| course-categories    | CRUD             | CourseCategory      |
| course-subcategories | CRUD             | CourseSubCategory   |
| courses              | CRUD             | Course              |
| leaderboards         | CRUD             | LeaderboardCarousel |


**Admin:** `dashboard/stats/` — статистика дашборда

---

### 3.2 users

**Базовый путь:** `api/v1/users/` (публичные), `api/v1/admin/users/` (superuser)


| Ресурс / путь             | Описание             | Модели         |
| ------------------------- | -------------------- | -------------- |
| `me/`                     | Текущий пользователь | User           |
| `me/change-password/`     | Смена пароля         | —              |
| teachers                  | CRUD (публичный)     | TeacherProfile |
| staff                     | CRUD                 | —              |
| students                  | CRUD (публичный)     | StudentProfile |
| cabinet/dashboard/        | Дашборд кабинета     | —              |
| cabinet/courses/          | Курсы студента       | —              |
| cabinet/schedule/         | Расписание           | —              |
| cabinet/grades/           | Оценки               | —              |
| cabinet/teacher/students/ | Студенты учителя     | —              |


**Admin ViewSets:**

- users, teachers, students, directors, head-teachers, administrators

---

### 3.3 courses

**Базовый путь:** `api/v1/courses/`


| Ресурс            | ViewSet                                 | Модели         |
| ----------------- | --------------------------------------- | -------------- |
| courses           | CourseViewSet, HeadTeacherCourseViewSet | Course         |
| groups            | GroupViewSet, HeadTeacherGroupViewSet   | Group          |
| lessons           | LessonViewSet                           | Lesson         |
| grades            | GradeViewSet                            | Grade          |
| exam-grades       | ExamGradeViewSet                        | ExamGrade      |
| attendance        | AttendanceViewSet                       | Attendance     |
| games             | GameViewSet                             | Game           |
| exam-types        | ExamTypeViewSet                         | ExamType       |
| exam-schemes      | ExamSchemeViewSet                       | ExamScheme     |
| exam-scheme-items | ExamSchemeItemViewSet                   | ExamSchemeItem |


**Префикс head-teacher:** `courses/head-teacher/` — курсы и группы для завуча

---

### 3.4 mailing

**Базовый путь:** `api/v1/mailing/`


| Ресурс      | ViewSet                                  | Модели           |
| ----------- | ---------------------------------------- | ---------------- |
| messages    | MessageViewSet (head_teacher, superuser) | Message          |
| my-messages | MessageRecipientViewSet (свои сообщения) | MessageRecipient |


**Actions:** `send`, `recipients`, `statistics` (для message), `mark_read`, `unread_count`, `mark_all_read` (для my-messages)

**Модели:** Message, MessageRecipient, MessageGroupFilter

---

### 3.5 activity_log

**Базовый путь:** `api/v1/activity-logs/`, `api/v1/admin/`


| Путь           | Описание                                    |
| -------------- | ------------------------------------------- |
| activity-logs/ | Просмотр логов (admin)                      |
| create/        | Создание лога (авторизованные пользователи) |


**Модель:** ActivityLog

---

### 3.6 points

**Базовый путь:** `api/v1/points/`


| Ресурс / путь | Описание               |
| ------------- | ---------------------- |
| wallets/      | CRUD кошельков         |
| transactions/ | CRUD транзакций        |
| transfer/     | Перевод гемов          |
| pay/          | Оплата по RFID         |
| report/       | Отчёт по гемам         |
| report/users/ | Отчёт по пользователям |


**Модели:** Wallet, Transaction

---

### 3.7 vendors

**Базовый путь:** `api/v1/vendors/`


| Ресурс    | Описание               |
| --------- | ---------------------- |
| profiles/ | CRUD профилей вендоров |


**Модель:** VendorProfile

---

### 3.8 payments

**Базовый путь:** `api/v1/payments/`


| Ресурс / путь | Описание                       |
| ------------- | ------------------------------ |
| (root)        | PaymentViewSet — CRUD платежей |
| report/       | Отчёт по платежам              |
| report/users/ | Отчёт по пользователям         |


**Модель:** Payment

---

### 3.9 chat

**Базовый путь:** `api/v1/chat/`


| Ресурс    | Описание            |
| --------- | ------------------- |
| rooms/    | CRUD комнат чата    |
| messages/ | CRUD сообщений чата |


**Модели:** Room, Message, MessageReadStatus

**Примечание:** Чат также использует WebSocket (Channels) для real-time сообщений.

---

## 4. Модели по приложениям


| Приложение    | Модели                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| users         | User, StudentProfile, TeacherProfile                                                                                     |
| landing       | News, ContactMessage, CourseCategory, CourseSubCategory, Course, LeaderboardCarousel                                     |
| courses       | Course, ExamType, ExamScheme, ExamSchemeItem, Group, Lesson, Grade, ExamGrade, Enrollment, Attendance, Game, GameAttempt |
| mailing       | Message, MessageRecipient, MessageGroupFilter                                                                            |
| points        | Wallet, Transaction                                                                                                      |
| vendors       | VendorProfile                                                                                                            |
| payments      | Payment                                                                                                                  |
| chat          | Room, Message, MessageReadStatus                                                                                         |
| activity_log  | ActivityLog                                                                                                              |
| subscriptions | SubscriptionPlan, Subscription                                                                                           |
| content       | Book, Audio, Material                                                                                                    |


---

## 5. Установленные приложения (не все в urlpatterns)

- `apps.users`, `apps.courses`, `apps.subscriptions`, `apps.content`
- `apps.payments`, `apps.chat`, `apps.landing`, `apps.mailing`
- `apps.activity_log`, `apps.points`, `apps.vendors`

**Не подключены в urls (в коде закомментированы):**

- `api/v1/subscriptions/`
- `api/v1/content/`

---

## 6. Роли пользователей (User.role)


| Роль         | Значение             |
| ------------ | -------------------- |
| student      | student              |
| teacher      | teacher              |
| director     | director             |
| head_teacher | head_teacher         |
| merchant     | merchant             |
| admin        | (через is_superuser) |


---

## 7. Дополнительные сервисы


| Сервис       | Назначение                     |
| ------------ | ------------------------------ |
| Daphne       | ASGI-сервер (HTTP + WebSocket) |
| Channels     | WebSocket, real-time чат       |
| Celery       | Фоновые задачи                 |
| Redis        | Кеш, брокер Celery, Channels   |
| Django Admin | `/admin/` — встроенная админка |


