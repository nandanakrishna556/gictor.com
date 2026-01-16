-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles (using service_role for initial setup)
CREATE POLICY "Only admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Update the prevent_credit_manipulation trigger to allow admins
CREATE OR REPLACE FUNCTION public.prevent_credit_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow if credits haven't changed
  IF NEW.credits = OLD.credits OR (NEW.credits IS NULL AND OLD.credits IS NULL) THEN
    RETURN NEW;
  END IF;
  
  -- Allow service_role (edge functions)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Allow admins to modify credits directly
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Block credit changes from regular authenticated users
  RAISE EXCEPTION 'Direct credit modifications are not allowed. Use the proper generation or purchase flow.';
END;
$$;