
-- =============================================
-- FIX 1: profiles_table_public_exposure
-- Make user-facing policies explicitly target 'authenticated' role
-- =============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Deny all anonymous access to profiles"
ON public.profiles FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- =============================================
-- FIX 2: credit_transactions_financial_exposure
-- =============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Deny anonymous access to credit_transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Block all user inserts on transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Block anonymous inserts on transactions" ON public.credit_transactions;

CREATE POLICY "Authenticated users can view own transactions"
ON public.credit_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block authenticated inserts on transactions"
ON public.credit_transactions FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny all anonymous access to transactions"
ON public.credit_transactions FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- =============================================
-- FIX 3: user_roles_insufficient_protection
-- Add explicit deny for INSERT, UPDATE, DELETE
-- =============================================

CREATE POLICY "Block all inserts on user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Block all updates on user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "Block all deletes on user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (false);

CREATE POLICY "Deny all anonymous access to user_roles"
ON public.user_roles FOR ALL TO anon
USING (false)
WITH CHECK (false);
