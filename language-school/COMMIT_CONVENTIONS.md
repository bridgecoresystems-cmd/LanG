# 📝 Commit Convention Guide

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

---

## Why Conventional Commits?

1. **Automated Changelog Generation** - Tools can parse commits to generate CHANGELOG.md
2. **Clear History** - Easy to understand what changed and why
3. **Semantic Versioning** - Automatically determine version bumps (major/minor/patch)
4. **Professional Portfolio** - Shows potential employers your development process
5. **Better Code Reviews** - Reviewers understand the scope of changes

---

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Components

1. **Type** (required): What kind of change
2. **Scope** (optional): Which part of the codebase
3. **Description** (required): Short summary (max 72 chars)
4. **Body** (optional): Detailed explanation
5. **Footer** (optional): Breaking changes, issue references

---

## Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `docs` | Documentation only | - |
| `style` | Formatting, no code change | - |
| `refactor` | Code change, no feature/bug | - |
| `perf` | Performance improvement | patch |
| `test` | Adding/updating tests | - |
| `build` | Build system/external deps | - |
| `ci` | CI/CD configuration | - |
| `chore` | Maintenance tasks | - |
| `revert` | Revert previous commit | varies |

---

## Scope Examples

- `auth` - Authentication system
- `api` - Backend API
- `db` - Database/schema
- `frontend` - Nuxt application
- `admin` - Admin panel
- `cabinet` - User cabinets (student/teacher/accountant)
- `sales` - CRM/Sales module
- `landing` - Landing page
- `ws` - WebSocket
- `deps` - Dependencies

---

## Examples

### Feature
```
feat(auth): add OAuth social login support

Add Google and GitHub OAuth providers using Better Auth.

- Configure OAuth providers in Better Auth
- Add accounts table for linked accounts
- Update login page with social login buttons

Closes #123
```

### Bug Fix
```
fix(cabinet): resolve student grade calculation error

Fix incorrect total score calculation when lesson has null grade.

Fixes #456
```

### Refactor
```
refactor(api): migrate from fetch to Eden Treaty

Replace all native fetch calls with type-safe Eden Treaty client
for better type safety and developer experience.

BREAKING CHANGE: API client interface changed from useApi() to useEden()
```

### Documentation
```
docs: add architecture decision records

Create docs/DECISIONS.md with ADRs for:
- Bun runtime choice
- Better Auth migration
- Eden Treaty adoption
```

### Dependencies
```
build(deps): upgrade better-auth to v1.5.0

Update better-auth from v1.4.0 to v1.5.0 for enhanced security
and OAuth support.
```

### Breaking Change
```
refactor(auth): migrate from Lucia to Better Auth

Replace Lucia Auth with Better Auth for improved features and security.

BREAKING CHANGE: Authentication system changed from Lucia to Better Auth.
Migration required:
- Add BETTER_AUTH_SECRET environment variable
- Run database migrations for new tables
- Update login/logout flows

Closes #789
```

---

## Body Guidelines

- Use imperative mood ("add" not "added")
- Wrap at 72 characters
- Explain WHAT and WHY, not HOW
- Include motivation for changes

---

## Footer Guidelines

### Breaking Changes
```
BREAKING CHANGE: <description of breaking change>
<migration instructions>
```

### Issue References
```
Closes #123
Fixes #456
Related to #789
```

### Co-authors
```
Co-authored-by: Name <email@example.com>
```

---

## Git Aliases (Optional)

Add these to your `~/.gitconfig` for easier committing:

```ini
[alias]
  cm = commit -m
  ca = commit --amend
  c = commit
  s = status
  d = diff
  co = checkout
  b = branch
```

Usage:
```bash
git cm "feat(auth): add new feature"
```

---

## Tools

### Commitlint

Validate commit messages:

```bash
# Install
bun add -d @commitlint/cli @commitlint/config-conventional

# Configure (commitlint.config.js)
module.exports = {
  extends: ['@commitlint/config-conventional']
};

# Run
bun exec commitlint --from HEAD~1 --to HEAD --verbose
```

### Commitizen

Interactive commit tool:

```bash
# Install globally
npm install -g commitizen cz-conventional-changelog

# Configure
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# Use
git cz
```

### Standard Version

Automated changelog generation:

```bash
# Install
bun add -d standard-version

# Configure (package.json)
{
  "scripts": {
    "release": "standard-version"
  }
}

# Run
bun run release
```

---

## Migration: Old to New Format

### Before (Russian)
```
feat: добавить новую функцию
```

### After (English)
```
feat(api): add new endpoint for user management
```

### Before (Unclear)
```
fix stuff
```

### After (Clear)
```
fix(cabinet): resolve student list pagination issue
```

### Before (Too Long)
```
added new feature for student cabinet that allows them to view their grades and schedule and also pay for courses online
```

### After (Concise)
```
feat(cabinet): add student dashboard with grades and schedule
```

---

## Best Practices

1. ✅ **Keep commits atomic** - One logical change per commit
2. ✅ **Write clear descriptions** - Explain the purpose
3. ✅ **Use proper grammar** - Imperative mood, no period at end
4. ✅ **Reference issues** - Link to GitHub issues
5. ✅ **Document breaking changes** - Help others migrate
6. ✅ **Review before committing** - `git diff --staged`

---

## Common Mistakes

### ❌ Too Vague
```
fix: fix bug
```

### ✅ Specific
```
fix(auth): resolve session expiration on page refresh
```

### ❌ Too Long
```
feat: add new feature that allows users to reset their password by sending an email with a secure link that expires after 24 hours for security reasons
```

### ✅ Concise
```
feat(auth): add password reset via email
```

### ❌ Wrong Type
```
docs: add new API endpoint
```

### ✅ Correct Type
```
feat(api): add new endpoint for user management
```

---

## For Employers

When reviewing this project's git history, you'll see:

1. **Clear progression** - Each commit tells a story
2. **Professional approach** - Following industry standards
3. **Easy to audit** - Changes are well-documented
4. **Maintainable** - Future developers can understand decisions

### What to Look For

- **Commit frequency** - Shows development pace
- **Commit size** - Indicates thoughtful, atomic changes
- **Type distribution** - Balance of features, fixes, refactors
- **Breaking changes** - How major changes were handled
- **Issue resolution** - Problem-solving approach

---

<div align="center">

**Maintained by:** BridgeCore SYSTEMS  
**Based on:** [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)

[Back to README](./README.md)

</div>
