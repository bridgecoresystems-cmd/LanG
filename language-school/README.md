# 🎓 Language School Management System

**Enterprise-grade platform for language school management**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-white?logo=bun)](https://bun.com/)
[![Elysia](https://img.shields.io/badge/Elysia-1.3-red?logo=elysia)](https://elysiajs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.0-green?logo=nuxt.js)](https://nuxt.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-orange?logo=drizzle)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Auth-black)](https://better-auth.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)](https://www.postgresql.org/)

---

## 🏢 Developer Information

**Developed by:** [BridgeCore SYSTEMS](https://bridgecore.tech)  
**CEO & Founder:** Batyr Akmuradov  
**Experience:** 10+ years in ERP system development  
**Location:** Turkmenistan 🇹🇲

| Metric | Value |
|--------|-------|
| Completed Projects | 10+ |
| Satisfied Clients | 5+ |
| Success Rate | 99% |
| Specialization | ERP systems for business |

**Technology Stack:** TypeScript, Bun, Elysia.js, Drizzle ORM, Better Auth, Nuxt 3, Capacitor

---

## 📖 Project Overview

**Language School** is a full-featured management system designed for language schools with support for:

- 👥 **User Management** (students, teachers, administrators, directors)
- 🏫 **Multi-School Support** (single system for multiple branches/locations)
- 📚 **Course & Category Management** (with multi-language support TM/RU/EN)
- 📊 **Student Cabinet** (academic performance, attendance, balance tracking)
- 👨‍🏫 **Teacher Cabinet** (lesson planning, student lists, grade management)
- 💼 **Accountant Cabinet** (payment processing, financial reports)
- 🔐 **Role-Based Access Control** (SUPERUSER, DIRECTOR, HEAD_TEACHER, TEACHER, STUDENT, PARENT, ACCOUNTANT)
- 💳 **Sales & Payments** (payment tracking, discounts, tariffs)
- 📱 **WebSocket Real-time** (live notifications)
- 🎮 **Gamification** (gems, achievements, educational games)
- 📞 **CRM/Sales Module** (call management for sales managers)
- 📡 **RFID Integration** (attendance tracking via RFID bracelets)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Language School Monorepo                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐    │
│  │      packages/frontend      │    │      packages/backend       │    │
│  │                             │    │                             │    │
│  │  Nuxt 3 Application         │    │  Elysia.js API Server       │    │
│  │  ├─ Admin Panel (Quasar)    │◄──►│  ├─ REST API                │    │
│  │  ├─ Student Cabinet         │    │  ├─ WebSocket Server        │    │
│  │  ├─ Teacher Cabinet         │    │  ├─ Better Auth             │    │
│  │  └─ Accountant Cabinet      │    │  └─ Drizzle ORM             │    │
│  │                             │    │                             │    │
│  │  Technologies:              │    │  Technologies:              │    │
│  │  • Vue 3 + TypeScript       │    │  • Bun Runtime              │    │
│  │  • Naive UI / Quasar        │    │  • PostgreSQL               │    │
│  │  • Pinia State Management   │    │  • Eden Treaty (type-safe)  │    │
│  │  • Eden Treaty Client       │    │                             │    │
│  └─────────────────────────────┘    └─────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    packages/shared (planned)                     │   │
│  │                    • Shared types & utilities                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │      PostgreSQL DB       │
                    │  ┌────────────────────┐  │
                    │  │ • users & sessions │  │
                    │  │ • schools          │  │
                    │  │ • courses & groups │  │
                    │  │ • lessons & grades │  │
                    │  │ • payments         │  │
                    │  │ • RFID logs        │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
```

---

## 🚀 Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.3+ | JavaScript runtime (fast, native TypeScript) |
| **Elysia.js** | 1.3+ | HTTP framework (fast, type-safe) |
| **Drizzle ORM** | 0.45+ | TypeScript ORM for PostgreSQL |
| **Better Auth** | 1.5+ | Authentication & session management |
| **PostgreSQL** | 14+ | Primary database |
| **Eden Treaty** | 1.4+ | Type-safe API client |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nuxt 3** | 3.x | Vue.js framework (SSR/SSG) |
| **Vue 3** | 3.x | UI framework (Composition API) |
| **TypeScript** | 5.x | Static type checking |
| **Pinia** | 2.2+ | State management |
| **Naive UI** | 2.38+ | UI components (student/teacher cabinets) |
| **Quasar** | 2.18+ | UI framework (admin panel) |
| **TailwindCSS** | 3.4+ | Utility-first CSS |
| **Vue I18n** | 9.x | Internationalization |
| **Eden Treaty** | 1.4+ | Type-safe API client |

---

## 📦 Installation

### Prerequisites

- **Bun** ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js** ≥ 22.12 (for frontend dev server)
- **PostgreSQL** ≥ 14

### 1. Clone Repository

```bash
git clone <repository-url>
cd language-school
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/language_school

# Backend
PORT=8010
NODE_ENV=development
BETTER_AUTH_SECRET=your-secret-key-here
API_URL=http://localhost:8010

# Frontend
NUXT_PUBLIC_API_BASE=http://localhost:8010

# Optional
TRUSTED_ORIGINS=http://localhost:3000,http://localhost:8010
```

> 💡 **Tip:** Copy `.env.example` (if available) and fill in the values.

### 4. Database Setup

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Or push schema (for development)
bun run db:push
```

### 5. Seed Data (Optional)

```bash
cd packages/backend
bun run seed.ts
```

---

## 🎯 Running the Project

### Option 1: Concurrent Launch (Recommended)

```bash
# From project root - launches both backend and frontend
bun run dev
```

### Option 2: Separate Launch

**Terminal 1 - Backend:**
```bash
cd packages/backend
bun run dev
# → http://localhost:8010
# → Swagger: http://localhost:8010/swagger
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
bun run dev
# → http://localhost:3000
```

---

## 📁 Project Structure

### Monorepo Layout

```
language-school/
├── packages/
│   ├── backend/              # Elysia.js API server
│   │   ├── src/
│   │   │   ├── auth/         # Better Auth configuration
│   │   │   ├── db/           # Drizzle ORM + database schema
│   │   │   ├── routes/       # API endpoints
│   │   │   │   ├── admin/    # Admin panel APIs
│   │   │   │   ├── cabinet/  # User cabinet APIs
│   │   │   │   └── ...
│   │   │   ├── models/       # Business logic
│   │   │   ├── services/     # External services
│   │   │   └── ws/           # WebSocket handlers
│   │   ├── drizzle/          # Database migrations
│   │   ├── public/           # Static files
│   │   └── scripts/          # Utility scripts
│   │
│   └── frontend/             # Nuxt 3 application
│       ├── components/       # Vue components
│       ├── composables/      # Composable functions (Eden Treaty)
│       ├── layouts/          # Layout components
│       ├── middleware/       # Route middleware
│       ├── pages/
│       │   ├── admin/        # Admin panel (Quasar)
│       │   ├── cabinet/      # User cabinets (Naive UI)
│       │   └── landing/      # Public pages
│       ├── stores/           # Pinia stores
│       ├── i18n/             # Internationalization
│       └── types/            # TypeScript types
│
├── docs/                     # Documentation
├── .env.example              # Environment template
├── package.json              # Workspace root
└── tsconfig.json             # TypeScript config
```

### Backend API Routes

```
packages/backend/src/routes/
├── auth.ts               # /api/v1/auth - Authentication endpoints
├── landing.ts            # /api/v1/landing - Public data (categories, courses)
├── users.ts              # /api/v1/users - User management
├── rfid.ts               # /api/v1/rfid - RFID attendance tracking
├── upload.ts             # /api/v1/upload - File uploads
├── ws.ts                 # WebSocket for real-time notifications
├── admin/
│   ├── index.ts          # /api/v1/admin - Admin dashboard
│   ├── landing/
│   │   ├── categories.ts     # Course categories CRUD
│   │   ├── subcategories.ts  # Subcategories CRUD
│   │   └── courses.ts        # Courses CRUD
│   ├── users/
│   │   ├── index.ts          # User list
│   │   ├── [id].ts           # User profile
│   │   └── roles.ts          # Role management
│   ├── changelog.ts      # System changelog
│   ├── profile.ts        # Admin profile
│   ├── sales.ts          # Sales & CRM module
│   ├── schools.ts        # School management
│   └── teachers.ts       # Teacher management
└── cabinet/
    ├── index.ts          # /api/v1/cabinet - Dashboard
    ├── schedule.ts       # Schedule management
    ├── student/          # Student-specific endpoints
    ├── teacher/          # Teacher-specific endpoints
    ├── head-teacher/     # Head teacher endpoints
    └── accountant/       # Accountant endpoints
```

### Frontend Pages

```
packages/frontend/pages/
├── landing/              # Public pages
│   ├── index.vue         # Homepage
│   ├── courses.vue       # Course catalog
│   ├── contact.vue       # Contact form
│   └── login.vue         # Login page
│
├── admin/                # Admin panel (Quasar UI)
│   ├── index.vue         # Dashboard
│   ├── users/            # User management
│   ├── landing/          # Landing page content
│   │   ├── categories/
│   │   ├── subcategories/
│   │   └── courses/
│   ├── changelogs/       # System changelog
│   ├── sales/            # Sales/CRM module
│   ├── schools/          # School management
│   └── profile.vue       # Admin profile
│
├── cabinet/              # User cabinets (Naive UI)
│   ├── index.vue         # Dashboard
│   ├── profile.vue       # User profile
│   ├── schedule.vue      # Schedule
│   ├── student/          # Student cabinet
│   ├── teacher/          # Teacher cabinet
│   ├── head-teacher/     # Head teacher cabinet
│   └── accountant/       # Accountant cabinet
```

---

## 🔐 Role-Based Access Control (RBAC)

### Primary Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **SUPERUSER** | System administrator | Full access to all endpoints |
| **DIRECTOR** | School director | Manage own school |
| **HEAD_TEACHER** | Head teacher / Academic director | Teachers + students management |
| **TEACHER** | Teacher | Own groups + grades |
| **STUDENT** | Student | Personal cabinet |
| **PARENT** | Parent | Child's cabinet |
| **ACCOUNTANT** | Accountant | Payments + financial reports |

### Additional Roles (Many-to-Many)

Users can have multiple roles through the `user_role` table:
- Primary role: `users.role`
- Additional roles: `user_role.role[]`

### School-Based Access

- Users are linked to schools via `users.school_id` (primary) and `user_school` (additional)
- Accountants can view all schools with `can_view_all_schools` flag
- Directors and Head Teachers are scoped to their assigned schools

---

## 🌐 Internationalization (i18n)

Support for three languages:

- 🇹🇲 **TM** - Turkmen
- 🇷🇺 **RU** - Russian
- 🇬🇧 **EN** - English

All entities with names store translations:

```typescript
{
  name_tm: "Diller mekdebi",
  name_ru: "Языковая школа",
  name_en: "Language school"
}
```

---

## 🎮 Gamification System

Student motivation system:

- 💎 **Gems** - Internal currency (earned for attendance, achievements)
- 🏆 **Achievements** - Rewards for progress milestones
- 🎯 **Educational Games** - Matching, Sprint, Memory games
- 📊 **Leaderboard** - Student ranking table

---

## 📊 API Documentation

### Swagger UI

After starting the backend, open:
```
http://localhost:8010/swagger
```

### Type-Safe Client (Eden Treaty)

Frontend uses type-safe Eden Treaty client:

```typescript
// composables/useAdminCategories.ts
const api = useEden()

const getAll = async () => {
  const { data, error } = await api.api.v1.admin.categories.get()
  if (error) throw error
  return data
}

const create = async (category: CreateCategoryDto) => {
  const { data, error } = await api.api.v1.admin.categories.post(category)
  if (error) throw error
  return data
}
```

**Benefits:**
- ✅ Full type safety (IDE autocomplete)
- ✅ Compile-time type checking
- ✅ No magic strings (URLs, methods)
- ✅ Automatic request/response typing

---

## 🧪 Testing

### Backend

```bash
cd packages/backend
bun test
```

### Frontend

```bash
cd packages/frontend
bun run lint
bun run typecheck
```

---

## 📝 Database Migrations

### Create New Migration

```bash
cd packages/backend
bun run db:generate
```

### Apply Migrations

```bash
bun run db:migrate
```

### Push Schema (Development)

```bash
bun run db:push
```

### Drizzle Studio (Database GUI)

```bash
bun run db:studio
# → Opens at http://localhost:3000
```

---

## 🔧 Useful Commands

### Root Level

| Command | Description |
|---------|-------------|
| `bun run dev` | Start backend + frontend concurrently |
| `bun run dev:backend` | Start only backend |
| `bun run dev:frontend` | Start only frontend |
| `bun run build` | Build both projects |
| `bun run db:generate` | Generate database migrations |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push schema (dev only) |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | Lint frontend code |
| `bun run format` | Format code (Prettier) |

### Backend

```bash
cd packages/backend
bun run dev          # Dev server (watch mode)
bun run build        # Production build
bun run start        # Start production server
bun run seed.ts      # Seed database
```

### Frontend

```bash
cd packages/frontend
bun run dev      # Dev server
bun run build    # Production build
bun run generate # SSR generation
bun run preview  # Preview production
```

---

## 🐛 Troubleshooting

### Error: `crypto.hash is not a function`

**Problem:** Node.js < 21.7 doesn't support `crypto.hash()`

**Solution:**
```bash
nvm install 22 && nvm use 22
```

### Error: CORS on Frontend

**Problem:** Backend not configured for CORS

**Solution:** Check `packages/backend/src/index.ts`:
```typescript
.use(cors({
  origin: true,
  credentials: true,
  preflight: true,
}))
```

### Error: 401 Unauthorized

**Problem:** No session or expired

**Solution:**
1. Check browser cookies
2. Re-login
3. Verify Better Auth configuration

### Error: Database Connection Failed

**Problem:** Incorrect DATABASE_URL

**Solution:** Verify connection string in `.env`:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/language_school
```

---

## 📚 Documentation

### For Developers

- [📖 QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [🏗 ARCHITECTURE.md](./ARCHITECTURE.md) - Technical deep dive
- [📝 CHANGELOG.md](./CHANGELOG.md) - Version history
- [🔧 EDEN_TREATY_MIGRATION.md](./EDEN_TREATY_MIGRATION.md) - Eden Treaty migration guide
- [📐 docs/DECISIONS.md](./docs/DECISIONS.md) - Architecture Decision Records
- [📝 docs/COMMIT_HISTORY_CLEANUP.md](./docs/COMMIT_HISTORY_CLEANUP.md) - Git commit standardization guide
- [📝 COMMIT_CONVENTIONS.md](./COMMIT_CONVENTIONS.md) - Commit message format guide

### For Employers & Recruiters

- [👨‍💻 docs/PORTFOLIO_GUIDE.md](./docs/PORTFOLIO_GUIDE.md) - **Start here for project evaluation**
- [📊 docs/DECISIONS.md](./docs/DECISIONS.md) - Architecture decisions and reasoning
- [📈 CHANGELOG.md](./CHANGELOG.md) - Development timeline and features
- [🔍 docs/COMMIT_HISTORY_CLEANUP.md](./docs/COMMIT_HISTORY_CLEANUP.md) - Git history analysis guide

---

## 👥 Team

- **Developer:** BridgeCore SYSTEMS
- **CEO & Founder:** Batyr Akmuradov
- **Stack:** Qwen Code + Cursor Pro (AI-assisted development)
- **Website:** [bridgecore.tech](https://bridgecore.tech)
- **Email:** info@bridgecore.tech

---

## 📄 License

© 2026 BridgeCore SYSTEMS. All rights reserved.

---

## 🚀 Roadmap

- [ ] Mobile application (React Native / Flutter)
- [ ] Telegram bot for notifications
- [ ] Payment gateway integration
- [ ] Excel/PDF report exports
- [ ] Email campaigns
- [ ] Event calendar
- [ ] Material library
- [ ] Parent-teacher messaging
- [ ] Homework submission system
- [ ] Video lesson integration

---

<div align="center">

**Made with ❤️ using Bun + Elysia + Nuxt**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
