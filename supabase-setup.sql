-- ============================================================
-- MASROOFY — Complete Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- SECTION 1: TABLES
-- ============================================================

-- profiles: one row per authenticated user
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  name        text,
  plan        text        NOT NULL DEFAULT 'free'   CHECK (plan IN ('free', 'pro')),
  language    text        NOT NULL DEFAULT 'ar'     CHECK (language IN ('ar', 'en')),
  theme       text        NOT NULL DEFAULT 'system',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- budgets: monthly spending limit per user
CREATE TABLE IF NOT EXISTS public.budgets (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_limit     numeric     NOT NULL,
  reset_day         int         NOT NULL DEFAULT 1,
  warning_threshold int         NOT NULL DEFAULT 80,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- expenses: every spending entry
CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  amount       numeric     NOT NULL,
  category     text        NOT NULL,
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  note         text,
  is_recurring boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- savings_goals: monthly savings targets
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month         text        NOT NULL, -- format: 'YYYY-MM'
  target_amount numeric     NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 3: RLS POLICIES — profiles
-- ============================================================

CREATE POLICY "profiles: insert own row"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: select own row"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: update own row"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: delete own row"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());


-- ============================================================
-- SECTION 4: RLS POLICIES — budgets
-- ============================================================

CREATE POLICY "budgets: insert own rows"
  ON public.budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets: select own rows"
  ON public.budgets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "budgets: update own rows"
  ON public.budgets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets: delete own rows"
  ON public.budgets FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- SECTION 5: RLS POLICIES — expenses
-- ============================================================

CREATE POLICY "expenses: insert own rows"
  ON public.expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "expenses: select own rows"
  ON public.expenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "expenses: update own rows"
  ON public.expenses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "expenses: delete own rows"
  ON public.expenses FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- SECTION 6: RLS POLICIES — savings_goals
-- ============================================================

CREATE POLICY "savings_goals: insert own rows"
  ON public.savings_goals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "savings_goals: select own rows"
  ON public.savings_goals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "savings_goals: update own rows"
  ON public.savings_goals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "savings_goals: delete own rows"
  ON public.savings_goals FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- SECTION 7: TRIGGER — auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 8: TRIGGER — auto-create default budget on profile create
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.budgets (user_id, monthly_limit, reset_day, warning_threshold)
  VALUES (NEW.id, 2000, 1, 80)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();


-- ============================================================
-- Done.
-- Flow: signup → auth.users → profiles → budgets (auto-created)
-- All tables are RLS-protected — users only see their own data.
-- ============================================================