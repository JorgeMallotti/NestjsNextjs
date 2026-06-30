# Frontend-Specific Rules

This project uses a **root-level `AGENTS.md`** at the project root (`../AGENTS.md`). Read that file first for architecture, migration, styling, animation, and security rules.

## Next.js 16 Deprecation Notice

Next.js 16 has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Frontend-Specific Additions

- All page components use Framer Motion for transitions (see AGENTS.md section 8)
- All styling uses Tailwind v4 utility classes (see AGENTS.md section 7)
- Never refetch after mutations — use optimistic updates (see AGENTS.md section 9)
