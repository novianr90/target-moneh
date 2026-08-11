# Personal Savings & Target Tracker PRD (TargetMoneh)

**Version:** 3.2.2  
**Status:** Approved Implementation-Ready Spec  
**Reference Codebase Concept:** [Personal Expense Tracker (TrackerMoneh)](PRD-Personal-Expense-Tracker.md)

---

# 1. Product Positioning & Overview

**TargetMoneh** is a lightweight, high-performance **Goal & Savings Allocation Tracker**, NOT a bank account balance ledger and NOT an expense tracker.

## 1.1 Product Positioning & Domain Boundaries
TargetMoneh focuses exclusively on answering four core financial questions:
1. **Goal Allocation:** How much money has been allocated towards a specific financial goal?
2. **Target Goal:** What is the target monetary goal amount?
3. **Pace & Health:** Is the user on-track to reach the target deadline on time?
4. **Forecast:** When is the goal projected to be completed based on savings velocity?

### Strict Separation of Responsibilities from Expense Tracker
| Domain | Owned By |
| :--- | :--- |
| Income, Expenses, Cashflow, Actual Account/Money Movement | **TrackerMoneh** (Expense Tracker) |
| Savings Goal Allocation, Target Progress, Velocity, Forecast | **TargetMoneh** (Savings Tracker) |

TargetMoneh does **NOT** duplicate income/expense tracking, bank account ledgers, or cashflow statements. Actual money lives in external bank accounts; TargetMoneh tracks the mental and financial *allocation* of funds towards designated goals.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Future Unified Financial Suite (v2.0)                │
├───────────────────────────────────┬─────────────────────────────────────┤
│      TrackerMoneh (Cashflow)      │     TargetMoneh (Goal Allocation)   │
│ - Income                          │ - Savings Goals & Buckets           │
│ - Expenses                        │ - Deposits & Withdrawal Allocations │
│ - Daily Cashflow                  │ - Savings Velocity & Forecasts      │
└───────────────────────────────────┴─────────────────────────────────────┘
```

---

## 1.2 Core Product Goals
- **Rapid Deposit Entry:** Record savings allocations/deposits in `< 10 seconds` on mobile and desktop web.
- **Goal-Driven Tracking:** Clear visual progress towards monetary targets with automated deadline projections.
- **Deterministic Recommendation Engine:** Expose Required Monthly Savings, Current Savings Velocity, and Projected Completion Month with zero ambiguity.
- **Single Source of Truth:** Balance is strictly transaction-derived (`SUM(deposits) - SUM(withdrawals)`). No duplicate stored balance column.
- **Relational Ownership & Security:** Composite Foreign Keys prevent cross-user data reference at DB level. `security_invoker` views enforce RLS on derived data.
- **Spreadsheet Integration:** Manual 1-way sync to Google Sheets for reporting and monthly financial reviews.

---

# 2. Target Users & Access Control

- **Primary Users:** User A (Owner) and User B (Spouse / Partner).
- **Data Isolation:** Each user owns their specific savings targets, transactions, and account metadata. Enforced via Supabase RLS (`auth.uid() = user_id`) and relational composite foreign keys.
- **Shared Household Goals:** Deferred to `v1.4`.

---

# 3. Authentication Architecture

TargetMoneh uses **Supabase Auth** as the sole, authoritative identity and authentication provider. No custom authentication system is designed, implemented, or required.

```text
Supabase Auth
    → Identity & Authentication Provider
    → Email/Password authentication
    → Password management
    → Session/token lifecycle

@supabase/ssr
    → SvelteKit server-side integration layer
    → HTTP-only cookie session handling
    → NOT the authentication provider itself

PostgreSQL RLS
    → Database-level authorization
    → Row ownership enforcement via auth.uid()
```

### Authentication Scope (v1.0)
- Email & Password login (native Supabase Auth).
- Persistent sessions via HTTP-only cookies managed by `@supabase/ssr`.
- Reactive SvelteKit auth state invalidation on logout.
- Application-level route protection (SvelteKit hooks/middleware).

### Authentication Non-Goals
- No custom JWT issuance.
- No custom password hashing.
- No custom user tables.
- No custom authentication APIs.
- No session infrastructure outside Supabase Auth.

---

# 4. System Architecture & Tech Stack

```text
               User (Mobile / Desktop Web)
                            │
                            ▼
                    SvelteKit Web App
              (SvelteKit 2 + Tailwind CSS)
                            │
                            ▼
                  Supabase Platform
   ┌───────────────────────────────────────────────┐
   │ - Supabase Auth (Identity Provider)           │
   │ - @supabase/ssr (SvelteKit Session Layer)     │
   │ - PostgreSQL (bigint currency in IDR)         │
   │ - Security-Invoker Balance View               │
   │ - Row Level Security (RLS) + Composite FKs    │
   │ - Edge Function (Spreadsheet Sync Engine)     │
   └───────────────────────┬───────────────────────┘
                           │ (API Key Authentication)
                           ▼
               Google Apps Script Web App
                           │
                           ▼
                 Google Spreadsheet
             (Savings Audit & Monthly Review)
```

## Tech Stack Specifications
- **Frontend Framework:** SvelteKit 2 (Svelte 4)
- **UI Components & Styling:** Tailwind CSS, Lucide Icons
- **State Management & Data Fetching:** `@tanstack/svelte-query`
- **Authentication Provider:** Supabase Auth (Email/Password)
- **Session Integration:** `@supabase/ssr` (server-side HTTP-only cookies)
- **Database & Authorization:** Supabase PostgreSQL, RLS, Composite FKs, Edge Functions
- **Currency Format:** `bigint` (Indonesian Rupiah / IDR without decimal cents)
- **Reporting Target:** Google Spreadsheet via Google Apps Script Web App (Manual Sync)

---

# 5. Functional Requirements (v1.0 Modules)

## 5.1 Module: Source Account Metadata (`saving_accounts`)
Accounts serve purely as **metadata & source-of-funds tagging** (e.g., BCA, Mandiri, Cash, Bibit) for savings transactions. They are **NOT** bank balance ledgers. Actual account balances are outside TargetMoneh's scope.

### Functional Capabilities
- Create and edit account tags.
- Archive accounts (set `archived_at`).
- Archived accounts remain visible in historical transaction records but cannot be selected for new transactions.
- Restoration (un-archive) is supported.
- Accounts are **never hard-deleted**. Archive/unarchive is the only lifecycle mechanism.

### Attributes
- `name` (e.g., "BCA", "Mandiri", "Bibit")
- `type` (`bank`, `wallet`, `investment`, `cash`)
- `archived_at` (`NULL` = active, `NOT NULL` = archived)

---

## 5.2 Module: Category Management (`saving_categories`)
Dynamic master data for organizing savings goals.

### Functional Capabilities
- Create and edit categories.
- Archive categories (set `archived_at`).
- Archived categories remain visible on historical targets but cannot be selected for new targets.
- Restoration (un-archive) is supported.
- Categories are **never hard-deleted**. Archive/unarchive is the only lifecycle mechanism.

### Attributes
- `name` (e.g., "Emergency", "Property", "Vacation", "Gadget")
- `icon` (Lucide icon identifier)
- `color` (Hex color code)
- `archived_at` (`NULL` = active, `NOT NULL` = archived)

---

## 5.3 Module: Savings Goal Management (`saving_targets`)
Users can create, edit, pause, or cancel monetary savings targets.

### Attributes
- `title` (e.g., "Dana Darurat 6 Bulan", "DP Rumah", "Liburan Japan")
- `target_amount` (e.g., Rp 50.000.000 — stored, authoritative value)
- `start_date` (Start date)
- `target_date` (Target completion deadline; must be `>= start_date`)
- `category_id` (FK to `saving_categories`, **optional**. A goal may exist without a category.)
- `priority` (`high`, `medium`, `low`)
- `status` (`active`, `paused`, `cancelled`)
- `notes` (Optional description)

### Category Optionality
`category_id` is nullable. When a goal has no category:
- The goal remains fully valid.
- Dashboard calculations and health evaluation proceed normally.
- No category badge or label is displayed in the UI.

### Target Deletion Rules
- A target with **no actual transactions** (and in v1.1+, no planned contributions) may be hard-deleted.
- A target with **existing transactions** (or in v1.1+, planned contributions) must NOT be hard-deleted. Use `status = 'cancelled'` instead. Enforced at database level via `ON DELETE RESTRICT`.

### Goal Lifecycle vs Goal Health
These are two distinct concepts:

**Goal Lifecycle** — Persisted database state controlling the operational status of a goal:
```text
active      → Goal is actively tracked.
paused      → Goal tracking is temporarily suspended.
cancelled   → Goal has been abandoned.
```

**Goal Health** — Computed state derived at query time for `active` goals only (see §7.5):
```text
achieved         → current_balance >= target_amount
overdue          → deadline has passed AND not achieved
on_track         → savings velocity >= required monthly savings
needs_attention  → savings velocity is 70–99% of required
behind_schedule  → savings velocity < 70% of required, or velocity <= 0
```

The UI displays lifecycle and health as follows:
```text
if lifecycle = cancelled   → display "Cancelled"
else if lifecycle = paused → display "Paused"
else                       → display computed Goal Health
```

### Priority Semantics
- **v1.0:** Controls UI sorting, visual badges, and determines the **Hero Target** (highest-priority active goal featured on the Dashboard).
- **v1.2 (Future):** Acts as input weight for auto-allocation rules.

---

## 5.4 Module: Rapid Savings Transactions (`saving_transactions`)
Entry form designed for completion in **< 10 seconds**.

### Attributes
- `transaction_date` (Defaults to today)
- `target_id` (Associated target goal)
- `source_account_id` (FK to `saving_accounts`, optional)
- `transaction_type` (`deposit` [+] or `withdrawal` [-])
- `amount` (`bigint`, IDR integer value)
- `notes` (Optional description)

### Transaction Business Rules

#### Deposit (+)
Increases the goal's derived balance. Represents money allocated to the goal.

#### Withdrawal (-)
Decreases the goal's derived balance. Represents usage or re-allocation of previously allocated funds.

#### Insufficient Balance Rule
A withdrawal **MUST NOT** cause the goal's derived `current_balance` to become negative. Enforced atomically at database level with concurrency-safe row locking (see §6.5).

#### Source Account Active Validation
When `source_account_id` is provided or changed:

| Operation | Rule |
| :--- | :--- |
| **INSERT** with `source_account_id` | Account must exist, belong to same user, and must NOT be archived (`archived_at IS NULL`). |
| **UPDATE** changing `source_account_id` | New account must exist, belong to same user, and must NOT be archived. |
| **UPDATE** not changing `source_account_id` | No re-validation required. A transaction may continue referencing an account that has since been archived. |

Historical transactions retain their original `source_account_id` even if the account is later archived. Only *new assignments* to archived accounts are forbidden.

#### Transaction Edit Rules (Immutable Fields)
To prevent accounting/concurrency complexity in MVP, the following fields are **immutable after creation**:
- `target_id` — cannot be changed.
- `transaction_type` — cannot be changed.
- `user_id` — cannot be changed.

**Mutable fields:** `amount`, `notes`, `transaction_date`, `source_account_id`.

If a user needs to change the target or type of a transaction, the correct workflow is: delete the original transaction, then create a new one.

---

## 5.5 Module: Dashboard & Savings Timeline (v1.0 UX)
- **Hero Target Card:** Prominent feature card for the highest-priority active goal.
- **Total Active Goal Balance:** Sum of `current_balance` across all **active** targets only. This represents the total balance currently allocated to active savings goals. It does NOT include cancelled or paused goals, and does NOT represent total bank balance, net worth, or total money owned.
- **Goal Cards:** Display Goal Name, Current / Target Amount, Progress %, Remaining Amount, Target Date, Required Monthly Savings, Current Savings Velocity, Projected Completion Month, and Health Badge.
- **Savings Timeline Visualization:** Month-by-month breakdown showing **Actual Net Contribution** vs **Required Monthly Savings** for each recent month. Example: `Aug: Actual +Rp3.0m / Required Rp2.0m`.
- **Current-Month Indicator:** The dashboard may display the current (incomplete) month's actual contributions as a real-time indicator. This value is shown for user awareness but does **NOT** influence the historical Savings Velocity metric or Goal Health calculation (see §7.3).
- **Quick Deposit FAB (< 10s):** Floating Action Button to launch deposit modal.

---

# 6. Database Schema, Ownership Security & Integrity

All monetary amounts use **`bigint`** (IDR integer without cents).

## 6.1 Relational Ownership Security Model

### Problem
Standard RLS (`auth.uid() = user_id`) prevents a user from *reading* another user's rows, but it does NOT prevent a malicious INSERT from *referencing* another user's parent row via a foreign key. For example, User B could create a transaction with `target_id` pointing to User A's target, because the FK only checks that the target *exists*.

### Solution: Composite Foreign Keys
All parent tables expose a `UNIQUE (id, user_id)` constraint. Child tables reference both `(parent_id, user_id)`, ensuring a child row can only reference a parent owned by the same `user_id`.

```text
RLS  → controls WHO can access rows (read/write authorization)
Composite FK → controls WHICH owned resources a child row can reference
```

Both are required. Neither alone is sufficient.

```text
Parent:  saving_targets  ── UNIQUE (id, user_id)
                  ▲
                  │ FOREIGN KEY (target_id, user_id)
Child:   saving_transactions (target_id, user_id)
```

---

## 6.2 Entity Lifecycle & Deletion Strategy

### Accounts & Categories: Archive, Never Hard-Delete
Accounts and categories are **never hard-deleted**, regardless of whether they have been referenced by transactions or targets. Archive/unarchive is the only lifecycle mechanism. The `ON DELETE RESTRICT` constraints on child tables serve as a safety net, but the product rule is unconditional: no hard-delete workflow exists for accounts or categories.

**Archive Mechanism:** `archived_at timestamptz NULL`
- `archived_at IS NULL` → Active. Can be selected for new records.
- `archived_at IS NOT NULL` → Archived. Visible in historical records only. Cannot be selected for new records.

Archived entities:
- Remain queryable for historical reporting.
- Cannot be selected for new transactions or targets.
- Do not appear in default active selectors.
- Can be restored (un-archived) by setting `archived_at = NULL`.

### Targets: Status Lifecycle
- A target with **no actual transactions and no planned contributions** may be hard-deleted.
- A target with **existing transactions or planned contributions** must NOT be hard-deleted. Use `status = 'cancelled'` instead. The database enforces this via `ON DELETE RESTRICT` on both `saving_transactions.target_id` and `planned_contributions.target_id`.

### Transactions: Physical Records
Transactions are physical financial records. They can be edited (mutable fields only) or deleted. Deletion recalculates the derived balance.

**Exception (v1.1):** A transaction linked to a completed planned contribution cannot be deleted until the planned contribution relationship is explicitly resolved (see §6.2.1).

### Composite FK Deletion Behaviour
Because composite FKs include `user_id NOT NULL`, `ON DELETE SET NULL` on composite keys is invalid (PostgreSQL cannot null `user_id` while it remains `NOT NULL`). All composite FK relationships use `RESTRICT`:

| Relationship | ON DELETE | Rationale |
| :--- | :--- | :--- |
| `saving_targets.category_id` → `saving_categories` | `RESTRICT` | Categories are never deleted; safety net for the no-hard-delete policy. |
| `saving_transactions.target_id` → `saving_targets` | `RESTRICT` | Targets with transactions must be cancelled, not deleted. |
| `saving_transactions.source_account_id` → `saving_accounts` | `RESTRICT` | Accounts are never deleted; safety net for the no-hard-delete policy. |
| `planned_contributions.target_id` → `saving_targets` (v1.1) | `RESTRICT` | Targets with planned contributions must be cancelled, not deleted. |
| `planned_contributions.completed_transaction_id` → `saving_transactions` (v1.1) | `RESTRICT` | See §6.2.1. |

### 6.2.1 Planned Contribution Audit Invariants (v1.1)

A planned contribution with `status = 'completed'` represents an auditable link between a plan and an actual deposit. The following invariants are enforced at the database level:

#### Invariant 1: Status ↔ Transaction Consistency
```text
status = 'planned'    → completed_transaction_id MUST be NULL
status = 'cancelled'  → completed_transaction_id MUST be NULL
status = 'completed'  → completed_transaction_id MUST NOT be NULL
```
Enforced via `CHECK` constraint on `planned_contributions`.

#### Invariant 2: Same User
The completed transaction must belong to the same user as the planned contribution.
Enforced via composite FK `(completed_transaction_id, ..., user_id)`.

#### Invariant 3: Same Target
The completed transaction must belong to the same savings target as the planned contribution. A planned contribution for "Wedding Goal" must never be completed using a deposit belonging to "Laptop Goal", even if both belong to the same user.
Enforced via composite FK `(completed_transaction_id, target_id, user_id)` referencing `saving_transactions(id, target_id, user_id)`.

#### Invariant 4: Deposit Only
A planned contribution must only be completed by an actual `deposit` transaction. Completion by a `withdrawal` is invalid and must be rejected.
Enforced via database trigger `fn_validate_planned_completion` (see §6.7).

#### Completion Flow
```text
Planned Contribution (status = 'planned')
        ↓
User records actual deposit for same target
        ↓
Deposit transaction created in saving_transactions
        ↓
planned_contribution.completed_transaction_id = deposit.id
planned_contribution.status = 'completed'
        ↓
Invariants validated:
  ✓ same user
  ✓ same target
  ✓ transaction_type = deposit
  ✓ completed_transaction_id IS NOT NULL
```

#### Transaction Deletion Protection
If a transaction is linked to a completed planned contribution, deletion of that transaction is **rejected** by the database (`ON DELETE RESTRICT`). To delete the linked transaction, the user must first explicitly resolve the relationship (e.g., revert the planned contribution status to `planned` or `cancelled`, which also clears `completed_transaction_id` per Invariant 1).

#### Immutability Guarantee
Once a planned contribution is completed, its linked transaction cannot later be changed to a different target, transaction type, or user because `target_id`, `transaction_type`, and `user_id` are immutable after transaction creation (see §5.4). This means the composite FK relationship (same user, same target) and the deposit-only invariant remain valid for the lifetime of the link without requiring additional runtime re-validation.

---

## 6.3 Schema Specifications

### Table: `saving_accounts`
```sql
CREATE TABLE public.saving_accounts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'wallet', 'investment', 'cash')),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_saving_accounts_user UNIQUE (id, user_id)
);
```

### Table: `saving_categories`
```sql
CREATE TABLE public.saving_categories (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'piggy-bank',
  color text NOT NULL DEFAULT '#10B981',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_saving_categories_user UNIQUE (id, user_id)
);
```

### Table: `saving_targets`
```sql
CREATE TABLE public.saving_targets (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid,
  title text NOT NULL,
  target_amount bigint NOT NULL CHECK (target_amount > 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_saving_targets_user UNIQUE (id, user_id),
  CONSTRAINT chk_target_date CHECK (target_date >= start_date),
  CONSTRAINT fk_saving_targets_category
    FOREIGN KEY (category_id, user_id)
    REFERENCES public.saving_categories(id, user_id)
    ON DELETE RESTRICT
);
```

### Table: `saving_transactions`
```sql
CREATE TABLE public.saving_transactions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  source_account_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  amount bigint NOT NULL CHECK (amount > 0),
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_saving_transactions_user UNIQUE (id, user_id),
  CONSTRAINT uq_saving_transactions_target_user UNIQUE (id, target_id, user_id),
  CONSTRAINT fk_saving_transactions_target
    FOREIGN KEY (target_id, user_id)
    REFERENCES public.saving_targets(id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_saving_transactions_account
    FOREIGN KEY (source_account_id, user_id)
    REFERENCES public.saving_accounts(id, user_id)
    ON DELETE RESTRICT
);
```

### Table: `planned_contributions` (Introduced in `v1.1`)
```sql
CREATE TABLE public.planned_contributions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  planned_date date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  completed_transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT chk_planned_status_consistency CHECK (
    (status = 'completed' AND completed_transaction_id IS NOT NULL)
    OR
    (status IN ('planned', 'cancelled') AND completed_transaction_id IS NULL)
  ),
  CONSTRAINT fk_planned_contributions_target
    FOREIGN KEY (target_id, user_id)
    REFERENCES public.saving_targets(id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_planned_contributions_tx
    FOREIGN KEY (completed_transaction_id, target_id, user_id)
    REFERENCES public.saving_transactions(id, target_id, user_id)
    ON DELETE RESTRICT
);
```

---

## 6.4 Authoritative Balance View (`v_saving_target_balances`)

### Security Model
The view uses `WITH (security_invoker = true)` (PostgreSQL 15+ / Supabase standard). This means RLS policies on `saving_targets` and `saving_transactions` are evaluated against the **calling user's identity**, not the view owner. The authenticated user only sees balances for targets they own.

```text
Authenticated User (auth.uid())
    → Queries v_saving_target_balances
    → View executes with caller's identity (security_invoker)
    → RLS on saving_targets filters to user's targets
    → RLS on saving_transactions filters to user's transactions
    → Result: only the user's own balances
```

### View Definition
```sql
CREATE OR REPLACE VIEW public.v_saving_target_balances
WITH (security_invoker = true) AS
SELECT
  t.id AS target_id,
  t.user_id,
  t.title,
  t.target_amount,
  t.start_date,
  t.target_date,
  t.priority,
  t.status,
  COALESCE(
    SUM(CASE WHEN tx.transaction_type = 'deposit' THEN tx.amount ELSE -tx.amount END),
    0
  ) AS current_balance,
  GREATEST(
    t.target_amount - COALESCE(
      SUM(CASE WHEN tx.transaction_type = 'deposit' THEN tx.amount ELSE -tx.amount END),
      0
    ),
    0
  ) AS remaining_amount
FROM public.saving_targets t
LEFT JOIN public.saving_transactions tx
  ON t.id = tx.target_id AND t.user_id = tx.user_id
GROUP BY t.id, t.user_id, t.title, t.target_amount, t.start_date, t.target_date, t.priority, t.status;
```

---

## 6.5 Concurrency-Safe Withdrawal Validation

### Problem
A simple `SELECT current_balance` inside a trigger is vulnerable to concurrent withdrawals observing the same stale balance. Example:
```text
Balance = Rp5jt
Request A → withdraw Rp4jt → reads Rp5jt → allows
Request B → withdraw Rp4jt → reads Rp5jt → allows
Result: Balance = -Rp3jt (INVALID)
```

### Solution: Row-Level Locking + Balance Recomputation
The validation function acquires an exclusive lock on the target row using `SELECT ... FOR UPDATE` before recomputing the effective balance. This serializes competing withdrawals for the same target.

Withdrawal validation is **concurrency-safe and serialized per savings target**.

### INSERT Validation
```text
INSERT
→ OLD is not used
→ all existing transactions are included

1. Lock target row (SELECT ... FOR UPDATE on saving_targets WHERE id = target_id)
2. Compute effective_balance = SUM(deposits) - SUM(withdrawals) from saving_transactions
3. If NEW.amount > effective_balance → REJECT
4. Otherwise → ALLOW (lock released at transaction commit)
```

### UPDATE Validation (Handling OLD vs NEW)
When editing a withdrawal's `amount`, the validation must exclude the OLD transaction value before comparing:
```text
UPDATE
→ OLD.id is excluded
→ the new amount is validated against the balance
  before applying the new row

1. Lock target row
2. Compute effective_balance excluding the OLD transaction row
3. If NEW.transaction_type = 'withdrawal' AND NEW.amount > effective_balance → REJECT
4. Otherwise → ALLOW
```

This prevents the scenario where editing `withdrawal Rp2jt → Rp4jt` is incorrectly evaluated against a balance that still includes the old Rp2jt deduction.

### Trigger Specification
```sql
CREATE OR REPLACE FUNCTION public.fn_validate_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  v_effective_balance bigint;
BEGIN
  IF NEW.transaction_type = 'withdrawal' THEN
    -- Acquire exclusive lock on the target row to serialize concurrent withdrawals
    PERFORM 1 FROM public.saving_targets
    WHERE id = NEW.target_id AND user_id = NEW.user_id
    FOR UPDATE;

    IF TG_OP = 'UPDATE' THEN
      -- UPDATE: OLD.id is excluded
      SELECT COALESCE(
        SUM(CASE WHEN tx.transaction_type = 'deposit' THEN tx.amount ELSE -tx.amount END),
        0
      ) INTO v_effective_balance
      FROM public.saving_transactions tx
      WHERE tx.target_id = NEW.target_id
        AND tx.user_id = NEW.user_id
        AND tx.id != OLD.id;
    ELSIF TG_OP = 'INSERT' THEN
      -- INSERT: OLD is not used, all existing transactions are included
      SELECT COALESCE(
        SUM(CASE WHEN tx.transaction_type = 'deposit' THEN tx.amount ELSE -tx.amount END),
        0
      ) INTO v_effective_balance
      FROM public.saving_transactions tx
      WHERE tx.target_id = NEW.target_id
        AND tx.user_id = NEW.user_id;
    END IF;

    IF v_effective_balance < NEW.amount THEN
      RAISE EXCEPTION
        'Insufficient goal balance for withdrawal. Effective balance: %, Attempted: %',
        v_effective_balance, NEW.amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE TRIGGER trg_validate_withdrawal
  BEFORE INSERT OR UPDATE ON public.saving_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_withdrawal();
```

---

## 6.6 Row Level Security (RLS) Policies

Every user-owned table requires RLS policies enforcing `auth.uid() = user_id`.

### Policy Template (Applied to Each Table)
```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- SELECT: user can only read own rows
CREATE POLICY "select_own" ON public.<table_name>
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: user can only insert rows with own user_id
CREATE POLICY "insert_own" ON public.<table_name>
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can only update own rows, cannot reassign user_id
CREATE POLICY "update_own" ON public.<table_name>
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: user can only delete own rows
CREATE POLICY "delete_own" ON public.<table_name>
  FOR DELETE USING (auth.uid() = user_id);
```

### Tables Requiring RLS
| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `saving_accounts` | own | own | own | own |
| `saving_categories` | own | own | own | own |
| `saving_targets` | own | own | own | own |
| `saving_transactions` | own | own | own | own |
| `planned_contributions` (v1.1) | own | own | own | own |

The `WITH CHECK (auth.uid() = user_id)` on UPDATE prevents a user from reassigning `user_id` to another user.

---

## 6.7 Planned Contribution Completion Validation (v1.1)

The composite FK on `planned_contributions` (§6.3) enforces same-user and same-target invariants. The `CHECK` constraint enforces status ↔ `completed_transaction_id` consistency. However, neither mechanism can enforce that the referenced transaction has `transaction_type = 'deposit'`.

A database trigger enforces the deposit-only invariant:

```sql
CREATE OR REPLACE FUNCTION public.fn_validate_planned_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_type text;
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_transaction_id IS NOT NULL THEN
    SELECT transaction_type INTO v_tx_type
    FROM public.saving_transactions
    WHERE id = NEW.completed_transaction_id
      AND user_id = NEW.user_id
      AND target_id = NEW.target_id;

    IF v_tx_type IS NULL THEN
      RAISE EXCEPTION
        'Completed transaction not found for the given user and target.';
    END IF;

    IF v_tx_type != 'deposit' THEN
      RAISE EXCEPTION
        'Planned contribution can only be completed by a deposit transaction, not a withdrawal.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE TRIGGER trg_validate_planned_completion
  BEFORE INSERT OR UPDATE ON public.planned_contributions
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_planned_completion();
```

---

# 7. Recommendation Engine & Deterministic Calculations

The recommendation engine relies on 3 deterministic formulas. All calculations use calendar-month arithmetic (not day-based division).

## 7.1 Remaining Contribution Periods (Calendar-Month Model)

$$N_{\text{months}} = (\text{YEAR}(\text{target\_date}) - \text{YEAR}(\text{today})) \times 12 + (\text{MONTH}(\text{target\_date}) - \text{MONTH}(\text{today}))$$

This counts the number of whole calendar months from the current month to the target month.

| Scenario | $N_{\text{months}}$ raw | Interpretation |
| :--- | :--- | :--- |
| Deadline is current month | 0 | 1 final contribution opportunity |
| Deadline is next month | 1 | 1 remaining contribution period |
| Deadline has passed | < 0 | Overdue |

---

## 7.2 Required Monthly Savings

$$\text{Required Monthly Savings} = \begin{cases}
0 & \text{if Achieved: } \text{current\_balance} \ge \text{target\_amount} \\
\text{N/A (Overdue)} & \text{if } N_{\text{months}} < 0 \\
\text{remaining\_amount} & \text{if } N_{\text{months}} = 0 \text{ (deadline is current month)} \\
\displaystyle\frac{\text{remaining\_amount}}{N_{\text{months}}} & \text{if } N_{\text{months}} \ge 1
\end{cases}$$

**Overdue handling:** When $N_{\text{months}} < 0$, the system does NOT compute a Required Monthly Savings value. Instead, the goal is flagged as `Overdue` with the `remaining_amount` displayed as the overdue gap.

**Current-month deadline note:** When $N_{\text{months}} = 0$, the value represents the total remaining contribution needed within the current month. The UI label may still display "Required Monthly Savings" for consistency, but the documentation and implementation must treat this as a single remaining contribution opportunity, not a recurring monthly rate.

---

## 7.3 Deterministic Savings Velocity

Velocity measures the historical net monthly savings rate over the **latest completed calendar months**, capped at six.

### Velocity Window Definition

**Step 1: Determine eligible completed calendar months.**

```text
velocity_start =
    first day of the calendar month containing
    MAX(start_date, first_transaction_date)

velocity_end =
    last day of the previous calendar month
    (the last day before the current calendar month begins)
```

All fully completed calendar months between `velocity_start` and `velocity_end` (inclusive) are **eligible**. The current incomplete calendar month is **always excluded**.

**Step 2: Select the latest months.**

```text
EligibleMonths =
    all completed calendar months between velocity_start and velocity_end,
    sorted chronologically

IncludedMonths =
    the latest min(6, count(EligibleMonths)) months from EligibleMonths

W = count(IncludedMonths)
```

**Step 3: Compute velocity from IncludedMonths only.**

$$\text{Savings Velocity} = \begin{cases}
0 & \text{if } W = 0 \text{ (no completed months of history)} \\[6pt]
\displaystyle\frac{\sum_{\text{transactions in IncludedMonths}} (\text{deposits} - \text{withdrawals})}{W} & \text{if } W \ge 1
\end{cases}$$

Only transactions whose `transaction_date` falls within the `IncludedMonths` are aggregated. Transactions in older eligible months outside the latest-6 window are excluded.

### Example A: More than 6 eligible months
```text
start_date             = 2026-01-01
first_transaction_date = 2026-01-15
today                  = 2027-02-10

velocity_start = 2026-01-01
velocity_end   = 2027-01-31

EligibleMonths = Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec (2026), Jan (2027)
                 → 13 eligible months

IncludedMonths = Aug Sep Oct Nov Dec (2026), Jan (2027)
                 → latest 6

W = 6
Velocity = net contributions in Aug–Jan only / 6
```

### Example B: Fewer than 6 eligible months
```text
start_date             = 2026-07-01
first_transaction_date = 2026-07-15
today                  = 2026-10-20

velocity_start = 2026-07-01
velocity_end   = 2026-09-30

EligibleMonths = Jul Aug Sep → 3 eligible months
IncludedMonths = Jul Aug Sep → all 3

W = 3
Velocity = net contributions in Jul–Sep / 3
```

### Example C: No completed months
```text
start_date             = 2026-08-01
first_transaction_date = 2026-08-15
today                  = 2026-08-20

velocity_end = 2026-07-31 (before velocity_start)
EligibleMonths = none

W = 0
Velocity = 0
```

### Edge Cases
| Condition | Velocity | Behaviour |
| :--- | :--- | :--- |
| No completed months yet | `0` | Forecast = "Not achievable at current rate" |
| Net positive | `> 0` | Used for forecast calculation |
| Net zero | `0` | Forecast = "Not achievable at current rate" |
| Net negative (withdrawals > deposits) | `< 0` | Forecast = "Not achievable at current rate"; Health = Behind Schedule |

### Current-Month Contribution vs Historical Velocity
The dashboard may separately display the current (incomplete) month's actual contributions as a real-time indicator. This value is shown for user awareness only:
- It does **NOT** influence the historical Savings Velocity metric.
- It does **NOT** change the Goal Health calculation.
- Health is determined by completed-month velocity, preventing misleading status changes mid-month.

---

## 7.4 Projected Completion Forecast

### v1.0 Forecast Engine (Velocity-Only)

$$\text{Projected Months Needed} = \begin{cases}
0 & \text{if } \text{current\_balance} \ge \text{target\_amount} \\
\infty & \text{if } \text{Savings Velocity} \le 0 \\
\left\lceil \displaystyle\frac{\text{remaining\_amount}}{\text{Savings Velocity}} \right\rceil & \text{if } \text{Savings Velocity} > 0
\end{cases}$$

**Projected Completion Month** = Current calendar month + `Projected Months Needed` calendar months.

Display as **month and year** (e.g., "November 2026"), NOT as an exact date. The forecast does not have daily precision.

If `Savings Velocity <= 0`: Forecast = `"Not achievable at current rate"`.

### v1.1 Hybrid Forecast Engine (Month-by-Month Iteration)
Introduced alongside Planned Contributions. For each future month $m = 1, 2, \dots$:

$$\text{Projected Contribution}(m) = \begin{cases}
\sum \text{Planned Contributions in month } m & \text{if any planned contributions exist for month } m \\
\max(0, \text{Savings Velocity}) & \text{otherwise}
\end{cases}$$

$$\text{Projected Balance}(m) = \text{Projected Balance}(m-1) + \text{Projected Contribution}(m)$$

where $\text{Projected Balance}(0) = \text{current\_balance}$.

Forecast Month = first month $m$ where $\text{Projected Balance}(m) \ge \text{target\_amount}$.

**Anti-double-counting rule:** Months with planned contributions use *only* the planned amount, not planned + velocity. This prevents inflating the projection.

---

## 7.5 Goal Health Evaluation

Goal Health is a **computed evaluation** at query time, NOT a stored database value.

### Step 1: Check Goal Lifecycle
If the goal's persisted `status` is not `active`, display the lifecycle state directly:

| Lifecycle Status | Display | Badge |
| :--- | :--- | :--- |
| `cancelled` | **Cancelled** | ⚫ |
| `paused` | **Paused** | ⏸️ |

No health calculation is performed for `cancelled` or `paused` goals.

### Step 2: Compute Health for Active Goals
For goals with `status = 'active'`, evaluate health in strict precedence order. The first matching condition wins:

| Priority | Health | Badge | Condition |
| :--- | :--- | :--- | :--- |
| 1 | **Achieved** | 🎉 | `current_balance >= target_amount` |
| 2 | **Overdue** | 🔴 | $N_{\text{months}} < 0$ (deadline has passed) AND NOT Achieved |
| 3 | **On Track** | 🟢 | `Savings Velocity >= Required Monthly Savings` |
| 4 | **Needs Attention** | 🟡 | `Savings Velocity >= 0.70 × Required Monthly Savings` |
| 5 | **Behind Schedule** | 🔴 | All other cases (including `Savings Velocity <= 0`) |

**Velocity comparison prerequisite:** Priorities 3–5 (On Track / Needs Attention / Behind Schedule) are only evaluated when `Required Monthly Savings` is a finite positive value. For `Overdue` goals, the evaluation short-circuits at Priority 2. The system never attempts to compare `Savings Velocity` against `N/A`.

---

# 8. Synchronization Workflow (Google Spreadsheet)

PostgreSQL is the sole **Source of Truth**. Google Spreadsheet serves strictly as a reporting and monthly audit medium.

```text
User Clicks "Sync Savings to Sheet"
                 │
                 ▼
        SvelteKit Web App
                 │
                 ▼
 Supabase Edge Function (sync-savings)
                 │
                 ▼
   Google Apps Script Web App
                 │
                 ▼
        Google Spreadsheet
  ├─ Tab 1: "Savings Goals Summary"
  └─ Tab 2: "Deposit & Withdrawal Log"
```

### Sync Rules
- **v1.0 (MVP):** **Manual Sync** via "Sync Savings to Sheet" button on Dashboard. Automated sync is NOT a dependency.
- **v1.1 (Future):** Optional background scheduled sync via `pg_cron`.

### API Key Security
The Google Apps Script API key/secret used for sync authentication must:
- Be stored exclusively as a **Supabase Edge Function secret** (server-side).
- **Never** be exposed to the browser, committed to source control, or placed in client-side environment variables (e.g., `PUBLIC_*` env vars).
- Only be transmitted by the trusted server-side Edge Function during the sync flow.

---

# 9. Product Roadmap & Versioning Strategy

## Versioning Principles
```text
v1.0  = Core MVP. First production-ready release.
v1.x  = Incremental/semi-major improvements preserving core product identity.
v2.0  = Major product/architecture expansion changing fundamental scope.
```

**Decision Framework:**
- Can the feature be added without changing the fundamental data ownership model? → `v1.x`
- Does it require a meaningful new domain but preserve TargetMoneh's identity? → `v1.x`
- Does it fundamentally change TargetMoneh into a broader financial system? → `v2.0`
- Does it require major changes to authorization, core entities, or architecture? → Consider `v2.0`

---

## 9.1 `v1.0` — Core Production MVP
*Focus: Rapid entry, goal allocation tracking, velocity calculations, and manual sheet export.*

- ✅ Supabase Auth (Email/Password) + `@supabase/ssr` session integration
- ✅ Source Account Metadata CRUD with archive lifecycle (`saving_accounts`)
- ✅ Category Management CRUD with archive lifecycle (`saving_categories`)
- ✅ Savings Goal CRUD (`saving_targets`): target amount, deadline, optional category, priority, status (`active`/`paused`/`cancelled`)
- ✅ Rapid Deposit & Withdrawal (< 10s entry)
- ✅ Transaction history, edit (mutable fields), delete
- ✅ Immutable transaction fields: `target_id`, `transaction_type`, `user_id`
- ✅ Source account active validation on INSERT/UPDATE
- ✅ Transaction-derived authoritative balance (`v_saving_target_balances`)
- ✅ Concurrency-safe DB-level withdrawal validation with row locking
- ✅ Composite FK ownership security on all parent-child relationships
- ✅ RLS on all user-owned tables
- ✅ Required Monthly Savings (calendar-month model)
- ✅ Savings Velocity (latest 6 completed calendar months)
- ✅ Velocity-only Projected Completion Month
- ✅ Goal Health Engine (Lifecycle: Cancelled/Paused; Health: Achieved → Overdue → On Track → Needs Attention → Behind Schedule)
- ✅ Dashboard: Hero Target, Total Active Goal Balance, Goal Cards, Current-Month Indicator, Savings Timeline (Actual Net Contribution vs Required Monthly Savings), Quick Deposit FAB
- ✅ Manual 1-way Google Sheets sync (API key stored server-side only)

---

## 9.2 `v1.1` — Quality of Life & Planned Contributions
*Focus: Planned contribution scheduling, enhanced search, and hybrid forecasting.*

- Planned Contributions (`planned_contributions`): `planned` → `completed` → `cancelled` lifecycle
- `completed_transaction_id` ownership-safe composite FK enforcing same user, same target, `ON DELETE RESTRICT`
- Status ↔ transaction consistency CHECK constraint (§6.2.1 Invariant 1)
- Deposit-only completion validation trigger (§6.2.1 Invariant 4, §6.7)
- Completed planned contribution audit rule and transaction deletion protection (§6.2.1)
- Hybrid month-by-month Forecast Engine (planned contributions + velocity, anti-double-counting)
- Advanced transaction search/filtering by date range, account, category, target
- Improved Google Sheets export layout, CSV download
- Optional scheduled sync via `pg_cron`

---

## 9.3 `v1.2` — Savings Automation & Allocation
*Focus: Smart allocation of lump-sum deposits across goals.*

- Auto-Allocation Calculator (priority-weight or custom percentage distribution)
- Contribution Templates (recurring allocation presets)
- Recurring Planned Contributions (automated monthly generation)

---

## 9.4 `v1.3` — Investment & Yield Awareness
*Focus: Tracking yield/growth on savings without becoming a trading platform.*

- Yield & Interest Metadata (Reksa Dana, Deposito, Bank interest rate tagging)
- Actual & Estimated Yield Entry (dividends/interest, separate from personal deposits)
- Yield-Inclusive Goal Projections

Does NOT include: trading, buy/sell execution, broker API, portfolio management.

---

## 9.5 `v1.4` — Household / Shared Goals
*Focus: Multi-user joint goal tracking.*

- Shared Targets (multi-user joint goals between owner and spouse)
- Contribution Attribution (track which user contributed)
- Household Goal Dashboard (combined individual + joint view)

If implementation requires a fundamental authorization/data-model rewrite, move to `v2.0`.

---

## 9.6 `v2.0` — Unified Financial Platform
*Focus: Cross-application ecosystem integration that changes TargetMoneh's fundamental scope.*

- TrackerMoneh Integration (Unified financial suite: Cashflow + Savings Goals)
- Net Worth Tracking (liquid accounts + savings goals + investments)
- Open Banking & Bank APIs (automated account balance reconciliation)
- Advanced household financial architecture
- Potentially: investment portfolio management

---

# 10. Out of Scope / Non-Goals (MVP `v1.0`)

- ❌ Bank API scraping / Open Banking integration
- ❌ Bank balance ledger / Cashflow tracking (Handled by TrackerMoneh)
- ❌ Planned Contributions (Deferred to `v1.1`)
- ❌ Automatic allocation algorithms (Deferred to `v1.2`)
- ❌ Multi-currency support (IDR only)
- ❌ PWA offline sync
- ❌ Investment trading / Yield calculation engines (Deferred to `v1.3`)
- ❌ Shared / household goals (Deferred to `v1.4`)
- ❌ Custom authentication system (Uses Supabase Auth)

---

# 11. Success Metrics

| Metric | Target | Measurable |
| :--- | :--- | :--- |
| Rapid Entry | Deposit/withdrawal in `< 10 seconds` on mobile web | ✅ Timed |
| Dashboard Performance | Response time `< 500 ms` | ✅ Measured |
| Spreadsheet Sync | Manual push completes in `< 30 seconds` | ✅ Timed |
| Deterministic Engine | Goal Health, Velocity, and Forecast produce identical results for identical inputs | ✅ Testable |
| Forecast Explainability | Forecast can be explained from actual transactions (v1.0) or actual + planned contributions (v1.1) | ✅ Auditable |
| Data Integrity | No duplicate authoritative balance; `current_balance` is strictly transaction-derived | ✅ Verifiable |
| Ownership Isolation | Composite FKs prevent cross-user child referencing | ✅ Constraint-enforced |

---

# 12. Required Documentation Architecture

To maintain the exact architectural standard of **TrackerMoneh**, this project requires a complete documentation suite of 10 core documents in the `/docs` directory:

| Document File | Purpose & Description |
| :--- | :--- |
| 📋 `PRD-Personal-Savings-Tracker.md` | Product Requirements Document (this document). |
| 📐 `TECHNICAL-SPECIFICATION.md` | System & Service Layer Technical Spec (SvelteKit 2, Supabase Auth, `@supabase/ssr`, TanStack Query). |
| 🗄️ `DATABASE.md` | PostgreSQL Schema, Composite FKs, RLS Policies, Triggers, Views & RPCs. |
| 🧱 `ARCHITECTURE.md` | Visual Architecture Diagrams, Component Flows & Edge Function Data Paths. |
| 📁 `PROJECT_STRUCTURE.md` | Directory Layout, Modular SvelteKit Routes & Code Responsibility Guidelines. |
| ⚡ `SUPABASE_SETUP.md` | Supabase CLI Setup, Migration Workflow, Environment Variables & Secrets Management. |
| 📊 `SPREADSHEET.md` | Google Sheets Template Setup & Google Apps Script Web App Deployment Guide. |
| ⏰ `SCHEDULED.md` | Automated Background Sync Guide (`pg_cron` & Edge Function Triggers). |
| 🚀 `DEPLOYMENT.md` | Deployment Sequence, Vercel/Self-hosted Guide & Disaster Recovery Procedures. |
| ⚖️ `DECISIONS.md` | Architecture Decision Records (ADRs) explaining tech stack & design choices. |
