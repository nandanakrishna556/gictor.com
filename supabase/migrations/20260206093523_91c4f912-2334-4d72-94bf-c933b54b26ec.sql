-- Add RLS policies to deny anonymous access to sensitive tables

-- Deny anonymous SELECT access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT TO anon
USING (false);

-- Deny anonymous SELECT access to credit_transactions table  
CREATE POLICY "Deny anonymous access to credit_transactions"
ON public.credit_transactions FOR SELECT TO anon
USING (false);

-- Ensure INSERT block applies to authenticated role specifically
-- First drop the existing policy if it exists and recreate with proper role targeting
DROP POLICY IF EXISTS "Only system can create transactions" ON public.credit_transactions;

CREATE POLICY "Block all user inserts on transactions"
ON public.credit_transactions FOR INSERT TO authenticated
WITH CHECK (false);

-- Also block anon from inserting
CREATE POLICY "Block anonymous inserts on transactions"
ON public.credit_transactions FOR INSERT TO anon
WITH CHECK (false);