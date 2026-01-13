-- =====================================================
-- Security Fix: Prevent Client-Side Credit Manipulation
-- =====================================================

-- 1. REVOKE public access to refund_credits function
-- Only service_role (used by edge functions) can call this function
REVOKE EXECUTE ON FUNCTION public.refund_credits FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_credits FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_credits FROM anon;
GRANT EXECUTE ON FUNCTION public.refund_credits TO service_role;

-- 2. Create a trigger to prevent direct credit updates by users
-- This blocks any attempts to modify credits directly from the client
CREATE OR REPLACE FUNCTION public.prevent_credit_manipulation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if credits haven't changed
  IF NEW.credits = OLD.credits OR (NEW.credits IS NULL AND OLD.credits IS NULL) THEN
    RETURN NEW;
  END IF;
  
  -- Check if this is being called from service_role context
  -- Service role is used by edge functions for legitimate credit operations
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Block credit changes from regular authenticated users
  RAISE EXCEPTION 'Direct credit modifications are not allowed. Use the proper generation or purchase flow.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create trigger on profiles table
DROP TRIGGER IF EXISTS prevent_credit_manipulation_trigger ON public.profiles;
CREATE TRIGGER prevent_credit_manipulation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_credit_manipulation();