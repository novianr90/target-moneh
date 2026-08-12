-- Migration: Target Management (saving_targets)
-- Issue #4: Savings Goal Target Management

CREATE TABLE IF NOT EXISTS public.saving_targets (
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

-- Indexes for performance & RLS lookup
CREATE INDEX IF NOT EXISTS idx_saving_targets_user_id ON public.saving_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_saving_targets_status ON public.saving_targets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_saving_targets_category ON public.saving_targets(category_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saving_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Optimized with (SELECT auth.uid()))
CREATE POLICY "select_own" ON public.saving_targets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "insert_own" ON public.saving_targets
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "update_own" ON public.saving_targets
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "delete_own" ON public.saving_targets
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
