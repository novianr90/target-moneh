# Technical Specification (TargetMoneh)

**Version:** 1.0.0  
**Reference PRD:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)  
**Main Index:** [README.md](../README.md)

This document details the system layer, framework stack, core logic components, and architectural approaches implemented for TargetMoneh across Issues #1 through #8.

---

## 1. Core Technology Stack

- **Framework:** SvelteKit 2 (using Svelte 5 runes `$state`, `$derived`, `$effect`, `$props`)
- **Styling:** Tailwind CSS + Lucide Icons (`@lucide/svelte`)
- **Date Utilities:** Flatpickr (`flatpickr`)
- **State & Data Fetching:** `@tanstack/svelte-query`
- **Authentication:** Supabase Auth + `@supabase/ssr`
- **Database:** Supabase PostgreSQL (`bigint` for IDR amounts without decimal cents)
- **Serverless/Background Compute:** Supabase Edge Functions
- **External Integration:** Google Apps Script Web App (Spreadsheet Sync)

---

## 2. Issue Implementation & Architectural Approaches Matrix

| Issue | Module / Feature Name | Technical Approach & Architectural Design | Primary Files / Components | Reference Docs |
| :--- | :--- | :--- | :--- | :--- |
| [#1](https://github.com/novianr90/target-moneh/issues/1) | Auth & Session Infrastructure | Cookie-based SSR authentication via `@supabase/ssr`. `hooks.server.ts` resolves server session and enforces mandatory route guards. | `src/hooks.server.ts`, `src/routes/+layout.server.ts`, `src/routes/auth/` | §3, [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| [#2](https://github.com/novianr90/target-moneh/issues/2) | Source Account Metadata (`saving_accounts`) | CRUD with soft-archiving (`archived_at timestamptz NULL`). Composite FK constraints ensure account ownership. DB enforces `ON DELETE RESTRICT` against active references. | `src/lib/services/accounts.ts`, `src/routes/accounts/` | §5.1, [DATABASE.md](DATABASE.md) §2.1 |
| [#3](https://github.com/novianr90/target-moneh/issues/3) | Category Master Data (`saving_categories`) | Custom icon & color selection with soft-archiving. Pre-seeded defaults (`Seed` script). | `src/lib/services/categories.ts`, `src/routes/categories/` | §5.2, [DATABASE.md](DATABASE.md) §2.2 |
| [#4](https://github.com/novianr90/target-moneh/issues/4) | Goal Targets (`saving_targets`) | Goal creation with target amount, deadline date, priority (`high`, `medium`, `low`), and status (`active`, `paused`, `cancelled`). Flatpickr integration with preset date pickers. DB `ON DELETE RESTRICT` prevents hard-deleting goals with transaction history. | `src/lib/services/targets.ts`, `src/routes/targets/`, `TargetModal.svelte` | §5.3, [DATABASE.md](DATABASE.md) §2.3 |
| [#5](https://github.com/novianr90/target-moneh/issues/5) | Rapid Savings Transactions (`saving_transactions`) | Support for `deposit` and `withdrawal` transactions. Client-side input formatting (`IDR`) and optimistic updates via TanStack Query invalidation. | `src/lib/services/transactions.ts`, `src/routes/transactions/` | §5.4, [DATABASE.md](DATABASE.md) §2.4 |
| [#6](https://github.com/novianr90/target-moneh/issues/6) | Authoritative Balance View & RLS Security | `v_saving_target_balances` PostgreSQL view with `security_invoker = true`. Concurrency-safe PL/pgSQL database trigger (`fn_validate_withdrawal`) acquiring `FOR UPDATE` row lock on target to prevent overdrafts. | `supabase/migrations/`, `v_saving_target_balances` | §6.4, [DATABASE.md](DATABASE.md) §3.1, §4.1 |
| [#7](https://github.com/novianr90/target-moneh/issues/7) | Deterministic Recommendation Engine | Pure TypeScript calculation engine (`src/lib/engines/`). Evaluates $N_{\text{months}}$, Required Monthly Savings, 6-month capped historical Savings Velocity, Forecast Completion, and Goal Health (Achieved 🎉 > Overdue 🔴 > On Track 🟢 > Needs Attention 🟡 > Behind Schedule 🔴 > Paused ⏸️ > Cancelled ⚫). | `src/lib/engines/` (`periods.ts`, `velocity.ts`, `forecast.ts`, `health.ts`, `recommendation.ts`) | §7, `src/lib/engines/` |
| [#8](https://github.com/novianr90/target-moneh/issues/8) | Dashboard & Timeline UI | Hero Target Card featuring highest-priority active goal, Total Active Goal Balance, Savings Timeline with dedicated **Current-Month Indicator** (PRD §7.3), Quick Deposit FAB & Modal with autofocus for sub-10 second rapid deposit entry. | `src/routes/+page.svelte`, `HeroTargetCard.svelte`, `SavingsTimeline.svelte`, `QuickDepositFAB.svelte`, `QuickDepositModal.svelte`, `DashboardGoalList.svelte` | §5.5, [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |

---

## 3. Detailed Component & Subsystem Architecture

### 3.1 Authentication & Session Strategy
- **Server-Side Session Resolution:** `@supabase/ssr` in `hooks.server.ts` inspects HTTP-only session cookies.
- **Route Guarding:** Unauthenticated requests attempting to access protected application routes are redirected to `/auth` with HTTP 303.
- **Cookie Security:** Auth tokens utilize custom scoped cookie names (`sb-target-moneh-auth-token`).

### 3.2 Authoritative Database & Security Layer
- **Row-Level Security (RLS):** Enabled on all tables; policies restrict operations to `auth.uid() = user_id`.
- **Composite Foreign Keys:** Parent tables declare `UNIQUE (id, user_id)` and child tables enforce `FOREIGN KEY (parent_id, user_id)` to prevent cross-tenant record linking.
- **Authoritative Balance View:** `v_saving_target_balances` aggregates net deposits minus withdrawals using `security_invoker = true`.
- **Concurrency-Safe Withdrawal Lock:** Database trigger `fn_validate_withdrawal()` executes `BEFORE INSERT OR UPDATE` on `saving_transactions`, acquiring an explicit `FOR UPDATE` lock on `saving_targets` to serialize concurrent requests and guarantee non-negative goal balances.

### 3.3 Recommendation & Forecast Engine Logic
All metric calculations are pure, deterministic TypeScript functions isolated in `src/lib/engines/`:
- **Remaining Months ($N_{\text{months}}$):** Calendar-month delta count (`(targetYear - todayYear) * 12 + (targetMonth - todayMonth)`).
- **Required Monthly Savings:** $0$ if Achieved; `null` if Overdue ($N_{\text{months}} < 0$); $\text{remaining} / N_{\text{months}}$ for $N_{\text{months}} \ge 1$.
- **Savings Velocity:** Average net contribution across up to the latest 6 **completed** calendar months (`velocity_end` = last day of previous month). Excludes the current incomplete month to prevent mid-month status skewing.
- **Forecast Completion:** $\lceil \text{remaining} / \text{velocity} \rceil$ calendar months added to today's month, or `"Not achievable at current rate"` if velocity $\le 0$.
- **Goal Health Precedence:**
  1. Achieved 🎉 (`current_balance >= target_amount`)
  2. Overdue 🔴 ($N_{\text{months}} < 0$)
  3. On Track 🟢 (`velocity >= required`)
  4. Needs Attention 🟡 (`velocity >= 0.70 * required`)
  5. Behind Schedule 🔴 (`velocity < 0.70 * required` or `velocity <= 0`)

### 3.4 Dashboard & User Experience (< 10s Rapid Entry)
- **Hero Target Card:** Prominently features the active goal with highest priority (`high` > `medium` > `low`) and closest deadline.
- **Savings Timeline:** Visual month-by-month breakdown comparing Actual Net Contribution vs Required Monthly Target for recent months, featuring a explicit **Current-Month Indicator** badge.
- **Quick Deposit FAB & Modal:** Floating Action Button fixed at bottom right launching modal with immediate **autofocus** on the amount input field, quick preset IDR buttons (+100k, +250k, +500k, +1M, +2M, +5M), and keyboard navigation (ESC/Enter) allowing completion in under 10 seconds.
