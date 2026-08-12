# Architecture Decision Records (ADRs)

**Version:** 1.0.0

This document tracks major architectural decisions for TargetMoneh to provide context for future maintainers.

---

## ADR 1: Use of Composite Foreign Keys alongside RLS

**Date:** August 2026
**Status:** Accepted

**Context:** 
TargetMoneh is a multi-tenant application where users own their data. Row-Level Security (RLS) is standard in Supabase for restricting read/write access. However, RLS does not prevent a malicious user from *referencing* another user's records via foreign keys (e.g., assigning a transaction to someone else's target), provided the other user's ID is known or guessed.

**Decision:** 
We mandate the use of Composite Foreign Keys `(id, user_id)` for all relational linkages between user-owned tables. 
- Parent tables expose a `UNIQUE (id, user_id)` constraint.
- Child tables reference `FOREIGN KEY (parent_id, user_id)`.

**Consequences:** 
- **Pros:** 100% database-level guarantee against cross-user data corruption or referencing.
- **Cons:** Slightly more verbose SQL schema and requires `user_id` to be present on every table.

---

## ADR 2: `@tanstack/svelte-query` for Data Fetching

**Date:** August 2026
**Status:** Accepted

**Context:** 
SvelteKit provides native `load` functions for data fetching. However, TargetMoneh has a strict `< 10 seconds` rapid deposit entry requirement. Waiting for server roundtrips to invalidate and refetch data upon every small transaction can make the UI feel sluggish.

**Decision:** 
Use `@tanstack/svelte-query` for client-side data fetching and state management, bypassing SvelteKit's `load` for non-critical dynamic data.

**Consequences:** 
- **Pros:** Allows for aggressive caching, instant Optimistic UI updates (updating the balance locally before the DB confirms), and highly responsive user experiences.
- **Cons:** Bypasses SvelteKit's built-in SSR data hydration for these specific queries, meaning a slight delay on initial page load as the client fetches data. (Acceptable for an authenticated dashboard app).

---

## ADR 3: Edge Function for Spreadsheet Sync

**Date:** August 2026
**Status:** Accepted

**Context:** 
The application needs to sync data to a Google Spreadsheet via a Google Apps Script (GAS) Web App. Doing this directly from the SvelteKit client would expose the GAS URL and API Key in the browser's network tab.

**Decision:** 
Implement the synchronization logic inside a Supabase Edge Function (`sync-savings`). The client calls the Edge Function, which securely holds the secrets and communicates with Google.

**Consequences:** 
- **Pros:** Total security of third-party API credentials.
- **Cons:** Requires managing Supabase Edge Functions deployment and secrets management alongside the frontend app.

---

## ADR 4: BigInt for Monetary Values

**Date:** August 2026
**Status:** Accepted

**Context:** 
TargetMoneh tracks Indonesian Rupiah (IDR), which generally does not use decimal cents in daily personal finance.

**Decision:** 
Use PostgreSQL `bigint` for all monetary columns (`amount`, `target_amount`). 

**Consequences:** 
- **Pros:** Avoids floating-point precision errors entirely. Standardizes all math operations.
- **Cons:** If multi-currency (USD) is ever introduced in v2.0, a migration strategy to `numeric` or storing cents/pennies will be required. (Multi-currency is explicitly Out of Scope for v1.0).

---

## ADR 5: Soft-Archive Lifecycle for Master Data Entities

**Date:** August 2026
**Status:** Accepted

**Context:** 
TargetMoneh uses master data entities (`saving_accounts` and `saving_categories`) to tag savings goals and financial transactions. If a user deletes a bank account tag or a goal category tag that was previously attached to historical transactions or active goals, hard-deleting the row would either break foreign key constraints or orphan historical financial audit logs.

**Decision:** 
Master data entities (`saving_accounts` and `saving_categories`) are **never hard-deleted**. Instead, a soft-archive lifecycle mechanism is implemented via an `archived_at` timestamp:
- Active entities have `archived_at IS NULL`.
- Archived entities (`archived_at IS NOT NULL`) remain visible on historical targets and transactions for audit integrity, but are filtered out from selection dropdowns when creating new goals or transactions.
- Restoration (un-archiving) is supported by resetting `archived_at` to `NULL`.

**Consequences:** 
- **Pros:** Guarantees 100% historical data integrity and audit trailing without broken references or deleted foreign keys.
- **Cons:** Requires explicit query filtering (`.is('archived_at', null)`) on selection components across the application.
