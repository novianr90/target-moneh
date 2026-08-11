# System Architecture (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document visualizes the high-level architecture, component flows, and data paths for the TargetMoneh application.

---

## 1. High-Level Architecture Diagram

TargetMoneh is a standard 3-tier application leveraging Supabase as an overarching Backend-as-a-Service (BaaS), coupled with SvelteKit as a full-stack meta-framework.

```text
               User (Mobile / Desktop Web)
                            │
                            ▼
             SvelteKit Web App (Frontend + SSR)
              (SvelteKit 2 + Tailwind CSS)
        ┌───────────────────────────────────────┐
        │ - TanStack Query (Client State)       │
        │ - @supabase/ssr (Auth Cookies)        │
        └───────────────────┬───────────────────┘
                            │
                            ▼
                   Supabase Platform
    ┌───────────────────────────────────────────────┐
    │ - Supabase Auth (Identity Provider)           │
    │ - PostgreSQL (DB, RLS, Views, Triggers)       │
    │ - Edge Function (Spreadsheet Sync Engine)     │
    └───────────────────────┬───────────────────────┘
                            │ (API Key Authentication)
                            ▼
                Google Apps Script Web App
                            │
                            ▼
                  Google Spreadsheet
```

---

## 2. Authentication & Data Flow

TargetMoneh relies on `@supabase/ssr` to synchronize Supabase Auth sessions between the SvelteKit server and the client browser.

1. **Login Flow:** User submits credentials -> Client hits Supabase Auth API -> Returns Session -> Client forwards session to SvelteKit server endpoint (or `hooks.server.ts` handles it) to set an HTTP-only secure cookie.
2. **Subsequent Requests:** Browser sends cookie -> `hooks.server.ts` parses it -> populates `event.locals.getSession()`.
3. **Data Fetching:**
   - TanStack Query executes fetches from the client side directly to Supabase PostgREST endpoints.
   - Because the user is authenticated, the Supabase JS client sends the valid JWT.
   - PostgreSQL RLS intercepts the request and strictly scopes all returned data to `auth.uid()`.

---

## 3. Calculation Engine & State Separation

### Client-Side vs Server/DB Side
- **Database (PostgreSQL):** Owns the single source of truth for the `current_balance` via `v_saving_target_balances`. It enforces invariant rules (e.g., withdrawal cannot exceed balance).
- **Client (TanStack Query):** Caches the balances, transactions, and goals.
- **Client (Engine/UI):** Computes Goal Health, Savings Velocity, and Forecasts purely in the browser based on the cached data.

```text
[ PostgreSQL ] --(raw data)--> [ TanStack Query Cache ] --(Velocity/Forecast math)--> [ UI Components ]
```

---

## 4. Spreadsheet Sync Architecture

To prevent exposing Google API keys or Google Apps Script (GAS) endpoints to the public internet or client browsers, synchronization operates through a trusted serverless layer.

1. **Client Trigger:** User clicks "Sync to Sheets". TanStack mutation calls the Supabase Edge Function `sync-savings`.
2. **Edge Function:**
   - Authenticates the user via the passed JWT.
   - Queries the database for the user's balances and transactions using the user's JWT context (so RLS is respected even inside the Edge Function).
   - Retrieves the `GAS_API_KEY` from secure server-side secrets.
   - Makes an HTTP POST request to the Google Apps Script Web App payload.
3. **Google Apps Script:**
   - Validates the API key.
   - Parses the JSON payload.
   - Updates Tab 1 (Summary) and Tab 2 (Logs) on the target Google Sheet.
