-- Migration: Rapid Savings Transactions & Target Balances View
-- Issue #5: Rapid Savings Transactions (saving_transactions)

CREATE TABLE IF NOT EXISTS public.saving_transactions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  source_account_id uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  amount bigint NOT NULL CHECK (amount > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_saving_transactions_user UNIQUE (id, user_id),
  CONSTRAINT fk_saving_transactions_target
    FOREIGN KEY (target_id, user_id)
    REFERENCES public.saving_targets(id, user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_saving_transactions_account
    FOREIGN KEY (source_account_id, user_id)
    REFERENCES public.saving_accounts(id, user_id)
    ON DELETE RESTRICT
);

-- Indexes for rapid lookup & analytics
CREATE INDEX IF NOT EXISTS idx_saving_tx_user_id ON public.saving_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_saving_tx_target ON public.saving_transactions(target_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saving_tx_account ON public.saving_transactions(source_account_id);
CREATE INDEX IF NOT EXISTS idx_saving_tx_date ON public.saving_transactions(user_id, transaction_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saving_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Optimized with (SELECT auth.uid()))
CREATE POLICY "select_own" ON public.saving_transactions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "insert_own" ON public.saving_transactions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "update_own" ON public.saving_transactions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "delete_own" ON public.saving_transactions
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Authoritative View: v_saving_target_balances
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
