# 📝 Changelog

All notable changes to the Language School Management System.

This project follows [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### 💎 Gamification: Gems System

- **Added complete gamification system with gems currency**
  - Virtual currency for student motivation
  - RFID terminal integration for automatic rewards
  - Teacher can manually reward students
  - Gem shop with vendors
  - Transaction history and analytics
- **WebSocket real-time balance updates**
  - Live gems balance in student cabinet
  - Instant updates when gems are awarded
  - No page reload needed
  - Per-user WebSocket connections
- Backend routes: `admin/gems.ts`, `admin/terminals.ts`, `cabinet/gems.ts`, `terminal.ts`, `ws-gems.ts`
- WebSocket: `ws/gems-broadcast.ts` for real-time messaging
- Frontend pages:
  - Admin: gems management, terminals CRUD
  - Student: view balance and history (real-time)
  - Teacher: reward students from group page
  - Head Accountant: vendor management
  - Gen Director: top-up requests
- Database tables: gems transactions, terminals, vendors

### 💬 Real-time Chat

- **Added teacher-student messaging system**
  - WebSocket-based real-time chat
  - Private chat rooms per teacher-student pair
  - Auto-create room on first message
  - Message history retrieval
  - Online/offline status indicators
- New database tables: `chat_rooms`, `chat_messages`
- Frontend components: `Chat/Widget.vue`, `Chat/StudentButton.vue`
- Integrated into cabinet layout for easy access

### 📚 Lesson Management Improvements

- Enhanced lesson pages for teachers and students
- Improved attendance tracking interface
- Fixed lesson plan and notes editing
- Better UI for homework assignment
- Added quick access to student lists from lessons

### 🔐 Authentication

- **Migrated from Lucia Auth to Better Auth v1.5.0**
  - Enhanced security with built-in OAuth support
  - Added email verification capability
  - Improved session management with token-based validation
  - Added `accounts` and `verifications` tables for future social login
  - New `BETTER_AUTH_SECRET` environment variable required
  - Session tokens now stored with IP and user agent for auditing
- Updated all authentication routes (login, register, logout)
- Replaced `generateId()` with `crypto.randomUUID()` for better security
- Added `createUserSession()` helper for direct session creation

### 🔧 Backend

- Updated middleware to use Better Auth API (`auth.api.getSession()`)
- Enhanced session validation with direct Drizzle queries
- Improved cookie handling with proper production flags
- Added `TRUSTED_ORIGINS` support for CORS in production

### 📦 Dependencies

- **Added:** `better-auth@1.5.0`
- **Removed:** `lucia@3.2.2`, `@lucia-auth/adapter-drizzle@1.1.0`
- **Updated:** `elysia@1.4.26`
- **Updated:** `bun-types@1.3.10`

### 📝 Documentation

- Added comprehensive ARCHITECTURE.md with system deep dive
- Created docs/DECISIONS.md with Architecture Decision Records (ADRs)
- Updated README.md with Better Auth information
- Standardized changelog format in English

---

## [1.0.6] - 2026-02-27

### 🎓 Teacher Cabinet: Lessons and Students

**Backend:**
- ✅ Teacher lessons API: `GET/PATCH /cabinet/teacher/groups/:groupId/lessons`, `GET/PATCH /cabinet/teacher/lessons/:id`
- ✅ Student lessons API: `GET /cabinet/student/groups/:groupId/lessons`, `GET /cabinet/student/lessons/:id`
- ✅ Group students list API: `GET /cabinet/teacher/groups/:groupId/students` (student/parent name, phone)
- ✅ `ht_lessons` schema: added `lesson_plan`, `lesson_notes` fields
- ✅ Fixed PATCH lesson validation: optional fields accept `null`

**Frontend — Lessons:**
- ✅ Restructured lesson pages: list → details → edit (teacher)
- ✅ Student: view lesson list and details page
- ✅ `useCabinetLessons`: migrated to `$fetch` for teacher/student API

**Frontend — Student List:**
- ✅ New page `/cabinet/teacher/groups/:id/students` with course header and student table
- ✅ Table: student name, parent name, student phone, parent phone (payment, chat, reward — placeholders)
- ✅ Click on course in "My Courses" navigates to student list
- ✅ "Student List" menu item in teacher sidebar (when group selected)

**Frontend — UX:**
- ✅ When changing group in sidebar, page automatically reloads with new group data (Journal/Lessons, Student List, Attendance, Grades, Games)

---

## [1.0.5] - 2026-02-23

### 🎉 Added BridgeCore Branding

- ✅ Updated README.md with BridgeCore SYSTEMS information
- ✅ Added "About Developer" section with contact details
- ✅ Updated "Team" section with bridgecore.tech link
- ✅ Updated copyright in license

### 📦 New Files

- ✅ `.env.example` - environment variable template with detailed comments
- ✅ `QUICKSTART.md` - quick start guide
- ✅ `CHANGELOG.md` - project change history

### 🔧 Improved Scripts (package.json)

**Root package.json:**
- ✅ `dev` - concurrent backend + frontend launch
- ✅ `dev:backend` - backend only
- ✅ `dev:frontend` - frontend only
- ✅ `build` - build entire project
- ✅ `db:*` - database migration commands
- ✅ `typecheck` - type checking
- ✅ `lint` - code linting
- ✅ `format` - code formatting (Prettier)
- ✅ `clean` - node_modules cleanup

**Backend package.json:**
- ✅ `build` - backend build
- ✅ `start` - backend start
- ✅ `typecheck` - type checking
- ✅ `test` - tests (Bun.test)

**Frontend package.json:**
- ✅ `typecheck` - type checking (Nuxt)
- ✅ `lint` - ESLint

### 📚 Updated README.md

- ✅ Added technology badges
- ✅ Detailed architecture section
- ✅ Backend routes structure
- ✅ Frontend pages structure
- ✅ Roles and access table
- ✅ Code examples (Eden Treaty)
- ✅ Troubleshooting section
- ✅ Roadmap

### 🎯 Technical Improvements

- ✅ Installed `concurrently` for parallel execution
- ✅ Installed `prettier` for formatting
- ✅ Added `.env.example` with comments
- ✅ All `.gitignore` files verified and up to date

---

## [1.0.4] - 2026-02-XX

### 👨‍🏫 Teacher Cabinet Enhancements

**Backend:**
- ✅ Teacher cabinet routes refactored
- ✅ Schedule API with group filtering
- ✅ Student performance tracking

**Frontend:**
- ✅ Teacher dashboard with course overview
- ✅ Schedule page with lesson management
- ✅ Student grading interface

---

## [1.0.3] - 2026-02-XX

### 💼 Accountant Module

**Backend:**
- ✅ Accountant role added
- ✅ Payment management API
- ✅ Transaction tracking
- ✅ Financial reports

**Frontend:**
- ✅ Accountant cabinet dashboard
- ✅ Payment processing interface
- ✅ Student balance management
- ✅ Financial reports view

---

## [1.0.2] - 2026-02-XX

### 📞 Sales/CRM Module

**Backend:**
- ✅ Sales module for call management
- ✅ Lead tracking
- ✅ Call history logging
- ✅ Manager performance metrics

**Frontend:**
- ✅ Sales dashboard
- ✅ Call management interface
- ✅ Lead tracking page

---

## [1.0.1] - 2026-02-XX

### 🎮 Gamification System

**Backend:**
- ✅ Gems currency system
- ✅ Achievements framework
- ✅ Educational games API
- ✅ Leaderboard calculations

**Frontend:**
- ✅ Student gamification dashboard
- ✅ Games page (Matching, Sprint, Memory)
- ✅ Achievements showcase
- ✅ Leaderboard view

---

## [1.0.0] - 2026-01-XX

### 🚀 Initial Release

**Core Features:**
- ✅ Backend: Elysia.js + Drizzle ORM + Lucia Auth
- ✅ Frontend: Nuxt 3 + TypeScript + Eden Treaty
- ✅ Database: PostgreSQL
- ✅ Authentication: Session-based (Lucia)
- ✅ Role system: SUPERUSER, DIRECTOR, HEAD_TEACHER, TEACHER, STUDENT, PARENT
- ✅ Multi-school support
- ✅ Course and group management
- ✅ Lesson scheduling
- ✅ Grade tracking
- ✅ Payment processing
- ✅ RFID attendance tracking
- ✅ WebSocket real-time notifications
- ✅ Gamification (gems, achievements)
- ✅ Multi-language support (TM/RU/EN)

**Admin Panel:**
- ✅ User management (CRUD)
- ✅ School management
- ✅ Course categories management
- ✅ Landing page content management
- ✅ System changelog

**User Cabinets:**
- ✅ Student cabinet (courses, schedule, grades, balance)
- ✅ Teacher cabinet (groups, lessons, students, grading)
- ✅ Head teacher cabinet (teacher oversight)
- ✅ Parent cabinet (child monitoring)

---

## Version History Summary

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0.6 | 2026-02-27 | Teacher cabinet improvements |
| 1.0.5 | 2026-02-23 | BridgeCore branding, documentation |
| 1.0.4 | 2026-02-XX | Teacher cabinet enhancements |
| 1.0.3 | 2026-02-XX | Accountant module |
| 1.0.2 | 2026-02-XX | Sales/CRM module |
| 1.0.1 | 2026-02-XX | Gamification system |
| 1.0.0 | 2026-01-XX | Initial release |

---

<div align="center">

**Developed by:** BridgeCore SYSTEMS  
**CEO & Founder:** Batyr Akmuradov  
**Website:** [bridgecore.tech](https://bridgecore.tech)

[Back to README](./README.md)

</div>
