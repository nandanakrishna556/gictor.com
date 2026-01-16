-- Update the prevent_credit_manipulation trigger to handle Cloud UI/dashboard access
CREATE OR REPLACE FUNCTION public.prevent_credit_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jwt_claims jsonb;
  current_user_id uuid;
BEGIN
  -- Allow if credits haven't changed
  IF NEW.credits = OLD.credits OR (NEW.credits IS NULL AND OLD.credits IS NULL) THEN
    RETURN NEW;
  END IF;
  
  -- Try to get JWT claims safely
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := NULL;
  END;
  
  -- Allow service_role (edge functions and Cloud UI)
  IF jwt_claims IS NULL OR jwt_claims->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Allow admins to modify credits directly
  IF current_user_id IS NOT NULL AND public.is_admin(current_user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Block credit changes from regular authenticated users
  RAISE EXCEPTION 'Direct credit modifications are not allowed. Use the proper generation or purchase flow.';
END;
$$;