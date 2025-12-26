-- Add error_message column to files table
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS error_message text;

-- Create refund_credits function
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Credit refund'
)
RETURNS VOID AS $$
BEGIN
  -- Add credits back to user
  UPDATE public.profiles 
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'refund', p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;