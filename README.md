# CompTech Pro — B2B Enterprise Component Platform

**CompTech Pro** is a full-stack **B2B SaaS platform** for managing computer component procurement, fleet logistics, workforce coordination, and client relationships. It enables businesses to streamline purchasing, track deliveries, manage a truck fleet with driver assignments, and handle claims — all in one integrated system.

Built with **NestJS 11** (backend) and **Next.js 16** (frontend), following a **Model-View-Controller (MVC)** architecture.

---

## Table of Contents

- [Architecture](#architecture)
- [Why MVC?](#why-mvc)
- [Tech Stack](#tech-stack)
  - [Why These Technologies?](#why-these-technologies)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Best Practices](#best-practices)
- [Known Technical Debt](#known-technical-debt)
- [License](#license)

---

## Architecture

The project follows a strict **Model-View-Controller (MVC)** pattern across a monorepo with two independent applications:

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│            Next.js 16 (View Layer)                │
│                                                    │
│  Pages & Components → fetch() → REST API           │
└──────────────────────┬───────────────────────────┘
                       │  HTTP / JSON
┌──────────────────────▼───────────────────────────┐
│                   Backend                         │
│           NestJS 11 (Controller + Model)           │
│                                                    │
│  Controllers → Services → Prisma ORM → PostgreSQL │
└──────────────────────────────────────────────────┘
```

| Layer          | Technology         | Responsibility                                |
| -------------- | ------------------ | --------------------------------------------- |
| **View**       | Next.js 16         | UI rendering, user interaction, animations    |
| **Controller** | NestJS Controllers | HTTP routing, auth guards, request validation |
| **Model**      | NestJS Services    | Business logic, data access, database queries |

### Data Flow

```
User Action → Next.js Page → fetch() → NestJS API → Service → Prisma → PostgreSQL
                                                              ↑
                                                      Response (JSON)
```

**Key constraint:** Next.js NEVER accesses the database directly. All data flows through the NestJS REST API.

---

## Why MVC?

The MVC pattern was chosen for three fundamental reasons:

1. **Separation of Concerns** — Business logic (Model) is completely isolated from HTTP handling (Controller) and UI rendering (View). This means:
   - If the frontend framework changes (e.g., from Next.js to another framework), the backend remains untouched.
   - If the database changes, only the Model layer is affected.
   - If the API contract changes, only Controllers and the corresponding frontend pages are updated.

2. **Testability** — Each layer can be tested independently:
   - Services are pure TypeScript classes with injectable dependencies, making unit tests straightforward.
   - Controllers can be tested with supertest for e2e API validation.
   - Frontend components can be tested with React Testing Library.

3. **Scalability** — Multiple frontends (admin panel, client portal, mobile app) can consume the same backend API without duplication of business logic.

---

## Tech Stack

### Backend (`backend/`)

| Technology            | Version | Purpose                                      |
| --------------------- | ------- | -------------------------------------------- |
| **NestJS**            | ^11.0.1 | Application framework (Controllers, Modules) |
| **Prisma ORM**        | ^7.8.0  | Database ORM with migrations                 |
| **PostgreSQL**        | —       | Relational database                          |
| **Passport/JWT**      | ^0.7.0  | Authentication (JWT in HttpOnly cookies)      |
| **cookie-parser**     | ^1.4.7  | Cookie parsing for JWT extraction             |
| **bcrypt**            | ^6.0.0  | Password hashing (salt rounds ≥ 12)           |
| **class-validator**   | ^0.15.1 | DTO validation decorators                    |
| **Helmet**            | ^8.2.0  | Security headers                             |
| **@nestjs/throttler** | ^6.5.0  | Rate limiting on public endpoints            |

### Frontend (`frontend/`)

| Technology        | Version  | Purpose                                 |
| ----------------- | -------- | --------------------------------------- |
| **Next.js**       | 16.2.9   | React framework (App Router, SSR, SSG)  |
| **React**         | 19.2.4   | UI library                              |
| **Tailwind CSS**  | ^4       | Utility-first styling                   |
| **Framer Motion** | ^12.42.1 | Page transitions and micro-interactions |
| **TypeScript**    | ^5       | Type safety across the entire codebase  |

### Why These Technologies?

**Why NestJS over Express/Fastify?**
NestJS provides a structured, opinionated framework with built-in dependency injection, decorators for routing/validation, and module-based organization. This enforces consistent patterns across the entire backend — every feature module (Orders, Trucks, Workers, etc.) follows the exact same structure, making the codebase predictable and easy to navigate.

**Why Prisma over TypeORM/Drizzle?**
Prisma offers a declarative schema that serves as the single source of truth for the database. Its migration system enforces a strict history (every change produces a versioned SQL file), and the generated type-safe client eliminates raw SQL errors and provides autocomplete for queries.

**Why Next.js over a SPA framework?**
Next.js provides server-side rendering for performance, the App Router for intuitive file-based routing with nested layouts, and built-in optimizations like image optimization and code splitting. The `[lang]` dynamic segment enables seamless i18n routing.

**Why Tailwind CSS v4?**
Tailwind's utility-first approach eliminates context-switching between HTML and CSS files. The CSS-first configuration (no `tailwind.config.ts`) allows theme customization directly in `globals.css` using `@theme inline`. Dark mode is handled automatically via `prefers-color-scheme`.

**Why Framer Motion?**
Framer Motion is the de-facto animation library for React. It integrates deeply with React's component model, supports layout animations, gesture-based interactions, and respects `prefers-reduced-motion` for accessibility.

### How They Relate

```
PostgreSQL ◄── Prisma (ORM + Migrations) ◄── NestJS Services ◄── Controllers
                                                                      │
                                                              HTTP REST API
                                                                      │
                                         Next.js Pages ◄── API Client ◄──┘
                                              │
                                         Tailwind CSS + Framer Motion
```

The backend owns all business logic and data access. The frontend is purely a consumer of the REST API — it never calls the database directly, never duplicates validation logic, and never stores business state beyond what is needed for the current session (user info for display). The JWT token is stored in an HttpOnly cookie, making it inaccessible to JavaScript and immune to XSS attacks.

---

## Project Structure

```
NestjsNextjs/
├── backend/                          # NestJS 11 application
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (single source of truth)
│   │   ├── seed.ts                   # Demo data seeder (run via prisma db seed)
│   │   └── migrations/               # Versioned migration files
│   ├── scripts/
│   │   └── reset-demo.sh             # CLI script for database reset + reseed
│   ├── src/
│   │   ├── main.ts                   # App bootstrap (middleware, CORS, validation, cookies)
│   │   ├── app.module.ts             # Root module
│   │   ├── common/
│   │   │   ├── decorators/           # @CurrentUser, @Roles, @Public
│   │   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   │   ├── filters/              # Global exception filter
│   │   │   ├── interceptors/         # Logging interceptor
│   │   │   ├── pipes/                # SanitizationPipe (XSS defence)
│   │   │   ├── utils/                # sanitizer.ts (HTML tag stripper)
│   │   │   └── dto/                  # Shared DTOs (pagination)
│   │   ├── modules/
│   │   │   ├── audit/                # Audit logging (tracks all changes)
│   │   │   ├── auth/                 # Authentication (register, login, JWT via HttpOnly cookies)
│   │   │   ├── demo/                 # Demo 1-click login + database reset endpoint
│   │   │   ├── orders/               # Order CRUD, approval, truck assignment
│   │   │   ├── claims/               # Claim filing and resolution
│   │   │   ├── clients/              # Client management, approval, stats
│   │   │   ├── products/             # Product catalog
│   │   │   ├── trucks/               # Truck fleet, shipping, returns
│   │   │   └── workers/              # Worker management, driver assignment
│   │   └── prisma/                   # PrismaService (database client with adapter-pg)
│   ├── Dockerfile                    # Multi-stage production build
│   ├── .dockerignore
│   └── test/                         # E2E tests
│
├── docker-compose.yml                # PostgreSQL for local development
│
├── frontend/                         # Next.js 16 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── [lang]/               # Dynamic language segment (en, es, pt)
│   │   │   │   ├── page.tsx          # Home page
│   │   │   │   ├── layout.tsx        # Language-aware layout
│   │   │   │   ├── login/            # Client login
│   │   │   │   ├── register/         # Client registration
│   │   │   │   ├── client/           # Client dashboard, orders, claims
│   │   │   │   └── admin/
│   │   │   │       ├── login/        # Admin login (no sidebar)
│   │   │   │       └── (dashboard)/  # Admin pages (with sidebar)
│   │   │   │           ├── audit-log/  # Audit log viewer
│   │   │   │           └── ...         # clients, trucks, workers, products, orders
│   │   │   ├── layout.tsx            # Root layout (AnimatePresence)
│   │   │   └── page.tsx              # Root redirect → /[lang]
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Badge, Input, Modal
│   │   │   ├── layout/               # Sidebar, navigation
│   │   │   └── features/             # Feature-specific components
│   │   ├── lib/
│   │   │   ├── api/                  # API client (api.ts, auth.ts, demo.ts, client.ts)
│   │   │   └── utils/                # Helper functions
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── strings/                  # i18n language files (en, es, pt)
│   │   └── types/                    # Shared TypeScript interfaces
│   └── public/                       # Static assets
│
├── AGENTS.md                         # Agent instructions (architecture rules)
├── DEEPSEEK.md                       # AI coding agent guidelines
└── package.json                      # Root workspace scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **PostgreSQL** >= 14 (running locally or remotely)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/JorgeMallotti/NestjsNextjs.git
cd NestjsNextjs

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### Environment Variables

Create a `.env` file in `backend/` (copy from `.env.example`):

```env
# Database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comptech_pro"

# ─── JWT (generate with: openssl rand -base64 64) ──────
JWT_SECRET="change_me_in_production"
JWT_EXPIRES_IN="7d"

# ─── Auth (dev only — NEVER true in production) ────────
AUTH_BYPASS="true"

# ─── Demo Reset (generate with: openssl rand -hex 32) ──
# Used to protect POST /api/demo/reset endpoint.
# Set the same value in cron-job.org as x-reset-secret header.
RESET_SECRET="change_me_in_production"

# Server port (backend runs on 3001, frontend on 3000)
PORT=3001

# Frontend URL (for CORS — update to Vercel URL in production)
FRONTEND_URL="http://localhost:3000"
```

> **Note:** When `AUTH_BYPASS=true`, any password is accepted during login — for local dev only.

### Database Setup

```bash
# Navigate to backend
cd backend

# Start PostgreSQL (Docker)
docker compose up -d

# Apply all migrations to create/update the database
npx prisma migrate dev

# Seed the database with realistic demo data (admin, clients, products, etc.)
npx prisma db seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

This will create the `comptech_pro` database, apply all migration files, and populate it with realistic demo data. The schema includes these models:

| Model           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `User`          | Admin and client accounts (soft-deletable)                 |
| `Product`       | Computer components with brand, type, price, weight (kg)   |
| `Truck`         | Fleet vehicles with capacity, kilometrage, driver tracking |
| `Worker`        | Employees with position, start date, status                |
| `Order`         | Client orders with delivery address, status tracking       |
| `OrderItem`     | Individual products within an order                        |
| `Claim`         | Client claims for damaged/missing items                    |
| `CommonProduct` | Per-client frequently ordered products (with frequency)    |
| `AuditLog`      | Full audit trail (entity, action, who, when, reason)       |

### Running the Application

You need **two terminal windows** — one for the backend, one for the frontend.

```bash
# Terminal 1 — Backend (NestJS on port 3001)
cd backend
npm run start:dev

# Terminal 2 — Frontend (Next.js on port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser. You'll be redirected to `/en` (English).

### Demo Accounts (Pre-seeded)

After running `npx prisma db seed`, you can log in instantly with:

| Role | Email | Password | Company |
|---|---|---|---|
| **Admin** | `admin@comptechpro.com` | `demo123456` | CompTech Pro |
| **Client** | `contacto@bytewise.pt` | `demo123456` | ByteWise Lda. (Porto) |
| **Client** | `geral@inovadata.pt` | `demo123456` | InovaData SA (Lisboa) |
| **Client** | `compras@datacore.pt` | `demo123456` | DataCore Solutions (Aveiro) |

### 1-Click Demo Login

From the **homepage**, you can log in without typing credentials:

- **Admin**: click the purple "Login as Admin" card → instant access to the full admin dashboard
- **Client**: click any blue company card (ByteWise, InovaData, DataCore) → instant access to that client's portal

This is powered by `POST /api/demo/login` — a no-password endpoint for demo accounts only.

### Default Workflow

1. **Register a client** at `/en/register` (or use a demo client account)
2. **Login as client** at `/en/login` — or use 1-click demo from the homepage
3. **Place an order** at `/en/client/orders` — select products, enter delivery address
4. **Login as admin** at `/en/admin/login` — or use 1-click demo from the homepage
5. **Approve the order** at `/en/admin/orders` — select a truck, set delivery date
6. **Ship the truck** at `/en/admin/trucks` — select a driver
7. **Client marks delivered** at `/en/client/orders` — order is marked as delivered
8. **Admin registers return** at `/en/admin/trucks` — enter new kilometrage

### Useful Commands

```bash
# Backend
npm run start:dev        # Development server (watch mode)
npm run build            # Production build
npm run lint             # ESLint check + fix
npm run test             # Unit tests
npm run test:e2e         # E2E tests
npx prisma studio        # Database GUI

# Frontend
npm run dev              # Development server
npm run build            # Production build
npm run lint             # Lint check
```

---

## API Overview

All endpoints are prefixed with `/api` and are protected by `JwtAuthGuard` unless marked as public.

| Method | Endpoint                            | Access       | Description                       |
| ------ | ----------------------------------- | ------------ | --------------------------------- |
| POST   | `/api/auth/register`                | Public       | Register a new client             |
| POST   | `/api/auth/login`                   | Public       | Client login (sets HttpOnly cookie) |
| POST   | `/api/auth/login/admin`             | Public       | Admin login (sets HttpOnly cookie) |
| POST   | `/api/auth/logout`                  | Public       | Clear auth cookie                 |
| GET    | `/api/auth/profile`                 | Authenticated| Get current user profile          |
| GET    | `/api/demo/accounts`                | Public       | List demo accounts (1-click login)|
| POST   | `/api/demo/login`                   | Public       | 1-click demo login (sets cookie)  |
| POST   | `/api/demo/reset`                   | Public*      | Reset database to seed state (*protected by RESET_SECRET) |
| GET    | `/api/audit`                        | Admin        | View full audit log               |
| GET    | `/api/orders`                       | Admin        | List all orders                   |
| POST   | `/api/orders`                       | Admin/Client | Create an order                   |
| PATCH  | `/api/orders/:id`                   | Admin        | Update order (approve with truck) |
| PATCH  | `/api/orders/:id/deliver`           | Client       | Mark order as delivered           |
| GET    | `/api/trucks`                       | Admin        | List all trucks                   |
| GET    | `/api/trucks/available-for-loading` | Admin        | Trucks available/loading          |
| POST   | `/api/trucks/:id/ship`              | Admin        | Ship truck with driver            |
| POST   | `/api/trucks/:id/return`            | Admin        | Return truck to factory           |
| GET    | `/api/workers`                      | Admin        | List all workers                  |
| GET    | `/api/workers/available-drivers`    | Admin        | Workers available to drive        |
| GET    | `/api/products`                     | Admin        | List all products                 |
| GET    | `/api/clients`                      | Admin        | List all clients                  |
| PATCH  | `/api/clients/:id/approve`          | Admin        | Approve a client                  |
| PATCH  | `/api/clients/:id/restore`          | Admin        | Restore soft-deleted client       |
| DELETE | `/api/clients/:id/permanent`        | Admin        | Permanently delete client         |
| GET    | `/api/claims`                       | Admin        | List all claims                   |
| POST   | `/api/claims`                       | Client       | File a claim                      |

---

## Best Practices

### Architecture & Code Quality

- **Strict MVC separation** — business logic never leaks into the frontend
- **Explicit return types** on all functions (no implicit `any`)
- **No barrel files** — imports are direct and explicit
- **Constructor-based dependency injection** in NestJS services
- **DTOs with class-validator** for every API endpoint — whitelist unknown properties, transform types, forbid non-whitelisted
- **Global validation pipe** configured in `main.ts` with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`

### Security

- **JWT authentication** with Passport strategies
- **HttpOnly Secure SameSite cookies** for JWT storage — JavaScript cannot access the token, protecting against XSS attacks
- **Fallback to Bearer header** — the JWT strategy reads from the cookie first, then falls back to `Authorization: Bearer` (for API clients and dev)
- **Role-based access control** (`@Roles('admin', 'client')`) for every endpoint
- **Helmet middleware** for security headers
- **CORS restricted** to the frontend origin only
- **Rate limiting** on public endpoints (login, register)
- **Passwords hashed** with bcrypt (salt rounds ≥ 12)
- **User IDs never in URLs** — all client-scoped data is extracted from JWT server-side
- **XSS defence** — global `SanitizationPipe` strips HTML/JS from all string inputs (stored XSS prevention)
- **Workflow enforcement** — trucks in motion cannot be edited/deleted; workers in non-available status cannot be modified or deleted

### Performance

- **Optimistic updates** — the frontend never refetches data after a successful mutation; it updates local state immediately and rolls back on error
- **Lazy loading** with `next/image` for images and `next/dynamic` for heavy components
- **Framer Motion** respects `prefers-reduced-motion` for accessibility

### Audit Trail & Accountability

- **Full audit log** — every create, update, delete, soft-delete, restore, confirm, ship, deliver, and cancel action is recorded in `AuditLog`
- **Who, what, when, why** — each log entry captures the performing user, affected entity, old/new values (as JSON diff), a textual reason, and a timestamp
- **Order status tracking** — each status transition (`confirmed`, `shipped`, `delivered`, `cancelled`) records the responsible admin and timestamp directly on the Order
- **Worker changes require justification** — sensitive edits (name, position, start date) require a mandatory reason
- **Deletion requires reason** — worker and order deletions require a textual justification

### Workflow Integrity

- **Truck lifecycle enforced** — status transitions follow a strict cycle: `available → loading → shipping → returning → available`. Admin cannot skip steps or edit trucks in motion
- **Worker status protected** — workers in `driving`, `on_vacation`, `sick_leave`, or `inactive` cannot have their status manually changed; `driving` is system-only (assigned when truck ships)
- **Client soft delete** — clients are soft-deleted (with `deletedAt` timestamp), can be restored, or permanently deleted (only after soft-delete)
- **Client deletion blocked with active orders** — clients with pending/active orders cannot be deleted
- **Truck deletion blocked when in use** — trucks assigned to a driver or order cannot be deleted

### Database

- **Migration-based schema changes** — every schema change produces a versioned SQL file, never `db push`
- **All models use `cuid()`** for IDs (URL-safe, non-sequential)
- **Timestamps** (`createdAt`, `updatedAt`) on every model

### Internationalization

- **All user-facing text** is centralized in `frontend/src/strings/` and referenced via `getStrings(lang)`
- **Language detected** from URL prefix (`/[lang]`), supported: English, Spanish, Portuguese
- Three language files are always kept in sync — no key is ever added to one without updating the others

---

## Known Technical Debt

### Refresh Token Pattern

**Current state:** JWT access tokens are stored in **HttpOnly cookies** (migrated from localStorage). JavaScript cannot access the token, which protects against XSS attacks.

**Future improvement:** Implement a **refresh token pattern**:
1. Short-lived access token (e.g., 15 min) stored in an HttpOnly cookie
2. Long-lived refresh token (e.g., 7 days) stored in a separate HttpOnly cookie
3. When the access token expires, the backend uses the refresh token to issue a new one automatically
4. No user-facing logout required — seamless token rotation

This is a **nice-to-have enhancement** rather than a security fix, since the current setup already protects against XSS.

### Other Known Areas for Improvement

- **E2E test coverage** — tests exist for the app module but coverage should be extended to all feature modules
- **Rate limiting configuration** — `@nestjs/throttler` is installed but guard configuration should be reviewed
- **Demo data** — the seed script populates the database with realistic demo data (PT-based companies, products, orders). In production, a real registration flow replaces the demo data
- **Client-side XSS validation** — backend sanitization is in place; frontend validation is a future enhancement

---

## Docker

A multi-stage `Dockerfile` is available in `backend/` for production builds:

```bash
# Build the image
cd backend
docker build -t comptech-backend .

# Run with PostgreSQL (or use docker-compose for local dev)
docker compose up -d
```

The `docker-compose.yml` at the project root starts a PostgreSQL instance for local development:

```bash
docker compose up -d    # Start PostgreSQL on port 5432
docker compose down     # Stop PostgreSQL
```

## Deployment

### Backend — Railway

1. Create a new project in [Railway](https://railway.app) and connect your GitHub repository
2. Set **Root Directory** to `backend`
3. Add the **PostgreSQL** plugin (Railway injects `DATABASE_URL` automatically)
4. Set environment variables:

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | Generate with `openssl rand -base64 64` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `RESET_SECRET` | Generate with `openssl rand -hex 32` |
   | `FRONTEND_URL` | Your Vercel URL (e.g., `https://demo.vercel.app`) |
   | `AUTH_BYPASS` | `false` |
   | `NODE_ENV` | `production` |

5. Deploy, then open **Railway Console** and run:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Frontend — Vercel

1. Connect your GitHub repository in [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set environment variable:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://your-railway-app.up.railway.app/api` |

4. Deploy

### Automatic Database Reset (24h)

Use [cron-job.org](https://cron-job.org) (free) to:

1. **Keep the backend awake** — ping every 10 minutes:
   - URL: `https://your-railway-app.up.railway.app/api/demo/accounts`
   - Method: `GET`

2. **Reset the database every 24 hours** — restores seed data:
   - URL: `https://your-railway-app.up.railway.app/api/demo/reset`
   - Method: `POST`
   - Header: `x-reset-secret: <your_reset_secret>`

---

## Authentication Flow

The project uses **HttpOnly cookies** for JWT storage — the most secure approach for browser-based authentication:

```
1. Login ─────────────────────────────────────────────┐
   User submits email + password                       │
                                                       ▼
2. Server verifies credentials ───────────────────────┐
   If valid, creates JWT payload:                      │
   { sub: userId, email, role }                        │
   Signs with JWT_SECRET                               │
                                                       ▼
3. Server responds ───────────────────────────────────┐
   Set-Cookie: auth_token=<jwt>; HttpOnly;             │
               Secure; SameSite=Lax; Path=/;           │
               Max-Age=604800 (7 days)                 │
   Response body: { user: { id, name, email, role } }  │
                                                       ▼
4. Browser stores cookie automatically ───────────────┐
   JavaScript CANNOT read the cookie (HttpOnly)        │
   Cookie is sent only over HTTPS (Secure)             │
   Cookie is not sent cross-site (SameSite=Lax)        │
                                                       ▼
5. Authenticated requests ────────────────────────────┐
   fetch(url, { credentials: 'include' })              │
   Browser sends cookie automatically                  │
                                                       ▼
6. Server validates JWT from cookie ──────────────────┐
   Reads auth_token cookie                             │
   Verifies signature with JWT_SECRET                  │
   Extracts user → processes request                   │
```

**For API clients** (Postman, curl, mobile apps), the server also accepts `Authorization: Bearer <token>` as a fallback.

---

## License

This project is licensed under the terms of the LICENSE file included in the repository.
