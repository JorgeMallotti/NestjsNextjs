# NestJS + Next.js MVC — Agent Instructions

## Table of Contents

| Sec | Title                                                                             |
| --- | --------------------------------------------------------------------------------- |
| 1   | [Mandatory Reads Before Any Change](#1-mandatory-reads-before-any-change)         |
| 2   | [Architecture Rules (MVC)](#2-architecture-rules-mvc)                             |
| 3   | [Project Structure (Strictly Enforced)](#3-project-structure-strictly-enforced)   |
| 4   | [Module Convention (NestJS)](#4-module-convention-nestjs)                         |
| 5   | [Database Migration Rules](#5-database-migration-rules-strict--never-use-db-push) |
| 6   | [Git Workflow](#6-git-workflow-feat--staging--main)                               |
| 7   | [Styling — Tailwind CSS v4](#7-styling--tailwind-css-v4-exclusive)                |
| 8   | [Internationalization (i18n)](#8-internationalization-i18n--multi-language-ready) |
| 9   | [Animations — Framer Motion](#9-animations--framer-motion-exclusive)              |
| 10  | [Optimistic Updates](#10-optimistic-updates-performance--mandatory)               |
| 11  | [Security Constraints](#11-security-constraints-hard-rules)                       |
| 12  | [Agent Change Protocol](#12-agent-change-protocol)                                |
| 13  | [Coding Standards](#13-coding-standards)                                          |
| 14  | [Protected Files](#14-protected-files-agent-must-not-modify)                      |
| 15  | [Verification Checklist](#15-verification-checklist-agent-self-check)             |

---

## 1. Mandatory Reads Before Any Change

Before writing a single line of code, read:

- This file (`AGENTS.md`)
- If touching database: `prisma/schema.prisma`
- If creating frontend components: existing patterns in `src/components/`
- If modifying an existing module: the full module directory

---

## 2. Architecture Rules (MVC)

This project follows a strict **Model-View-Controller** architecture:

| Layer          | Technology                                | Responsibility                                |
| -------------- | ----------------------------------------- | --------------------------------------------- |
| **Model**      | NestJS (Services, Repositories, Entities) | Business logic, data access, validation       |
| **Controller** | NestJS (Controllers, Guards, Pipes)       | HTTP routing, auth, request/response handling |
| **View**       | Next.js (Pages, Components, Client state) | UI rendering, user interaction, animations    |

**Hard rules:**

- NestJS owns ALL business logic. Next.js NEVER accesses the database directly.
- Next.js is the View layer only — pages and components that consume the NestJS REST API.
- All data flows: `Next.js → fetch() → NestJS API → Database`.
- No business logic leaks into the frontend. The frontend formats data for display only.
- Monorepo structure: `backend/` (NestJS 11) + `frontend/` (Next.js 16). Separate `package.json` files.

---

## 3. Project Structure (Strictly Enforced)

### Backend (`backend/`)

```
src/
├── common/
│   ├── decorators/        # Custom decorators (e.g. @CurrentUser)
│   ├── filters/           # Global exception filters
│   ├── guards/            # Auth guards (JwtAuthGuard, RolesGuard)
│   ├── interceptors/      # Logging, transformation, timing
│   ├── pipes/             # Global validation pipes
│   └── dto/               # Shared DTOs (pagination, filters)
├── modules/
│   └── {name}/
│       ├── dto/            # class-validator DTOs (create, update, query)
│       ├── entities/       # Prisma model mapped types
│       ├── {name}.module.ts
│       ├── {name}.controller.ts
│       ├── {name}.service.ts
│       └── {name}.repository.ts  # (optional, for complex queries)
├── config/                # Configuration modules (env, database)
├── app.module.ts
└── main.ts
```

### Frontend (`frontend/`)

```
src/
├── app/                   # Next.js App Router pages
│   ├── [lang]/            # Dynamic language segment (en, es, pt, etc.)
│   │   ├── layout.tsx     # Language-aware layout (loads strings, sets html lang)
│   │   ├── (auth)/        # Authenticated routes — /[lang]/auth/...
│   │   ├── (public)/      # Public routes — /[lang]/...
│   │   ├── products/
│   │   │   ├── page.tsx       # /[lang]/products
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # /[lang]/products/[slug]
│   │   └── page.tsx       # /[lang] (home page)
│   ├── not-found.tsx      # Global 404
│   └── layout.tsx         # Root layout with AnimatePresence
├── components/
│   ├── ui/                # Primitive UI (Button, Input, Card, Modal, etc.)
│   └── features/          # Feature-specific (ProductCard, LoginForm, Navbar)
├── lib/
│   ├── api/               # Centralized API client + fetch wrappers
│   └── utils/             # Pure helper functions (formatting, dates, etc.)
├── hooks/                 # Custom React hooks (useAuth, useProducts, etc.)
├── strings/               # Language string files (en.ts, es.ts, pt.ts, etc.)
└── types/                 # Shared TypeScript types and interfaces
```

**The agent MUST NOT create files outside this structure.**

---

## 4. Module Convention (NestJS)

Every feature module follows the same pattern:

```typescript
// 1. DTO — defines the API contract
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// 2. Controller — handles HTTP, delegates to service
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}

// 3. Service — business logic
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto) {
    // Business logic here (hashing, validation, etc.)
    return this.usersRepository.create(dto);
  }
}
```

**Rules:**

- Controllers have ZERO business logic. They route and delegate.
- Services contain ALL business logic.
- Repositories (optional) contain complex database queries.
- Every public method must return the created/updated resource — never just an ID.

---

## 5. Database Migration Rules (Strict — Never Use `db push`)

**Schema location:** `backend/prisma/schema.prisma`

```
Edit schema.prisma → migrate dev --name desc → Migration SQL file created → Test locally → Commit to git → migrate deploy on production
```

| Command                            | When to Use           | Creates Migration File?  |
| ---------------------------------- | --------------------- | ------------------------ |
| `prisma migrate dev --name <desc>` | Every schema change   | ✅ Yes — always          |
| `prisma migrate deploy`            | Production/CI only    | ❌ No — applies existing |
| `prisma migrate reset`             | Local dev only        | ❌ No — drops DB         |
| `prisma db push`                   | **NEVER** — forbidden | ❌ No — bypasses history |

**Hard rules:**

- **NEVER** use `prisma db push`. It creates no migration files and destroys history.
- **ALWAYS** use `prisma migrate dev --name <descriptive_name>` for every schema change.
- **EVERY** schema change produces ONE new migration file in `prisma/migrations/`.
- **NEVER** edit, delete, or rename existing migration SQL files.
- **ALWAYS** commit migration files to git alongside the schema change.
- To roll back: create a NEW migration that reverses the change — never delete or modify an existing one.
- In production: use ONLY `prisma migrate deploy` to apply pending migrations.

**Protected npm scripts in `backend/package.json`:**

```json
{
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:push": "echo 'ERROR: Use migrate dev --name <desc> instead' && exit 1"
}
```

`npm run db:push` intentionally fails. The agent MUST NOT bypass this.

---

## 6. Git Workflow: `feat/*` → `staging` → `main`

### Branch Hierarchy

```
main     → Production. Receives merges from staging only via PR.
staging  → Pre-production (QA, integration). Receives merges from feat/* only via PR.
feat/*   → Feature branches. Created from staging. Push allowed.
```

| Branch    | Created From | Merge Via              | Push Allowed? |
| --------- | ------------ | ---------------------- | ------------- |
| `main`    | —            | PR from `staging` only | ❌ No         |
| `staging` | `main`       | PR from `feat/*` only  | ❌ No         |
| `feat/*`  | `staging`    | —                      | ✅ Yes        |

### Rules

- **NEVER** commit directly to `main` or `staging`.
- **NEVER** merge your own PRs — always request a review.
- **Branch naming:**
  - `feat/add-auth-module` — new feature
  - `fix/login-validation-error` — bug fix
  - `refactor/products-service` — refactoring
  - `chore/update-dependencies` — maintenance
  - `docs/api-readme` — documentation
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `style:`
- **Before creating a PR to `staging`:**
  - Full test suite passes (`npm test`)
  - Lint is clean (`npm run lint`)
  - Type check passes (`tsc --noEmit`)
  - Branch is rebased onto latest `staging` (`git rebase staging`)
- **PR to `main`** only after `staging` has been validated (tests + manual QA).
- **Protected GitHub branches** (`main` and `staging`):
  - Require pull request
  - Require 1 approval
  - Dismiss stale approvals
  - Require status checks (CI)
  - `main` additionally requires linear history

---

## 7. Styling — Tailwind CSS v4 (Exclusive)

### Core Rules

- **ALL** styling uses Tailwind utility classes exclusively.
- **NEVER** use CSS modules (`*.module.css`), styled-components, Emotion, or inline styles.
- **NEVER** create custom CSS files — all styling is done via Tailwind classes in JSX.
- **Tailwind v4** uses CSS-first configuration. Edit `globals.css` with `@theme inline` — there is NO `tailwind.config.ts`.

### Theme Configuration

Define colors, fonts, and spacing in `globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-secondary: #8b5cf6;
  --color-background: #ffffff;
  --color-foreground: #171717;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**NEVER** hardcode hex values in components. Always use theme variables.

### Responsive & Mobile-First Design

This project MUST be fully responsive on all screen sizes. Follow these rules:

- **Mobile-first approach**: design for small screens first, then use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints to enhance for larger screens.
- **NEVER use fixed pixel widths** on containers (`w-[500px]`, `w-96`, `max-w-[800px]`). Use relative units and Tailwind's responsive scale (`w-full`, `max-w-7xl`, `w-3/4`, `lg:w-1/2`).
- **Flexible grids**: use `grid-cols-1` as default, then `md:grid-cols-2`, `lg:grid-cols-3` for larger screens.
- **Fluid typography**: prefer Tailwind's responsive text scale (`text-base md:text-lg lg:text-xl`) over fixed pixel values.
- **Touch targets**: interactive elements (buttons, links, inputs) MUST be at minimum `h-10` (40px) on mobile for touch accessibility.
- **Overflow**: never use `overflow-x-hidden` as a layout fix — fix the actual overflow issue.
- **Test breakpoints**: every component MUST be visually verified at `375px` (mobile), `768px` (tablet), and `1280px` (desktop).

### Dark Mode & Contrast

This project does NOT provide a theme toggle button. Both light and dark modes are handled automatically via the user's system preference (`prefers-color-scheme`). Therefore:

- **EVERY** component MUST have proper color contrast in BOTH light and dark modes.
- **NEVER** define a color for light mode without its dark mode counterpart.
- **Text contrast**: ensure a minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text in both themes (WCAG AA standard).
- **Backgrounds**: use distinct enough backgrounds so content is readable. For example, `bg-white` text on `bg-black` background is fine, but light gray on dark gray is NOT.
- **Borders and dividers**: must be visible in both themes. Use `border-zinc-300` (light) and `border-zinc-700` (dark) patterns.
- **Focus states**: always visible with high contrast in both themes — never rely on color alone to indicate focus.
- **Interactive states**: hover, active, and disabled states MUST have sufficient contrast in both themes.

**Convention**: define dark mode variants alongside every color decision:

```typescript
// ✅ GOOD — visible in both themes
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">

// ❌ BAD — only works in light mode
<div className="bg-white text-zinc-900 border border-zinc-200">
```

### Layout Conventions

- `flex` / `grid` for layouts — never `float` or `position: absolute` for structure
- `gap-*` for spacing between flex/grid children
- `min-h-screen` for full-viewport layouts
- `max-w-*` + `mx-auto` for centered content containers
- Responsive design: mobile-first using `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints
- Dark mode: use `dark:` variants; configuration lives in `globals.css`

---

## 8. Internationalization (i18n) — Multi-language Ready

### Core Rules

- **ALL** user-facing text MUST be centralized in a `strings/` directory.
- **NEVER** hardcode text strings directly in components, pages, or templates.
- Every string file maps to a language: `strings/en.ts`, `strings/es.ts`, `strings/pt.ts`, etc.
- The application detects the user's language via URL prefix (`/[lang]`) and loads the correct strings.

### Directory Structure

```
frontend/src/
├── strings/
│   ├── index.ts            # Exports the current language's strings
│   ├── en.ts               # English strings
│   ├── es.ts               # Spanish strings
│   └── pt.ts               # Portuguese strings
```

### String File Pattern

Each language file exports a single const object with the same shape:

```typescript
// strings/en.ts
const strings = {
  nav: {
    home: "Home",
    products: "Products",
    login: "Login",
    register: "Register",
  },
  home: {
    title: "Welcome",
    subtitle: "Your trusted platform",
  },
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
  },
} as const;

export default strings;
export type Strings = typeof strings;
```

### Usage in Components

```typescript
// ❌ BAD — hardcoded text
<button>Save</button>
<h1>Welcome</h1>

// ✅ GOOD — centralized string reference
import strings from '@/strings';

<button>{strings.common.save}</button>
<h1>{strings.nav.home}</h1>
```

### URL Routing Convention

All application routes MUST be prefixed with a dynamic `[lang]` segment:

```
/[lang]                  → Home page
/[lang]/products         → Product list
/[lang]/products/[slug]  → Product detail
/[lang]/login            → Login page
/[lang]/register         → Register page
```

The `[lang]` segment is a Next.js dynamic route that captures the language code (`en`, `es`, `pt`, etc.).

### Implementation Pattern

1. **Root layout** (`app/layout.tsx`): wraps everything with `<AnimatePresence>`, no language logic.
2. **Language layout** (`app/[lang]/layout.tsx`): reads `params.lang`, loads the correct strings, sets `<html lang="{lang}">`, and provides the strings to children.
3. **Pages** (`app/[lang]/.../page.tsx`): use `params.lang` for API calls and string lookups.
4. **Navigation links** MUST include the language prefix:

```typescript
// ✅ GOOD — includes language prefix
<Link href={`/${lang}/products`}>Products</Link>

// ❌ BAD — no language prefix, breaks i18n
<Link href="/products">Products</Link>
```

### Redirect Logic

When a user visits `/` (root without language), the application MUST redirect to the appropriate language:

- Detect language from `Accept-Language` header or `navigator.language`
- Fallback to English (`/en`) if detection fails
- Redirect: `/` → `/en` (or detected language)

### Backend Considerations

- Error messages returned by the NestJS API MUST also use centralized strings.
- Store backend strings in `backend/src/common/strings/` with the same pattern.
- The frontend can optionally send an `Accept-Language` header; the backend responds with the matching language.

### What Agent MUST NOT Do

- ❌ Write any user-facing text as a string literal in JSX or templates
- ❌ Create language files with incomplete translations — all keys must exist in every language
- ❌ Use browser `navigator.language` directly without a fallback to the default language (English)
- ❌ Create navigation links without the `/[lang]` prefix

---

## 9. Animations — Framer Motion (Exclusive)

### Core Rules

- **ALL** animations, transitions, and micro-interactions use `framer-motion`.
- **NEVER** use CSS animations (`@keyframes`), CSS transitions, or alternative libraries (`react-spring`, `gsap`, `aos`).
- `framer-motion` is installed in the frontend. Do NOT reinstall.

### Required Setup in Root Layout

The root `layout.tsx` MUST wrap page content with `<AnimatePresence>`.
No language logic here — the `[lang]/layout.tsx` sets `<html lang>` dynamically.

```typescript
import { AnimatePresence } from 'framer-motion';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </body>
    </html>
  );
}
```

### Standard Page Transition

Every page component MUST use this standard animation:

```typescript
'use client';

import { motion } from 'framer-motion';

export default function SomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* page content */}
    </motion.div>
  );
}
```

### Layout Animation (Lists, Grids)

```typescript
<motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
  {items.map(item => (
    <motion.div key={item.id} layout>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Micro-interactions (Buttons, Cards, Links)

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Accessibility

Always respect `prefers-reduced-motion`:

```typescript
import { useReducedMotion } from "framer-motion";

const prefersReducedMotion = useReducedMotion();
const transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.35, ease: "easeOut" };
```

### What Agent MUST NOT Do

- ❌ Use CSS animations (`@keyframes`, `transition:` in CSS)
- ❌ Import or use any animation library besides `framer-motion`
- ❌ Create page transitions without wrapping in `AnimatePresence`
- ❌ Animate without respecting `prefers-reduced-motion`
- ❌ Use `'use client'` unnecessarily — only when Framer Motion or interactivity requires it

---

## 10. Optimistic Updates (Performance — Mandatory)

### Core Principle

**NEVER refetch data after a successful mutation.** Update local state directly.

```
❌ BAD: add item → POST /items → wait → GET /items (refetch all) → render
✅ GOOD: add item → POST /items → append to local array → render (instant)
✅ BEST: delete item → remove from local array (instant) → DELETE /items/:id → rollback on error
```

### Implementation Rules

| Operation              | Frontend Behavior                         | Backend Requirement                      |
| ---------------------- | ----------------------------------------- | ---------------------------------------- |
| **Create (POST)**      | Append response item to local array       | Return `201` + **full resource**         |
| **Update (PATCH/PUT)** | Replace item in local array with response | Return `200` + **full resource**         |
| **Delete (DELETE)**    | Remove item from local array immediately  | Return `200` + deleted resource or `204` |
| **Error (any)**        | Rollback to previous state                | Return appropriate error status          |

### Concrete Patterns

```typescript
// ✅ GOOD: No refetch after creation
async function addProduct(data: CreateProductDTO) {
  const product = await api.post("/products", data);
  setProducts((prev) => [...prev, product]); // Direct append — no GET
}

// ✅ BEST: Fully optimistic delete with rollback
async function deleteProduct(id: string) {
  const previousProducts = products;
  setProducts((prev) => prev.filter((p) => p.id !== id)); // Instant removal
  try {
    await api.delete(`/products/${id}`);
  } catch {
    setProducts(previousProducts); // Rollback on failure
    notify.error("Failed to delete product");
  }
}
```

### When Refetching IS Allowed

- **Initial page load** — no local data exists yet
- **User manually refreshes** — pull-to-refresh, reload button, etc.
- **Failure rollback completed** — optionally refetch to guarantee consistency
- **External data changes** — WebSocket/SSE events from other users

### Backend MUST Return Full Resources

Every mutation endpoint MUST return the complete resource in the response body:

```typescript
// ❌ BAD — returns only ID
@Post()
create(@Body() dto: CreateDto): Promise<{ id: string }>

// ✅ GOOD — returns full resource
@Post()
create(@Body() dto: CreateDto): Promise<Product>
```

This enables the frontend to update state directly without an extra GET request.

### Backend Error Response Format

Every error response MUST follow this structure so the frontend can extract messages for rollback notifications:

```json
{
  "statusCode": 400,
  "message": "Human-readable error description",
  "error": "Bad Request"
}
```

The frontend MUST use `message` for `notify.error()` calls during rollback.

---

## 11. Security Constraints (Hard Rules)

The agent MUST enforce these on every endpoint:

- **ValidationPipe global** configured with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`
- **All endpoints** (except auth login/register) require `JwtAuthGuard` by default
- **CORS** restricted to the frontend origin only — never `Access-Control-Allow-Origin: *`
- **Helmet middleware** registered in `main.ts` for security headers
- **Rate limiting** on public endpoints (login, register) via `@nestjs/throttler`
- **Refresh tokens** stored in httpOnly, secure, sameSite cookies — never in localStorage
- **Environment variables** loaded via `@nestjs/config` with validation schema — never hardcoded
- **Passwords** hashed with bcrypt (salt rounds ≥ 12)
- **Agent MUST NEVER read the contents of `.env` files.** Environment variables are sensitive.
- **Agent MAY read and modify `.env.example`** to provide a template of required variables with placeholder values (e.g. `your_jwt_secret_here`), never real secrets.
- **Application code MUST always reference `process.env` variables from `.env`**, never from `.env.example`.
- **API endpoints MUST NEVER include user IDs, tokens, or sensitive identifiers in the URL path or query parameters.** User identification MUST come exclusively from the JWT token extracted server-side via `@CurrentUser()` decorator. This prevents:
  - URL tampering (a client modifying another client's ID in the URL)
  - Token leakage through server logs, referrer headers, and browser history
  - Accidental exposure in error messages or stack traces
- **Client-specific data** (e.g., "my orders", "my claims") MUST use dedicated endpoints like `/api/orders/my` or `/api/claims/my` that extract the user from the JWT. Never use patterns like `/api/orders/user/:userId` or `/api/orders?clientId=xxx`.
- **The frontend NEVER sends the user ID in API requests** for client-scoped resources. The only exception is admin-level operations where the admin explicitly targets a specific client, and even then the admin's own ID comes from the JWT — never from a URL parameter controlled by the client.
- **Tokens are sent ONLY via the `Authorization: Bearer <token>` header**, never in the URL, request body, or cookies that can be accessed by client-side JavaScript.
- **⚠️ Current state (dev):** tokens are stored in `localStorage` via `auth.ts`. This is acceptable during development but **vulnerable to XSS in production**.
- **🏭 Production goal:** migrate to **HTTP-only, Secure, SameSite cookies** with a refresh token pattern. The backend sets the cookie on login (`Set-Cookie`), the browser sends it automatically, and JavaScript never touches the raw JWT. Until this migration happens, treat token storage as **documented tech debt**.

---

## 12. Agent Change Protocol

The agent MUST follow this sequence for EVERY change:

```
Step 1 — Understand
├── Read the relevant files
├── Read AGENTS.md to confirm alignment
└── Identify all files that need changing

Step 2 — Plan
├── Describe the change
├── List files to create/modify/delete
└── Present the plan for approval

Step 3 — Implement
├── Create/modify files in the correct order
├── Write tests first (test-driven when possible)
└── Verify no existing tests break

Step 4 — Validate
├── Run full test suite
├── Run lint
└── Run type check (tsc --noEmit)

Step 5 — Document
├── Update README if needed
└── Add JSDoc comments for public APIs
```

**The agent MUST NOT skip any step.**

---

## 13. Coding Standards

### TypeScript

- `strict: true` in `tsconfig.json`
- Explicit return types on all functions
- No `any` — use `unknown` and narrow with type guards
- Prefer `interface` over `type` for object shapes

### Naming Conventions

| Element                       | Convention                    | Example                                    |
| ----------------------------- | ----------------------------- | ------------------------------------------ |
| Classes, interfaces           | PascalCase                    | `ProductService`, `CreateUserDto`          |
| Methods, variables, functions | camelCase                     | `getProducts()`, `isAuthenticated`         |
| Files, directories            | kebab-case                    | `product.service.ts`, `auth.controller.ts` |
| Constants                     | UPPER_SNAKE_CASE              | `MAX_RETRY_COUNT`, `JWT_SECRET`            |
| Types                         | PascalCase with `Type` prefix | `ProductType`, `UserRoleType`              |

### Imports

- Backend: absolute imports using `@/` (configured in `tsconfig.json`)
- Frontend: absolute imports using `@/` (default Next.js config)
- Group imports: `external → internal → type imports`
- No barrel files (`index.ts`) that re-export everything — import directly

### Testing

- Every service method must have a unit test
- Every controller endpoint must have an e2e test
- Test files co-located: `product.service.ts` → `product.service.spec.ts`
- NestJS testing utilities (`@nestjs/testing`) for unit tests
- Supertest for e2e tests

### General

- All code, comments, commit messages, PR descriptions, and documentation in **English**
- ESLint + Prettier enforced — run `npm run lint` before committing; `.prettierrc` config lives at project root
- No `console.log` in committed code — use NestJS Logger instead
- No commented-out code — delete it
- Use `next/image` for all images — it handles lazy loading, responsive sizes, and WebP conversion natively
- Use `next/dynamic` for heavy or below-the-fold components to enable automatic code splitting
- Never use raw `<img>` tags or manual lazy loading implementations — let Next.js handle it

---

## 14. Protected Files (Agent MUST NOT Modify)

The following files are protected. The agent MUST request explicit permission before modifying them:

- `.env` or `.env.local` — environment variables (**agent MUST NOT read or edit**)
- `.env.example` — **ALLOWED**: agent MAY edit this file to document required variables with placeholder values (e.g. `your_jwt_secret_here`)
- `node_modules/`, `dist/`, `.next/` — build artifacts
- `prisma/migrations/*/migration.sql` — applied migration files
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` — lock files (regenerate instead)
- `next.config.ts` — Next.js configuration (only with explicit approval)
- `nest-cli.json` — NestJS CLI configuration
- `tsconfig.json` — TypeScript configuration (only with explicit approval)
- `.gitignore` — git ignore rules
- `eslint.config.mjs` — ESLint configuration (both backend and frontend)
- `postcss.config.mjs` — PostCSS/Tailwind configuration
- `.prettierrc` — Prettier formatting rules
- `frontend/src/strings/` — frontend language string files (**agent MUST keep all languages in sync**; never delete a key from one language without updating all others)
- `backend/src/common/strings/` — backend language string files (**same sync rules as frontend strings**)

---

## 15. Verification Checklist (Agent Self-Check)

Before finishing any task, the agent MUST verify:

- [ ] **Architecture**: Did I follow MVC? (NestJS = business, NextJS = view)
- [ ] **Structure**: Did I place files in the correct directories?
- [ ] **Migrations**: Did I use `migrate dev` (not `db push`) and commit the migration file?
- [ ] **Git**: Did I work on a `feat/*` branch from `staging`?
- [ ] **Styling**: Did I use Tailwind utilities (not CSS modules, not inline styles)?
- [ ] **Responsive**: Is the layout fully functional on mobile (375px)? Did I avoid fixed pixel widths?
- [ ] **Dark Mode**: Does every component have proper `dark:` variants with sufficient contrast?
- [ ] **i18n Routing**: Do all routes use the `/[lang]` prefix? Are navigation links language-aware?
- [ ] **i18n Strings**: Did I use centralized strings (not hardcoded text) for all user-facing content?
- [ ] **Animations**: Did I use Framer Motion (not CSS animations)?
- [ ] **Optimistic Updates**: Did I avoid unnecessary refetch after mutation?
- [ ] **Security**: Did I add validation, auth guards, and proper error handling?
- [ ] **Lazy Loading**: Are images using `next/image`? Are heavy components using `next/dynamic`?
- [ ] **Tests**: Did I write tests for the new code?
- [ ] **Language**: Is everything in English?
- [ ] **Lint**: Does `npm run lint` pass without errors?
