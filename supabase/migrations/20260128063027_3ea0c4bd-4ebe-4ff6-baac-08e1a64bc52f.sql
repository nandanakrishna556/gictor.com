-- Add explicit INSERT denial policy for credit_transactions
-- This makes it explicit that only server-side functions can insert transactions
CREATE POLICY "Only system can create transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (false);