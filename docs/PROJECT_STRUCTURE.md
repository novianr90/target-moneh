# Project Structure & Guidelines (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document defines the folder structure and code responsibility boundaries for the SvelteKit application. It ensures a maintainable and modular codebase.

---

## 1. Directory Layout

```text
target-moneh/
├── docs/                      # Core architectural & PRD documentation
├── supabase/
│   ├── migrations/            # SQL migration files
│   ├── functions/             # Supabase Edge Functions (e.g., sync-savings)
│   ├── config.toml            # Local Supabase configuration
│   └── seed.sql               # Local development seed data
├── src/
│   ├── app.d.ts               # Global types (Supabase locals, session types)
│   ├── app.html               # Main HTML entry point
│   ├── hooks.server.ts        # @supabase/ssr session management & route guarding
│   ├── lib/
│   │   ├── components/        # Reusable UI components (buttons, modals, cards)
│   │   │   ├── ui/            # Generic/Tailwind base components
│   │   │   └── target/        # Domain-specific components (e.g., GoalCard.svelte)
│   │   ├── engines/           # Pure TS math logic (Velocity, Forecast, Health)
│   │   ├── supabase/          # Supabase client instantiation
│   │   └── types/             # Shared TypeScript interfaces & DB definitions
│   └── routes/
│       ├── +layout.svelte     # Root layout (QueryClientProvider, Session hydration)
│       ├── +layout.server.ts  # Root server data (passes safe session to client)
│       ├── auth/              # Login, Register, Logout routes
│       └── (app)/             # Authenticated routes (Dashboard, Targets, Settings)
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json
```

---

## 2. Code Responsibility Guidelines

### 2.1 Routing & Layouts
- `(app)/` uses a group layout that *requires* authentication. Unauthenticated users hitting `/(app)/*` are automatically redirected to `/auth` by `hooks.server.ts` or the `+layout.server.ts` guard.
- SvelteKit `load` functions should generally only load *critical* data (like session state or very initial metadata).
- **Primary Data Fetching:** Deferred to `@tanstack/svelte-query` within the Svelte components to allow optimistic updates, easy refetching, and caching.

### 2.2 `lib/engines/`
All business logic regarding money forecasting and health calculations MUST reside in pure TypeScript functions inside `src/lib/engines/`.
- `forecast.ts`
- `velocity.ts`
- `health.ts`

**Rule:** UI components must *never* contain raw velocity/forecast calculation math. They must import and call the engine functions. This allows for unit testing of the financial logic independent of the UI.

### 2.3 `lib/components/`
- Keep components small and focused.
- **Dumb Components (`ui/`):** Buttons, inputs, modals. They do not know about Supabase or TanStack Query.
- **Smart Components:** `DashboardHero.svelte`, `TransactionModal.svelte`. They use TanStack Query hooks to fetch data or trigger mutations.

### 2.4 Supabase Client Instantiation
Never instantiate the Supabase client directly in a component. Use a singleton/factory pattern in `src/lib/supabase/client.ts` for browser clients, and `src/lib/supabase/server.ts` for server-side clients to prevent cross-request session leakage.
