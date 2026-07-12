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
| **Passport/JWT**      | ^0.7.0  | Authentication (JSON Web Tokens)             |
| **bcrypt**            | ^6.0.0  | Password hashing                             |
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

The backend owns all business logic and data access. The frontend is purely a consumer of the REST API — it never calls the database directly, never duplicates validation logic, and never stores business state beyond what is needed for the current session (JWT token).

---

## Project Structure

```
NestjsNextjs/
├── backend/                          # NestJS 11 application
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (single source of truth)
│   │   └── migrations/               # Versioned migration files
│   ├── src/
│   │   ├── main.ts                   # App bootstrap (middleware, CORS, validation)
│   │   ├── app.module.ts             # Root module
│   │   ├── common/
│   │   │   ├── decorators/           # @CurrentUser, @Roles, @Public
│   │   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   │   ├── filters/              # Global exception filter
│   │   │   ├── interceptors/         # Logging interceptor
│   │   │   └── dto/                  # Shared DTOs (pagination)
│   │   ├── modules/
│   │   │   ├── auth/                 # Authentication (register, login, JWT)
│   │   │   ├── orders/               # Order CRUD, approval, truck assignment
│   │   │   ├── claims/               # Claim filing and resolution
│   │   │   ├── clients/              # Client management, approval, stats
│   │   │   ├── products/             # Product catalog
│   │   │   ├── trucks/               # Truck fleet, shipping, returns
│   │   │   └── workers/              # Worker management, driver assignment
│   │   └── prisma/                   # PrismaService (database client)
│   └── test/                         # E2E tests
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
│   │   │   ├── layout.tsx            # Root layout (AnimatePresence)
│   │   │   └── page.tsx              # Root redirect → /[lang]
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Badge, Input, Modal
│   │   │   ├── layout/               # Sidebar, navigation
│   │   │   └── features/             # Feature-specific components
│   │   ├── lib/
│   │   │   ├── api/                  # API client (api.ts, auth.ts, client.ts)
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
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/comptech_pro"

# JWT Configuration
JWT_SECRET="your_jwt_secret_here_change_in_production"
JWT_EXPIRES_IN="7d"

# Auth Bypass (set to "true" to skip password verification during development)
AUTH_BYPASS="true"

# Server port (backend runs on 3001, frontend on 3000)
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

> **Note:** When `AUTH_BYPASS=true`, any password is accepted during login — useful for local development.

### Database Setup

```bash
# Navigate to backend
cd backend

# Apply all migrations to create/update the database
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

This will create the `comptech_pro` database and apply all migration files. The schema includes these models:

| Model           | Description                                |
| --------------- | ------------------------------------------ |
| `User`          | Admin and client accounts                  |
| `Product`       | Computer components with weight (kg)       |
| `Truck`         | Fleet vehicles with capacity tracking      |
| `Worker`        | Employees with status (available, driving) |
| `Order`         | Client orders with delivery address        |
| `OrderItem`     | Individual products within an order        |
| `Claim`         | Client claims for damaged/missing items    |
| `CommonProduct` | Per-client frequently ordered products     |

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

### Default Workflow

1. **Register a client** at `/en/register`
2. **Login as client** at `/en/login` (`email@email.com` with any password when `AUTH_BYPASS=true`)
3. **Place an order** at `/en/client/orders` — select products, enter delivery address
4. **Login as admin** at `/en/admin/login` (`admin@test.com` with any password when `AUTH_BYPASS=true`)
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
| POST   | `/api/auth/login`                   | Public       | Client login                      |
| POST   | `/api/auth/login/admin`             | Public       | Admin login                       |
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
- **Role-based access control** (`@Roles('admin', 'client')`) for every endpoint
- **Helmet middleware** for security headers
- **CORS restricted** to the frontend origin only
- **Rate limiting** on public endpoints (login, register)
- **Passwords hashed** with bcrypt (salt rounds ≥ 12)
- **User IDs never in URLs** — all client-scoped data is extracted from JWT server-side

### Performance

- **Optimistic updates** — the frontend never refetches data after a successful mutation; it updates local state immediately and rolls back on error
- **Lazy loading** with `next/image` for images and `next/dynamic` for heavy components
- **Framer Motion** respects `prefers-reduced-motion` for accessibility

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

### JWT Token Storage in localStorage

**Current state (development):** JWT access tokens are stored in `localStorage` via the `auth.ts` module:

```typescript
localStorage.setItem("auth_token", accessToken);
```

This approach is functional for development but **vulnerable to XSS attacks in production**. Any injected JavaScript can read `localStorage` and exfiltrate the token.

**Production goal:** Migrate to **HTTP-only, Secure, SameSite cookies** with a refresh token pattern:

1. On login, the backend sets the access token as an HTTP-only cookie (`Set-Cookie` header)
2. The browser sends the cookie automatically with each request
3. If the access token expires, a refresh token (also HTTP-only) is used to obtain a new one silently
4. JavaScript never touches the raw JWT — `localStorage` is not involved

Until this migration is implemented, token storage in `localStorage` is considered **documented technical debt**.

### Other Known Areas for Improvement

- **E2E test coverage** — tests exist for the app module but coverage should be extended to all feature modules
- **Rate limiting configuration** — `@nestjs/throttler` is installed but guard configuration should be reviewed
- **Seed scripts** — no database seed script exists; data must be entered manually through the UI or SQL

---

## License

This project is licensed under the terms of the LICENSE file included in the repository.
