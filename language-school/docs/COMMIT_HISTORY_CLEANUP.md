# Git Commit History Cleanup Guide

This document helps standardize all commit messages to English following Conventional Commits.

---

## Commit Message Translations

| Old Commit (Russian/Mixed) | New Commit (English Standard) |
|----------------------------|-------------------------------|
| `feat(accounting): продвинутая бухгалтерия LanG School` | `feat(accounting): implement advanced accounting system for LanG School` |
| `feat(language-school): кабинет учителя — уроки, список учеников, авто-переключение группы` | `feat(teacher): add teacher cabinet with lessons, student list, auto-group switching` |
| `fix: исправить редирект после логина и ссылки в navbar` | `fix(auth): resolve redirect after login and navbar links` |
| `docs: обновить README с BridgeCore брендингом и добавить документацию` | `docs: update README with BridgeCore branding and add documentation` |
| `refactoring index.ts w backende` | `refactor(backend): restructure index.ts entry point` |
| `nachali delat stranicy uchiteley i uchenikow` | `feat(frontend): create teacher and student pages` |
| `feat: добавлен модуль Sales для управления звонками менеджеров` | `feat(sales): add CRM module for manager call management` |
| `djag+elysia.js` | `chore: add Elysia.js debugging configuration` |
| `commit perd payments` | `fix(payments): resolve payment processing issues` |

---

## How to Rewrite Commit History

### ⚠️ Warning

**Rewriting git history changes commit hashes!** Only do this:
- ✅ On your local repository before pushing
- ✅ If you haven't shared the repository with others
- ❌ NOT on shared/public branches

### Method 1: Interactive Rebase (Recommended)

```bash
# Start interactive rebase from the commit you want to change
git rebase -i <commit-hash>^

# Example: rebase last 10 commits
git rebase -i HEAD~10
```

This opens your editor with a list like:
```
pick 4e54fa7f commit perd payments
pick df7282bc feat(language-school): кабинет учителя
pick 84e06936 refactoring index.ts w backende
```

Change `pick` to `reword` for commits you want to rename:
```
reword 4e54fa7f commit perd payments
reword df7282bc feat(language-school): кабинет учителя
reword 84e06936 refactoring index.ts w backende
```

Save and close. Git will prompt you for new commit messages.

### Method 2: Git Commit --Amend (Last Commit Only)

```bash
# Change the most recent commit
git commit --amend -m "new commit message"
```

### Method 3: Reset and Re-commit (Destructive)

```bash
# Reset to specific commit (keeps changes unstaged)
git reset --soft <commit-hash>

# Re-commit with proper message
git commit -m "feat(scope): proper message"
```

---

## Standardized Commit Messages (Ready to Use)

### Recent Commits to Rewrite

```bash
# 1. Accounting module
git rebase -i 5dc6d41a^
# Change to: feat(accounting): implement advanced accounting system

# 2. Teacher cabinet
git rebase -i df7282bc^
# Change to: feat(teacher): add lessons, student list, and auto-group switching

# 3. Login redirect fix
git rebase -i 8565bcac^
# Change to: fix(auth): resolve redirect after login and navbar links

# 4. README update
git rebase -i 548aef12^
# Change to: docs: update README with BridgeCore branding

# 5. Backend refactoring
git rebase -i 84e06936^
# Change to: refactor(backend): restructure index.ts entry point

# 6. Teacher/Student pages
git rebase -i 96e076c3^
# Change to: feat(frontend): create teacher and student pages

# 7. Sales module
git rebase -i f76d572a^
# Change to: feat(sales): add CRM module for call management

# 8. Debug config
git rebase -i 66c39b6b^
# Change to: chore: add Elysia.js debugging configuration

# 9. Payment fix
git rebase -i 4e54fa7f^
# Change to: fix(payments): resolve payment processing issues
```

---

## Full Commit History (Standardized)

Here's how your complete history should look:

```
0602241b refactor(auth): migrate from Lucia Auth to Better Auth
d90cea0f feat(accounting): implement advanced accounting system
9e477ada feat(accountant): add head accountant role and transaction management
1a3e5c26 feat(accountant): add professional school-based access control
5dc6d41a feat(accountant): add accountant role and payment management
4e54fa7f fix(payments): resolve payment processing issues
df7282bc feat(teacher): add lessons, student list, and auto-group switching
04d5405a refactor(routes): split cabinet routes and fix teacher layout
9b1d4354 feat(cabinet): add schedule, teacher/student courses, sidebar fixes
66c39b6b chore: add Elysia.js debugging configuration
8565bcac fix(auth): resolve redirect after login and navbar links
548aef12 docs: update README with BridgeCore branding and documentation
84e06936 refactor(backend): restructure index.ts entry point
96e076c3 feat(frontend): create teacher and student pages
40342bc7 feat(rfid): add RFID UID support and refactor cabinet API with Eden Treaty
f76d572a feat(sales): add CRM module for manager call management
5278b3a1 feat(cabinet): migrate to Nuxt UI with modern design
571c7ef6 feat(api): migrate frontend API calls to Eden Treaty
d8d03c17 feat(admin): switch admin auth to Eden and fix session handling
517260cc refactor(admin): restructure routes, schools CRUD, RBAC, fix 403/404
8510944a fix: add placeholder image and increase Node.js memory limit
9bc98f2d feat(admin): add profile and changelog features
ec63050d refactor(categories): restructure categories module
068febb5 chore: initial project setup with flattened language-school
97474419 chore: initial commit - project setup
```

---

## After Rewriting History

### Force Push (If Already on Remote)

```bash
# ⚠️ WARNING: This rewrites remote history
# Only do this if you're the only contributor
git push --force-with-lease origin main
```

### Verify Changes

```bash
# Check new history
git log --oneline -20

# Verify remote is in sync
git status
```

---

## For Future Commits

### Use Proper Format from Now On

```bash
# Good commit messages
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(cabinet): resolve student list pagination"
git commit -m "docs: update API documentation"

# Multi-line commit
git commit -m "feat(api): add new user management endpoint

- Add GET /api/v1/users endpoint
- Add POST /api/v1/users endpoint
- Add user validation middleware
- Include pagination support

Closes #123"
```

### Setup Commit Template (Optional)

Create `.gitmessage` in project root:

```
# <type>(<scope>): <subject>
# |<----  Using a Maximum Of 72 Characters  ---->|


# <body>
# |<----   Try To Limit Each Line To 72 Characters   ---->|


# <footer>
```

Configure git to use it:

```bash
git config commit.template .gitmessage
```

---

## Why This Matters for Employers

When European companies review your GitHub:

1. **Professional Standards** - Shows you follow industry conventions
2. **Clear Communication** - English commits are universally understood
3. **Thoughtful Development** - Well-structured commits indicate careful planning
4. **Maintainability** - Easy to understand project evolution
5. **Team Ready** - Demonstrates you can work in international teams

### What Employers Look For

✅ Consistent commit message format
✅ Clear, descriptive subjects
✅ Atomic commits (one change per commit)
✅ Proper type usage (feat, fix, refactor, docs)
✅ Issue references (Closes #123)
✅ Breaking change documentation

---

## Quick Reference Card

### Commit Types

```
feat     - New feature
fix      - Bug fix
docs     - Documentation
style    - Formatting
refactor - Code restructuring
test     - Tests
chore    - Maintenance
```

### Example Commit

```bash
git commit -m "feat(auth): add two-factor authentication

Implement 2FA using TOTP for enhanced security.

- Add 2FA setup endpoint
- Add QR code generation
- Add verification middleware
- Update login flow

Closes #456
Fixes #789"
```

---

<div align="center">

**Created by:** BridgeCore SYSTEMS  
**For:** Language School Project  
**Date:** 2026-03-01

</div>
