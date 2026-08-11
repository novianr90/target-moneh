# TargetMoneh 🎯

> **Personal Savings & Goal Allocation Tracker**  
> Lightweight, high-performance financial goal tracker focusing on monetary target allocations, savings velocity, and deterministic deadline projections.

---

## 📌 Product Overview & Positioning

**TargetMoneh** answers four core financial questions:
1. **Goal Allocation:** How much money has been allocated towards a specific financial goal?
2. **Target Goal:** What is the target monetary goal amount?
3. **Pace & Health:** Is the user on-track to reach the target deadline on time?
4. **Forecast:** When is the goal projected to be completed based on savings velocity?

> [!IMPORTANT]
> TargetMoneh is **NOT** a bank account balance ledger and **NOT** an expense tracker. Actual money lives in external bank accounts. TargetMoneh tracks the mental and financial *allocation* of funds toward designated goals.

---

## 🛠️ Technology Stack

- **Frontend Meta-Framework:** [SvelteKit 2](https://kit.svelte.dev/) (Svelte 4)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **State & Caching:** [`@tanstack/svelte-query`](https://tanstack.com/query/latest)
- **Authentication & Identity:** [Supabase Auth](https://supabase.com/docs/guides/auth) (Email/Password)
- **Session Layer:** [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/sveltekit) (HTTP-only cookies)
- **Database:** Supabase PostgreSQL (`bigint` currency in IDR, Composite FKs, RLS)
- **Serverless Edge Functions:** Supabase Edge Functions (Spreadsheet Sync Proxy)
- **Reporting Sync:** Google Apps Script Web App -> Google Spreadsheet

---

## 📚 Complete Documentation Architecture

The system design, database architecture, and operational workflows are fully documented in the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
| 📋 [PRD-Personal-Savings-Tracker.md](docs/PRD-Personal-Savings-Tracker.md) | Authoritative Product Requirements Document (PRD v3.2.2). |
| 📐 [TECHNICAL-SPECIFICATION.md](docs/TECHNICAL-SPECIFICATION.md) | Technical Spec for SvelteKit, `@supabase/ssr`, TanStack Query, and Engine Math. |
| 🗄️ [DATABASE.md](docs/DATABASE.md) | PostgreSQL Schema, Composite FKs, RLS Policies, Triggers (`fn_validate_withdrawal`), & Views. |
| 🧱 [ARCHITECTURE.md](docs/ARCHITECTURE.md) | High-Level Architecture Diagrams, Data Flows, and Edge Function Security Paths. |
| 📁 [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | SvelteKit Directory Layout, Route Isolation, and Component Boundaries. |
| ⚡ [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Supabase CLI Setup, Local Migration Workflows, & Environment Variables. |
| 📊 [SPREADSHEET.md](docs/SPREADSHEET.md) | Google Sheets Template & Google Apps Script (GAS) Deployment Guide. |
| ⏰ [SCHEDULED.md](docs/SCHEDULED.md) | Automated Background Sync via `pg_cron` & `pg_net` (v1.1). |
| 🚀 [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel Deployment Sequence, Secrets, & Disaster Recovery Procedures. |
| ⚖️ [DECISIONS.md](docs/DECISIONS.md) | Architecture Decision Records (ADRs) detailing core technical choices. |

---

## 🗺️ Product Roadmap & GitHub Tracking

The development roadmap is divided into milestones and tracked via GitHub Issues:

### 🚀 Milestone 1: [`v1.0 - Core Production MVP`](https://github.com/novianr90/target-moneh/milestone/1)
- [#1 `[v1.0] Authentication & Session Infrastructure`](https://github.com/novianr90/target-moneh/issues/1)
- [#2 `[v1.0] Source Account Metadata Management (saving_accounts)`](https://github.com/novianr90/target-moneh/issues/2)
- [#3 `[v1.0] Category Master Data Management (saving_categories)`](https://github.com/novianr90/target-moneh/issues/3)
- [#4 `[v1.0] Savings Goal Target Management (saving_targets)`](https://github.com/novianr90/target-moneh/issues/4)
- [#5 `[v1.0] Rapid Savings Transactions & Concurrency Safety (saving_transactions)`](https://github.com/novianr90/target-moneh/issues/5)
- [#6 `[v1.0] Authoritative Balance View & RLS Security Isolation`](https://github.com/novianr90/target-moneh/issues/6)
- [#7 `[v1.0] Recommendation Engine & Deterministic Logic Engine`](https://github.com/novianr90/target-moneh/issues/7)
- [#8 `[v1.0] Dashboard & Timeline User Interface`](https://github.com/novianr90/target-moneh/issues/8)
- [#9 `[v1.0] Manual Google Spreadsheet Sync Engine`](https://github.com/novianr90/target-moneh/issues/9)

### 📈 Milestone 2: [`v1.1 - Quality of Life & Planned Contributions`](https://github.com/novianr90/target-moneh/milestone/2)
- [#10 `[v1.1] Planned Contributions & Audit Invariants (planned_contributions)`](https://github.com/novianr90/target-moneh/issues/10)
- [#11 `[v1.1] Hybrid Forecast Engine (Month-by-Month Iteration)`](https://github.com/novianr90/target-moneh/issues/11)
- [#12 `[v1.1] Advanced Transaction Search & Filtering`](https://github.com/novianr90/target-moneh/issues/12)
- [#13 `[v1.1] Automated Nightly Spreadsheet Sync (pg_cron)`](https://github.com/novianr90/target-moneh/issues/13)

### ⚙️ Milestone 3: [`v1.2 - Savings Automation & Allocation`](https://github.com/novianr90/target-moneh/milestone/3)
- [#14 `[v1.2] Auto-Allocation Calculator & Contribution Presets`](https://github.com/novianr90/target-moneh/issues/14)

### 📊 Milestone 4: [`v1.3 - Investment & Yield Awareness`](https://github.com/novianr90/target-moneh/milestone/4)
- [#15 `[v1.3] Yield & Interest Tracking Metadata`](https://github.com/novianr90/target-moneh/issues/15)

### 👥 Milestone 5: [`v1.4 - Household / Shared Goals`](https://github.com/novianr90/target-moneh/milestone/5)
- [#16 `[v1.4] Shared Household Goals & Attribution`](https://github.com/novianr90/target-moneh/issues/16)

### 🌐 Milestone 6: [`v2.0 - Unified Financial Platform`](https://github.com/novianr90/target-moneh/milestone/6)
- [#17 `[v2.0] TrackerMoneh Integration & Unified Net Worth Platform`](https://github.com/novianr90/target-moneh/issues/17)
