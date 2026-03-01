# 📐 Architecture Decision Records (ADRs)

**Language School Management System**

This document records significant architectural decisions made during the development of the Language School Management System.

---

## Table of Contents

1. [Use Bun Runtime Instead of Node.js](#adr-001-use-bun-runtime-instead-of-nodejs)
2. [Choose Better Auth Over Lucia Auth](#adr-002-choose-better-auth-over-lucia-auth)
3. [Use Eden Treaty for Type-Safe API Communication](#adr-003-use-eden-treaty-for-type-safe-api-communication)
4. [Monorepo Structure with pnpm Workspaces](#adr-004-monorepo-structure-with-pnpm-workspaces)
5. [Choose Drizzle ORM Over Prisma](#adr-005-choose-drizzle-orm-over-prisma)
6. [Session-Based Authentication Over JWT](#adr-006-session-based-authentication-over-jwt)
7. [Multi-School Architecture with Row-Level Security](#adr-007-multi-school-architecture-with-row-level-security)

---

## ADR-001: Use Bun Runtime Instead of Node.js

**Date:** 2025-12-15
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

We needed a JavaScript runtime for our backend API server. The traditional choice would be Node.js, but we wanted to evaluate alternatives for better performance and developer experience.

### Decision

We chose **Bun** (v1.3+) as our JavaScript runtime instead of Node.js.

### Rationale

| Factor | Bun | Node.js |
|--------|-----|---------|
| Startup Time | ~3x faster | Baseline |
| TypeScript Support | Native (no transpilation) | Requires ts-node/esbuild |
| Package Manager | Built-in (bun install) | npm/pnpm/yarn |
| HTTP Server | Native (fast) | Requires Express/Fastify |
| Memory Usage | Lower | Higher |
| API Compatibility | Node.js compatible | N/A |

**Key Benefits:**
1. **Native TypeScript** - No build step required for development
2. **Faster execution** - Significant performance improvements
3. **All-in-one tool** - Runtime + package manager + bundler
4. **Elysia.js compatibility** - Best performance with Bun

### Consequences

**Positive:**
- Faster development iteration (no transpilation)
- Reduced infrastructure complexity
- Better runtime performance

**Negative:**
- Smaller ecosystem compared to Node.js
- Some npm packages may have compatibility issues
- Less mature debugging tools

### Migration Notes

When migrating from Node.js:
- Replace `package-lock.json` with `bun.lock`
- Use `bun install` instead of `npm install`
- Some Node.js-specific APIs may need polyfills

---

## ADR-002: Choose Better Auth Over Lucia Auth

**Date:** 2026-02-28
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

Our authentication system was built on Lucia Auth v3.2. As the project grew, we needed more features:
- OAuth social login (Google, GitHub)
- Email verification
- Better session management
- More security features

### Decision

Migrate from **Lucia Auth** to **Better Auth** v1.5.0.

### Comparison

| Feature | Lucia Auth | Better Auth |
|---------|------------|-------------|
| Core Auth | ✅ | ✅ |
| Session Management | Basic | Advanced |
| OAuth Providers | Manual setup | Built-in |
| Email Verification | Manual | Built-in |
| Multi-Factor Auth | ❌ | ✅ |
| Organization Support | ❌ | ✅ |
| Plugin System | Limited | Extensive |
| TypeScript Types | Good | Excellent |
| Active Development | ⚠️ Slow | ✅ Active |

### Rationale

1. **Future-proof**: Better Auth is actively maintained with regular updates
2. **Feature-rich**: Built-in OAuth, email verification, MFA
3. **Better DX**: More intuitive API and better documentation
4. **Security**: Regular security audits and updates
5. **Drizzle Integration**: First-class support for Drizzle ORM

### Migration Steps

```typescript
// Before (Lucia)
import { Lucia } from "lucia";
const lucia = new Lucia(adapter, { /* config */ });

// After (Better Auth)
import { betterAuth } from "better-auth";
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: drizzleAdapter(db, { /* config */ }),
  // ... options
});
```

**Schema Changes:**
- Added `accounts` table for OAuth providers
- Added `verifications` table for email/phone verification
- Added `token` column to sessions for better session management
- Added `email_verified`, `updated_at` to users

### Consequences

**Positive:**
- More secure authentication system
- Ready for OAuth integration
- Better session management
- Improved TypeScript support

**Negative:**
- Migration effort (4 hours)
- Breaking changes in session handling
- New environment variable required (`BETTER_AUTH_SECRET`)

### Lessons Learned

- Always check the maintenance status of authentication libraries
- Plan for migration early before the system grows too large
- Keep authentication code modular for easier swaps

---

## ADR-003: Use Eden Treaty for Type-Safe API Communication

**Date:** 2025-11-20
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

Our frontend (Nuxt 3) communicates with backend (Elysia.js) via REST API. Initially, we used native `fetch()` which led to:
- No type safety between frontend and backend
- Magic strings for URLs
- Manual request/response typing
- Runtime errors from typos

### Decision

Use **Eden Treaty** (@elysiajs/eden) for type-safe API communication in our monorepo.

### Comparison

| Approach | Type Safety | DX | Bundle Size |
|----------|-------------|----|-------------|
| Native fetch | ❌ None | Poor | 0 KB |
| Axios + types | ⚠️ Manual | Medium | 13 KB |
| OpenAPI Generator | ✅ Generated | Complex | 20 KB |
| **Eden Treaty** | ✅ **Inferred** | **Excellent** | **2 KB** |

### Implementation

```typescript
// Backend: Define types automatically
const app = new Elysia()
  .get("/users/:id", ({ params }) => getUser(params.id))
  .post("/users", ({ body }) => createUser(body));

export type AppType = typeof app;

// Frontend: Type-safe client
import { treaty } from '@elysiajs/eden';
import type { AppType } from '@repo/backend';

const api = treaty<AppType>('http://localhost:8010');

// Fully typed! IDE autocomplete works!
const { data, error } = await api.api.users[':id'].get({
  params: { id: '123' }
});

// data is typed based on backend response
// error is typed based on backend errors
```

### Benefits

1. **End-to-end Type Safety**: Changes in backend automatically reflected in frontend types
2. **No Magic Strings**: Route paths are type-checked
3. **IDE Support**: Full autocomplete for routes, params, body
4. **Zero Configuration**: No code generation needed
5. **Small Bundle**: Only 2KB gzipped

### Consequences

**Positive:**
- Compile-time error detection
- Better developer experience
- Reduced runtime errors
- Faster development

**Negative:**
- Requires monorepo setup (shared types)
- Tightly coupled frontend/backend
- Learning curve for new developers

### When NOT to Use

- Public APIs (use OpenAPI instead)
- Multi-language projects
- When backend/frontend are separate repositories

---

## ADR-004: Monorepo Structure with pnpm Workspaces

**Date:** 2025-10-01
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

Our project has multiple components:
- Backend API (Elysia.js)
- Frontend Web (Nuxt 3)
- Shared utilities (planned)

We needed to decide between:
- Separate repositories
- Monorepo with shared dependencies

### Decision

Use **monorepo** structure with **pnpm workspaces** (via Bun).

### Structure

```
language-school/
├── packages/
│   ├── backend/
│   └── frontend/
├── package.json          # Workspace root
└── bun.lock              # Single lockfile
```

### Workspace Configuration

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### Benefits

1. **Single Source of Truth**: One lockfile, consistent versions
2. **Shared Dependencies**: No duplicate node_modules
3. **Atomic Commits**: Changes across packages in one commit
4. **Easy Refactoring**: Move code between packages freely
5. **Type Sharing**: Import types directly (`import type { User } from '@repo/backend'`)

### Commands

```bash
# Install all dependencies
bun install

# Run dev server for all packages
bun run dev

# Run only backend
bun run dev:backend

# Run only frontend
bun run dev:frontend
```

### Consequences

**Positive:**
- Faster CI/CD (single build)
- Easier cross-package changes
- Consistent tooling

**Negative:**
- Larger repository size
- More complex initial setup
- All packages versioned together

---

## ADR-005: Choose Drizzle ORM Over Prisma

**Date:** 2025-10-01
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

We needed an ORM for PostgreSQL that works well with Bun and provides TypeScript support.

### Decision

Use **Drizzle ORM** instead of Prisma.

### Comparison

| Factor | Drizzle ORM | Prisma |
|--------|-------------|--------|
| Bundle Size | 7 KB | 500+ KB |
| Startup Time | ~10ms | ~200ms |
| TypeScript | Excellent | Excellent |
| Query Builder | SQL-like | Prisma DSL |
| Migrations | SQL files | Prisma Migrate |
| Bun Support | ✅ Native | ⚠️ Limited |
| Learning Curve | Low (SQL knowledge) | Medium (Prisma DSL) |
| Performance | Faster (raw SQL) | Good (with overhead) |

### Rationale

1. **Bun Compatibility**: Drizzle works natively with Bun runtime
2. **Lightweight**: Much smaller bundle size
3. **SQL-like Syntax**: Easier for developers with SQL knowledge
4. **Type Safety**: Excellent TypeScript inference
5. **Performance**: Closer to raw SQL performance

### Example

```typescript
// Drizzle ORM - SQL-like, type-safe
const usersWithSchools = await db
  .select({
    user: users,
    school: schools,
  })
  .from(users)
  .leftJoin(schools, eq(users.schoolId, schools.id))
  .where(eq(users.role, 'STUDENT'))
  .orderBy(desc(users.createdAt));

// Type inference works automatically
// usersWithSchools is typed as: { user: User; school: School | null }[]
```

### Consequences

**Positive:**
- Better Bun integration
- Faster runtime performance
- Smaller deployment size
- Easier debugging (raw SQL visible)

**Negative:**
- Less abstraction than Prisma
- Need to write SQL-like queries
- Smaller community

---

## ADR-006: Session-Based Authentication Over JWT

**Date:** 2025-10-01
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

We needed to choose between session-based authentication and JWT tokens for our SPA (Single Page Application).

### Decision

Use **session-based authentication** with server-side sessions stored in PostgreSQL.

### Comparison

| Factor | Sessions | JWT |
|--------|----------|-----|
| Revocation | Immediate | Wait for expiry |
| Size | Small (random ID) | Larger (encoded data) |
| Server Load | Database lookup | None (stateless) |
| Security | More control | Token leakage risk |
| Scalability | Requires session store | Easier to scale |

### Rationale

1. **Immediate Revocation**: Can invalidate sessions instantly (important for admin accounts)
2. **Smaller Cookies**: Only session ID, not user data
3. **Better Control**: Server-side session management
4. **Security**: Easier to implement security features (device tracking, IP validation)

### Implementation

```typescript
// Session stored in database
{
  id: "sess_abc123",
  userId: "user_xyz789",
  token: "random_secure_token",
  expiresAt: "2026-04-01T00:00:00Z",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
}

// Cookie contains only session token
Set-Cookie: better-auth.session_token=<token>; HttpOnly; SameSite=Lax
```

### Consequences

**Positive:**
- Immediate session invalidation
- Better security control
- Audit trail (IP, user agent)

**Negative:**
- Database query on every request
- Session storage required
- Slightly more complex setup

---

## ADR-007: Multi-School Architecture with Row-Level Security

**Date:** 2025-11-01
**Status:** Accepted
**Author:** Batyr Akmuradov

### Context

Our system needs to support multiple language schools under a single installation:
- Each school has its own students, teachers, courses
- Some users (accountants, superusers) need cross-school access
- Data isolation is critical for privacy

### Decision

Implement **school-based data isolation** with application-level row security.

### Schema Design

```sql
-- Every user belongs to a primary school
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  role TEXT NOT NULL,
  -- ...
);

-- Users can have additional school associations
CREATE TABLE user_schools (
  user_id TEXT REFERENCES users(id),
  school_id INTEGER REFERENCES schools(id),
  PRIMARY KEY (user_id, school_id)
);

-- All school resources reference school_id
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  -- ...
);
```

### Access Control Logic

```typescript
// Middleware applies school scoping automatically
const getSchoolScopedData = async (user: User) => {
  // Superusers and accountants with can_view_all_schools see everything
  if (user.role === 'SUPERUSER' || user.can_view_all_schools) {
    return db.select().from(courses);
  }
  
  // Regular users see only their school's data
  return db
    .select()
    .from(courses)
    .where(eq(courses.schoolId, user.schoolId));
};
```

### Benefits

1. **Data Isolation**: Schools cannot access each other's data
2. **Flexible Access**: Cross-school access for specific roles
3. **Single Codebase**: No need for separate deployments
4. **Cost Effective**: Shared infrastructure

### Consequences

**Positive:**
- Multi-tenant architecture
- Easy to add new schools
- Centralized management

**Negative:**
- More complex queries
- Need to remember school scoping everywhere
- Potential for bugs if scoping is forgotten

---

## Future Considerations

### ADR-008: Mobile Application Strategy (TBD)

**Status:** Proposed
**Consideration:** React Native vs Flutter vs Capacitor

### ADR-009: Microservices vs Monolith (TBD)

**Status:** Proposed
**Consideration:** When to split monolith into microservices

### ADR-010: Caching Strategy (TBD)

**Status:** Proposed
**Consideration:** Redis vs in-memory caching

---

<div align="center">

**Last Updated:** 2026-03-01

**Maintained by:** BridgeCore SYSTEMS

[Back to README](../README.md) | [Back to ARCHITECTURE](../ARCHITECTURE.md)

</div>
