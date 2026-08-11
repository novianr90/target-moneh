# Database Architecture & Schema (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document outlines the authoritative PostgreSQL schema for TargetMoneh, including tables, row-level security (RLS), constraints, views, and functions. All monetary amounts use `bigint` (Indonesian Rupiah / IDR without decimal cents).

## 1. Security & Ownership Model

### Composite Foreign Keys
Standard RLS only prevents *reading* cross-user data, not *referencing* it in a foreign key. To prevent cross-user referencing, all parent tables use a `UNIQUE (id, user_id)` constraint, and child tables use a composite foreign key `FOREIGN KEY (parent_id, user_id)`.

### RLS Policy Template
All user-owned tables enforce `auth.uid() = user_id`.

```sql
-- Pattern for all tables
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.<table_name> FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON public.<table_name> FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON public.<table_name> FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own" ON public.<table_name> FOR DELETE USING (auth.uid() = user_id);
```

---

## 2. Table Schemas

### 2.1 `saving_accounts`
Metadata and source-of-funds tagging.

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

### 2.2 `saving_categories`
Dynamic master data for organizing goals.

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

### 2.3 `saving_targets`
The core savings goal entity.

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

### 2.4 `saving_transactions`
Rapid savings deposits and withdrawals.

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

### 2.5 `planned_contributions` (v1.1)
Schedules of future savings deposits.

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

## 3. Views & Authoritative Data

### 3.1 `v_saving_target_balances`
Uses `security_invoker = true` to automatically inherit the caller's RLS context, guaranteeing safe access.

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

## 4. Triggers & Validation Rules

### 4.1 Concurrency-Safe Withdrawal Validation
Prevents withdrawals from driving balance negative, accounting for concurrent requests via `FOR UPDATE` lock.

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

### 4.2 Planned Contribution Completion Validation (v1.1)
Ensures a planned contribution is only fulfilled by an actual deposit, never a withdrawal.

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
