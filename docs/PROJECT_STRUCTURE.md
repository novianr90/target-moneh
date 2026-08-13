# Project Structure & Guidelines (TargetMoneh)

**Version:** 1.0.0  
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document defines the directory layout and code responsibility boundaries for TargetMoneh across all implemented modules (Issues #1 through #8).

---

## 1. Directory Layout

```text
target-moneh/
├── docs/                      # Authoritative PRD & Technical Documentation
├── supabase/
│   ├── migrations/            # Version-controlled SQL migration files
│   ├── functions/             # Supabase Edge Functions (e.g. sync-savings)
│   ├── config.toml            # Local Supabase configuration
│   └── seed.sql               # Local development seed data
├── src/
│   ├── app.d.ts               # Global types (Supabase locals, session types)
│   ├── app.html               # Main HTML entry point
│   ├── hooks.server.ts        # @supabase/ssr session management & route guarding
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Base UI controls (DatePicker, Pagination)
│   │   │   ├── accounts/      # Source account management cards & modals
│   │   │   ├── categories/    # Category icons & cards
│   │   │   ├── targets/       # Goal cards, target modals, & tables
│   │   │   ├── transactions/  # Transaction forms, tables, & widgets
│   │   │   └── dashboard/     # HeroTargetCard, SavingsTimeline, QuickDepositFAB, QuickDepositModal, DashboardGoalList
│   │   ├── engines/           # Pure TS math logic (periods, velocity, forecast, health, recommendation)
│   │   ├── services/          # Supabase client service singletons (accounts, categories, targets, transactions)
│   │   └── types/             # Shared TypeScript interfaces & DB definitions
│   └── routes/
│       ├── +layout.svelte     # Root layout (QueryClientProvider, Session hydration)
│       ├── +layout.server.ts  # Root server data (passes safe session to client)
│       ├── +page.svelte       # Main Dashboard (Hero Goal, Timeline, Goal Cards, FAB)
│       ├── accounts/          # Master accounts management route
│       ├── categories/        # Category management route
│       ├── targets/           # Savings goals management route
│       ├── transactions/      # Savings transactions ledger route
│       └── auth/              # Authentication routes (Login, Register, Logout)
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json
```

---

## 2. Code Responsibility Boundaries

### 2.1 Routing & Layouts (`src/routes/`)
- Server `hooks.server.ts` resolves HTTP cookies via `@supabase/ssr` and enforces authentication route guards before rendering.
- `+layout.server.ts` safely dehydrates session user data to the client.
- Primary Data Fetching is handled in Svelte components via `@tanstack/svelte-query` for client-side caching, background updates, and optimistic UI invalidations.

### 2.2 Business & Financial Math (`src/lib/engines/`)
Pure, deterministic TypeScript logic isolated from UI markup:
- `periods.ts` — Calendar-month delta calculations ($N_{\text{months}}$) & Required Monthly Savings.
- `velocity.ts` — 6-month capped historical net savings velocity excluding incomplete current month.
- `forecast.ts` — Velocity-based projected completion date formatting.
- `health.ts` — Strict precedence evaluation of Goal Health badges.
- `recommendation.ts` — Unified goal metrics builder (`calculateGoalMetrics`).

### 2.3 UI Components (`src/lib/components/`)
- **Base UI (`ui/`):** Pure input controls, Flatpickr `DatePicker.svelte`, pagination controls.
- **Domain Components (`dashboard/`, `targets/`, `transactions/`, `accounts/`, `categories/`):** Smart components consuming `@tanstack/svelte-query` mutations, formatting monetary values using IDR integer rules, and providing rapid feedback (<10s deposit workflow).
