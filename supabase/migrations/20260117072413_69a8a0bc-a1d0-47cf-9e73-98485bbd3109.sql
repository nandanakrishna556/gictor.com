-- Remove the client-side INSERT policy from credit_transactions
-- All credit operations should be handled server-side via edge functions
DROP POLICY IF EXISTS "Users can log usage only" ON public.credit_transactions;