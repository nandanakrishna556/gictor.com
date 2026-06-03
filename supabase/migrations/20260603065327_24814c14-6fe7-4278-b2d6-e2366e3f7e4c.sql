
CREATE TABLE public.subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT,
  credits_granted NUMERIC,
  billing_reason TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX idx_subscription_events_created_at ON public.subscription_events(created_at DESC);
CREATE INDEX idx_subscription_events_event_type ON public.subscription_events(event_type);

GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all subscription events"
  ON public.subscription_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Deny anonymous access to subscription events"
  ON public.subscription_events
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
