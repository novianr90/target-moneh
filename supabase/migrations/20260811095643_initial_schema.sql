-- Migration: Initial Schema for TargetMoneh
-- Table: saving_accounts (Issue #2)

CREATE TABLE IF NOT EXISTS public.saving_accounts (
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

-- Index for performance & RLS lookup
CREATE INDEX IF NOT EXISTS idx_saving_accounts_user_id ON public.saving_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_saving_accounts_user_archived ON public.saving_accounts(user_id, archived_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saving_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Optimized with (SELECT auth.uid()))
CREATE POLICY "select_own" ON public.saving_accounts
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "insert_own" ON public.saving_accounts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "update_own" ON public.saving_accounts
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "delete_own" ON public.saving_accounts
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
