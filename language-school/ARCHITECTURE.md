# 🏗 Architecture Documentation

**Language School Management System** - Technical Deep Dive

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [API Design](#api-design)
6. [Security](#security)
7. [Performance](#performance)
8. [Deployment](#deployment)

---

## 🎯 System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Client Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Admin Panel  │  │ User Cabinet │  │ Landing Page │              │
│  │  (Quasar)    │  │ (Naive UI)   │  │   (Public)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┼──────────────────┘                      │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API Gateway                                │
│                        (Elysia.js Server)                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Middleware Layer                          │   │
│  │  • CORS • Authentication • Rate Limiting • Logging          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Route Handlers                          │   │
│  │  /admin • /cabinet • /auth • /api • /ws                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Business Logic Layer                       │   │
│  │  Services • Models • Validators • Utils                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Data Access Layer                         │   │
│  │              Drizzle ORM + PostgreSQL                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Users   │ │ Schools  │ │ Courses  │ │ Payments │              │
│  │ Sessions │ │ Groups   │ │ Lessons  │ │   CRM    │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
language-school/
├── packages/
│   ├── backend/           # Elysia.js API server (Bun runtime)
│   │   ├── src/
│   │   │   ├── auth/      # Better Auth configuration
│   │   │   ├── db/        # Drizzle schema & migrations
│   │   │   ├── routes/    # API endpoints (REST + WebSocket)
│   │   │   ├── models/    # Business logic
│   │   │   ├── services/  # External integrations
│   │   │   └── ws/        # WebSocket handlers
│   │   ├── drizzle/       # Migration files
│   │   └── public/        # Static assets
│   │
│   └── frontend/          # Nuxt 3 application
│       ├── components/    # Vue 3 components
│       ├── composables/   # Eden Treaty clients
│       ├── layouts/       # App layouts
│       ├── middleware/    # Route guards
│       ├── pages/         # Route pages
│       ├── stores/        # Pinia stores
│       └── i18n/          # Translations
│
└── docs/                  # Documentation
```

---

## 🏛 Architecture Patterns

### 1. Layered Architecture

The system follows a **clean layered architecture**:

| Layer | Responsibility | Technologies |
|-------|---------------|--------------|
| **Presentation** | UI, user interaction | Nuxt 3, Vue 3, Quasar, Naive UI |
| **API Gateway** | HTTP handling, routing | Elysia.js, Eden Treaty |
| **Business Logic** | Domain rules, validation | TypeScript classes/functions |
| **Data Access** | Database operations | Drizzle ORM |
| **Database** | Data persistence | PostgreSQL |

### 2. Repository Pattern (Partial)

Database operations are encapsulated in dedicated modules:

```typescript
// packages/backend/src/db/schema.ts
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  // ...
});

// packages/backend/src/models/user.ts
export class UserModel {
  static async findById(id: string) {
    return db.select().from(users).where(eq(users.id, id)).limit(1);
  }
  
  static async create(data: CreateUserDTO) {
    return db.insert(users).values(data).returning();
  }
}
```

### 3. Dependency Injection (Manual)

Dependencies are passed through context:

```typescript
// packages/backend/src/index.ts
app.derive(async ({ request }) => {
  const user = await validateSession(request);
  return { user, db };
});
```

### 4. Event-Driven Architecture (WebSocket)

Real-time notifications via WebSocket:

```typescript
// packages/backend/src/ws/contact-broadcast.ts
export function broadcastToAdmins(data: ContactFormMessage) {
  adminClients.forEach(client => {
    client.send(JSON.stringify(data));
  });
}
```

---

## 🗄 Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
├─────────────────────────────────────────────────────────────────┤
│ id (PK) │ username │ email │ role │ school_id │ password_hash  │
│ first_name │ last_name │ phone │ rfid_uid │ is_active          │
│ can_export_excel │ can_view_all_schools │ parent_id            │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    SESSIONS     │ │   USER_ROLES    │ │   USER_SCHOOLS  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ user_id (FK)    │ │ user_id (FK)    │
│ user_id (FK)    │ │ role            │ │ school_id (FK)  │
│ token (UNIQUE)  │ └─────────────────┘ └─────────────────┘
│ expires_at      │
│ ip_address      │
│ user_agent      │
└─────────────────┘
```

### School Management

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCHOOLS                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK) │ name_tm │ name_ru │ name_en │ address │ phone        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        COURSES                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK) │ school_id (FK) │ name_* │ level │ min_age │ max_age  │
│ tariff_price │ student_discount │ is_active                     │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COURSE_GROUPS                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK) │ course_id (FK) │ name │ teacher_id (FK) │ schedule   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LESSONS                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK) │ group_id (FK) │ date │ time │ lesson_plan │ notes    │
│ is_completed │ homework                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Tables (Better Auth)

```sql
-- Users table (extended for Better Auth)
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT,
  role TEXT NOT NULL,
  -- Better Auth required fields
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth Accounts (for social login)
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verifications (for email/phone verification)
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Authentication Flow

### Better Auth Implementation

#### 1. Configuration

```typescript
// packages/backend/src/auth/index.ts
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 8010}`,
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  
  user: {
    fields: {
      name: "username",
      image: "avatar",
      emailVerified: "email_verified",
    },
    additionalFields: {
      role: { type: "string", defaultValue: "student" },
      // ... custom fields
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,      // refresh if older than 1 day
  },
  
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8010",
    ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []),
  ],
});
```

#### 2. Session Creation Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Client  │      │  API    │      │  Auth   │      │   DB    │
└────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
     │                │                │                │
     │ POST /login    │                │                │
     │ {username,     │                │                │
     │  password}     │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Validate user  │                │
     │                │ credentials    │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ SELECT user    │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ user data      │
     │                │                │<───────────────│
     │                │                │                │
     │                │ Verify password│                │
     │                │ (bcrypt)       │                │
     │                │                │                │
     │                │ Create session │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ INSERT session │
     │                │                │───────────────>│
     │                │                │                │
     │                │ Set-Cookie:    │                │
     │                │ better-auth    │                │
     │                │ .session_token │                │
     │<───────────────│                │                │
     │                │                │                │
     │ Session cookie │                │                │
     │ stored         │                │                │
     │                │                │                │
```

#### 3. Session Validation Middleware

```typescript
// packages/backend/src/index.ts
.derive(async ({ request, set }) => {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  
  // Extract session token from cookie
  const token = cookieHeader.match(/better-auth\.session_token=([^;]+)/)?.[1];
  if (!token) {
    return { user: null, session: null };
  }
  
  // Validate session against database
  const now = new Date();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);
  
  if (!session) {
    // Clear expired cookie
    set.headers["Set-Cookie"] = `better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
    return { user: null, session: null };
  }
  
  // Fetch user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  
  return { user, session };
});
```

#### 4. Frontend Integration (Eden Treaty)

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const api = useEden();
  
  const login = async (username: string, password: string) => {
    const { data, error } = await api.api.v1.auth.login.post({
      username,
      password,
    });
    
    if (error) throw error;
    return data;
  };
  
  const logout = async () => {
    const { data } = await api.api.v1.auth.logout.post({});
    return data;
  };
  
  const getCurrentUser = async () => {
    const { data } = await api.api.v1.me.get();
    return data;
  };
  
  return { login, logout, getCurrentUser };
};
```

---

## 🌐 API Design

### RESTful Principles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users` | List users (paginated) |
| `GET` | `/api/v1/users/:id` | Get user by ID |
| `POST` | `/api/v1/users` | Create user |
| `PATCH` | `/api/v1/users/:id` | Update user |
| `DELETE` | `/api/v1/users/:id` | Delete user |

### Response Format

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// Error response
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found"
  }
}
```

### Eden Treaty Type Safety

```typescript
// packages/backend/src/index.ts
const app = new Elysia()
  .use(swagger())
  .group("/api/v1", (app) =>
    app
      .get("/users", ({ query }) => getUsers(query))
      .post("/users", ({ body }) => createUser(body))
  );

export type AppType = typeof app;

// packages/frontend/composables/useEden.ts
import type { AppType } from '@repo/backend';
import { treaty } from '@elysiajs/eden';

export const useEden = () => {
  const config = useRuntimeConfig();
  return treaty<AppType>(config.public.apiBase);
};

// Usage - fully type-safe!
const api = useEden();
const { data, error } = await api.api.v1.users.get();
// data is typed based on backend response
```

---

## 🔒 Security

### Authentication Security

1. **Password Hashing**: bcrypt with salt rounds
2. **Session Tokens**: Cryptographically secure random tokens (32 bytes)
3. **HttpOnly Cookies**: Prevent XSS attacks
4. **SameSite=Lax**: CSRF protection
5. **Secure Flag**: In production (HTTPS only)

### Authorization (RBAC)

```typescript
// Middleware for role-based access control
const requireRole = (...roles: string[]) => {
  return async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    
    if (!roles.includes(user.role)) {
      set.status = 403;
      return { error: "Forbidden" };
    }
  };
};

// Usage
app.get("/admin/users", 
  { beforeHandle: requireRole("SUPERUSER", "ADMIN") },
  async () => { /* ... */ }
);
```

### School-Based Isolation

```typescript
// Users can only access data from their school
const getSchoolScopedData = async (userId: string) => {
  const [user] = await db
    .select({ schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId));
  
  return db
    .select()
    .from(courses)
    .where(eq(courses.schoolId, user.schoolId));
};
```

### Input Validation

```typescript
// Using Elysia's built-in validation
.post("/users", ({ body }) => createUser(body), {
  body: t.Object({
    username: t.String({ minLength: 3, maxLength: 50 }),
    email: t.Optional(t.String({ format: "email" })),
    password: t.String({ minLength: 8 }),
    role: t.Enum(ROLES),
  }),
});
```

---

## ⚡ Performance Optimizations

### 1. Database Indexing

```sql
-- Frequently queried columns
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_courses_school_id ON courses(school_id);
CREATE INDEX idx_lessons_group_id ON lessons(group_id);
```

### 2. Connection Pooling

PostgreSQL connection pooling via connection string:

```typescript
const db = drizzle(process.env.DATABASE_URL, {
  logger: process.env.NODE_ENV === "development",
});
```

### 3. Bun Runtime Benefits

- **Native TypeScript**: No transpilation overhead
- **Fast startup**: ~3x faster than Node.js
- **Built-in bundler**: No webpack/esbuild needed
- **Native HTTP server**: No Express/Fastify overhead

### 4. Frontend Optimizations

- **Nuxt SSR**: Server-side rendering for SEO
- **Lazy loading**: Routes loaded on demand
- **Tree shaking**: Unused code eliminated
- **Eden Treaty**: Type-safe, no runtime overhead

---

## 🚀 Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Backend
PORT=8010
NODE_ENV=production
BETTER_AUTH_SECRET=<32+ random characters>
API_URL=https://api.yourschool.com

# Frontend
NUXT_PUBLIC_API_BASE=https://api.yourschool.com

# Security
TRUSTED_ORIGINS=https://app.yourschool.com,https://admin.yourschool.com
```

### Docker Deployment (Future)

```dockerfile
# Dockerfile.backend
FROM oven/bun:1.3
WORKDIR /app
COPY packages/backend .
RUN bun install --production
EXPOSE 8010
CMD ["bun", "run", "src/index.ts"]
```

### Health Checks

```typescript
// Health check endpoint
app.get("/health", async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "healthy", database: "connected" };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
});
```

---

## 📊 Monitoring & Logging

### Structured Logging

```typescript
// Consistent log format
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: "info",
  module: "auth",
  action: "login",
  userId: user.id,
  success: true,
}));
```

### Error Tracking

- Frontend errors: Sentry (planned)
- Backend errors: Custom logging + file rotation
- Database errors: PostgreSQL logs

---

<div align="center">

**Last Updated:** 2026-03-01

**Maintained by:** BridgeCore SYSTEMS

</div>
