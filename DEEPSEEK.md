# DeepSeek Agent Instructions

This file extends `AGENTS.md` with DeepSeek-specific behavior.

---

## Read AGENTS.md First

Before any task, read `AGENTS.md` completely. It contains the full architecture rules, security constraints, and coding standards for this project.

---

## Project Context

- **Stack**: NestJS 11 (backend) + Next.js 16 (frontend)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Internationalization**: i18n with `/[lang]` URL routing
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Monorepo**: `backend/` and `frontend/` directories

---

## DeepSeek-Specific Rules

### Code Generation Style

| Aspect             | Preference                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript**     | Strict mode, explicit types, no `any`                                                                                       |
| **NestJS DI**      | Constructor-based injection only                                                                                            |
| **Next.js**        | Server Components by default; `'use client'` only when Framer Motion, `useState`, `useEffect`, or event handlers are needed |
| **Error handling** | Always handle errors — never let uncaught exceptions reach the user                                                         |
| **Async/await**    | Prefer `async/await` over `.then()` chains                                                                                  |
| **Null safety**    | Use optional chaining (`?.`) and nullish coalescing (`??`)                                                                  |

### When to Ask Questions

Ask for clarification when:

- The task is ambiguous or underspecified
- You need to choose between two equally valid approaches
- The change would affect protected files (see section 14 of AGENTS.md)
- You are unsure about the database schema design

### Consistency

Maintain consistency with existing code. Before writing new code:

1. Read at least one existing file in the same directory to match the style
2. Follow the exact same patterns (error handling, logging, DTO structure, etc.)
3. If the existing code uses a pattern you wouldn't choose, follow it anyway unless it violates AGENTS.md rules

### Documentation

- Every public function/class gets a JSDoc comment
- Complex logic gets inline comments explaining WHY (not what)
- README files stay up to date with new features

---

## Quick Reference

```bash
# Backend
cd backend
npm run start:dev            # Development server (watch mode)
npm run start:prod           # Production server
npm run build                # Build for production
npm run format               # Prettier format
npm run lint                 # ESLint check + fix
npm run test                 # Unit tests
npm run test:e2e             # E2e tests
npm run test:cov             # Test coverage
npm run db:migrate:dev       # Create + apply migration
npm run db:migrate:deploy    # Apply pending migrations (production)
npm run db:studio            # Prisma Studio (DB GUI)

# Frontend
cd frontend
npm run dev                  # Development server
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # Lint check
```
