# Technical Specification (TargetMoneh)

**Version:** 1.0.0  
**Reference PRD:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)  
**Main Index:** [README.md](../README.md)

This document details the system layer, framework stack, and core logic components for TargetMoneh. It acts as the bridge between product requirements and physical implementation.

---

## 1. Core Technology Stack

- **Framework:** SvelteKit 2 (using Svelte 4)
- **Styling:** Tailwind CSS + Lucide Icons
- **State & Data Fetching:** `@tanstack/svelte-query`
- **Authentication:** Supabase Auth + `@supabase/ssr`
- **Database:** Supabase PostgreSQL (`bigint` for IDR amounts)
- **Serverless/Background Compute:** Supabase Edge Functions
- **External Integration:** Google Apps Script Web App (Spreadsheet Sync)

---

## 2. Issue & Roadmap Traceability Matrix (v1.0 MVP)

| Issue | Module Name | Primary Responsibilities | Reference Doc |
| :--- | :--- | :--- | :--- |
| [#1](https://github.com/novianr90/target-moneh/issues/1) | Auth & Session Infrastructure | Supabase Auth + `@supabase/ssr` cookies & route guards | §3, [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| [#2](https://github.com/novianr90/target-moneh/issues/2) | Accounts Metadata (`saving_accounts`) | CRUD & Archive lifecycle for source accounts | §5.1, [DATABASE.md](DATABASE.md) §2.1 |
| [#3](https://github.com/novianr90/target-moneh/issues/3) | Category Master (`saving_categories`) | CRUD & Archive lifecycle for categories | §5.2, [DATABASE.md](DATABASE.md) §2.2 |
| [#4](https://github.com/novianr90/target-moneh/issues/4) | Goal Targets (`saving_targets`) | Goal creation, deadlines, priority, pause/cancel | §5.3, [DATABASE.md](DATABASE.md) §2.3 |
| [#5](https://github.com/novianr90/target-moneh/issues/5) | Transactions (`saving_transactions`) | Deposits, withdrawals, atomic balance validation | §5.4, [DATABASE.md](DATABASE.md) §2.4 |
| [#6](https://github.com/novianr90/target-moneh/issues/6) | Balance View & Security | `v_saving_target_balances` & RLS composite policies | §6.4, [DATABASE.md](DATABASE.md) §3.1 |
| [#7](https://github.com/novianr90/target-moneh/issues/7) | Deterministic Recommendation Engine | Required monthly, Velocity, Forecast, Health math | §7, `src/lib/engines/` |
| [#8](https://github.com/novianr90/target-moneh/issues/8) | Dashboard & Timeline UI | Hero Card, Total Active Balance, Goal Cards, FAB | §5.5, [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| [#9](https://github.com/novianr90/target-moneh/issues/9) | Spreadsheet Sync Engine | Edge Function `sync-savings` proxy to GAS Web App | §8, [SPREADSHEET.md](SPREADSHEET.md) |

---

## 3. Authentication & Session Strategy

TargetMoneh completely delegates authentication to **Supabase Auth**.

### Implementation Rules
- **No Custom Auth Components:** Rely exclusively on Supabase's native user tables and session models.
- **Server-Side Session Resolution:** Use `@supabase/ssr` in `hooks.server.ts` to manage HTTP-only cookies.
- **Client-Side Hydration:** The session is securely passed to the client via root `+layout.server.ts` and managed in SvelteKit stores / TanStack Query contexts.
- **Route Guards:** Implementation of strict SvelteKit middleware guards logic checking `event.locals.getSession()` before granting route access. Unauthenticated users are redirected to `/auth`.

---

## 4. Data Fetching & State Management

**Tool:** `@tanstack/svelte-query`

### Patterns
- **Queries:** Use for read-heavy operations (e.g., fetching dashboard summaries, target lists, transaction history).
  - Must utilize aggressive caching (stale-time configuration based on component needs) to minimize DB calls.
  - Invalidate selectively (e.g., invalidate `targetBalances` and `transactions` list upon a successful deposit mutation).
- **Mutations:** Use for all writes (inserts/updates/deletions).
  - Optimistic UI updates are recommended for rapid entry transactions (<10s goal requirement).
- **No Global Stores for Data:** Use Svelte context/stores exclusively for pure UI state (e.g., sidebar toggles, modal open/close). Persistent data must live in TanStack Query.

---

## 5. UI/UX Principles (v1.0)

- **Speed:** The transaction modal must be launchable via a Floating Action Button (FAB) and completeable via keyboard within 10 seconds.
- **No Cents:** All formatting utilizes IDR integer rounding (`new Intl.NumberFormat('id-ID')` without decimals).
- **Goal Health Badges:** Calculated deterministically based on the recommendation engine rules, updating dynamically on load.

---

## 6. Calculation Engine Implementation

The engine runs on the client-side/server-side logic based on fetched transaction histories and goal properties. It is deterministic.

### 6.1 Remaining Contribution Periods ($N_{months}$)
```typescript
function getRemainingMonths(targetDate: Date, today: Date = new Date()): number {
  return (targetDate.getFullYear() - today.getFullYear()) * 12 +
         (targetDate.getMonth() - today.getMonth());
}
```

### 6.2 Required Monthly Savings
```typescript
function getRequiredMonthlySavings(balance: number, target: number, remainingMonths: number): number {
  if (balance >= target) return 0;
  if (remainingMonths < 0) return -1; // Overdue signal
  if (remainingMonths === 0) return target - balance;
  return (target - balance) / remainingMonths;
}
```

### 6.3 Savings Velocity
Calculates net velocity over the last 6 completed calendar months.

1. Filter transactions to exclude the current incomplete month.
2. Filter transactions to exclude anything prior to `velocity_start` (start_date vs first_transaction).
3. Group remaining valid transactions by month.
4. Take up to the 6 most recent months from that group.
5. `Velocity = sum(net contributions in those months) / count(months)`

### 6.4 Forecast Projection
```typescript
function getProjectedMonths(balance: number, target: number, velocity: number): number | 'infinite' {
  if (balance >= target) return 0;
  if (velocity <= 0) return 'infinite';
  return Math.ceil((target - balance) / velocity);
}
```

---

## 7. Integrations: Spreadsheet Sync

**Mechanism:** Manual trigger via user interface.
**Path:** Client -> SvelteKit API Route -> Supabase Edge Function -> Google Apps Script -> Google Sheet.

- **Security:** The edge function holds the `GAS_API_KEY` secret.
- **Payload:** Raw transaction exports and summary views fetched via Supabase service role or user JWT proxy, structured as JSON to post to GAS.
