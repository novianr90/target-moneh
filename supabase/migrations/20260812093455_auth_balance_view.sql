-- Migration: Authoritative Balance View & RLS Security Isolation
-- Issue #6: [v1.0] Authoritative Balance View & RLS Security Isolation

-- 1. Ensure Composite FK Integrity & ON DELETE RESTRICT on saving_transactions.target_id
ALTER TABLE public.saving_transactions
  DROP CONSTRAINT IF EXISTS fk_saving_transactions_target;

ALTER TABLE public.saving_transactions
  ADD CONSTRAINT fk_saving_transactions_target
    FOREIGN KEY (target_id, user_id)
    REFERENCES public.saving_targets(id, user_id)
    ON DELETE RESTRICT;

-- Ensure Composite Unique Constraint (id, target_id, user_id) for planned contribution audit invariants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_saving_transactions_target_user'
  ) THEN
    ALTER TABLE public.saving_transactions
      ADD CONSTRAINT uq_saving_transactions_target_user UNIQUE (id, target_id, user_id);
  END IF;
END $$;

-- 2. Authoritative View: v_saving_target_balances
-- Security Invoker = true guarantees that the view executes under the calling user's RLS context,
-- enforcing user-level security isolation on both saving_targets and saving_transactions.
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

-- Grant permissions for Data API access under security_invoker RLS rules
GRANT SELECT ON public.v_saving_target_balances TO authenticated, anon;
