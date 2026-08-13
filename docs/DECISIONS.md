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

## ADR 2: `@tanstack/svelte-query` for Data Fetching & Optimistic State

**Date:** August 2026  
**Status:** Accepted  

**Context:**  
TargetMoneh has a strict `< 10 seconds` rapid deposit entry requirement. Waiting for server roundtrips to invalidate and refetch data upon every small transaction can make the UI feel sluggish.

**Decision:**  
Use `@tanstack/svelte-query` for client-side data fetching, state management, and optimistic cache invalidations, bypassing SvelteKit's `load` for non-critical dynamic data.

**Consequences:**  
- **Pros:** Aggressive caching, instant Optimistic UI updates, and responsive user experiences.
- **Cons:** Bypasses SvelteKit's built-in SSR data hydration for dynamic query hooks.

---

## ADR 3: Edge Function Proxy for External Sync

**Date:** August 2026  
**Status:** Accepted  

**Context:**  
The application needs to sync data to a Google Spreadsheet via a Google Apps Script (GAS) Web App. Doing this directly from the SvelteKit client would expose secrets in the browser's network tab.

**Decision:**  
Implement the synchronization logic inside a Supabase Edge Function (`sync-savings`). The client calls the Edge Function, which securely holds the secrets and communicates with Google.

**Consequences:**  
- **Pros:** Total security of third-party API credentials.
- **Cons:** Requires managing Supabase Edge Functions deployment and secrets management alongside the frontend app.

---

## ADR 4: BigInt for Monetary Values (IDR Currency)

**Date:** August 2026  
**Status:** Accepted  

**Context:**  
TargetMoneh tracks Indonesian Rupiah (IDR), which does not use decimal cents in daily personal finance.

**Decision:**  
Use PostgreSQL `bigint` for all monetary columns (`amount`, `target_amount`). 

**Consequences:**  
- **Pros:** Avoids floating-point precision errors entirely. Standardizes all math operations.
- **Cons:** If multi-currency is introduced in v2.0, a migration strategy to `numeric` will be required.

---

## ADR 5: Soft-Archive Lifecycle for Master Data Entities

**Date:** August 2026  
**Status:** Accepted  

**Context:**  
Master data entities (`saving_accounts` and `saving_categories`) tag goals and transactions. Hard-deleting master records would break foreign keys or orphan historical audit logs.

**Decision:**  
Master data entities use a soft-archive lifecycle via an `archived_at timestamptz NULL` column:
- Active entities have `archived_at IS NULL`.
- Archived entities (`archived_at IS NOT NULL`) remain visible on historical records for audit integrity, but are excluded from active selectors when creating new goals or transactions.

**Consequences:**  
- **Pros:** 100% historical audit integrity without broken foreign keys.
- **Cons:** Requires explicit query filtering on selection components across the application.

---

## ADR 6: Database Trigger & Row Lock for Concurrency-Safe Withdrawal Validation

**Date:** August 2026  
**Status:** Accepted  

**Context:**  
Allowing withdrawal transactions could potentially drive a goal's current balance negative if multiple withdrawal requests occur concurrently or if a user attempts to withdraw more than accumulated deposits.

**Decision:**  
Implement database-level validation via a PL/pgSQL trigger `fn_validate_withdrawal()` executing `BEFORE INSERT OR UPDATE ON saving_transactions`. For withdrawal operations, the trigger acquires an explicit `FOR UPDATE` row lock on `saving_targets` to serialize concurrent requests, computes effective net balance, and rejects any withdrawal exceeding available goal balance.

**Consequences:**  
- **Pros:** Authoritative, concurrency-safe guarantee against goal balance overdrafts at the database level.
- **Cons:** Brief row locking on `saving_targets` during withdrawal writes (negligible performance impact for personal finance scale).
