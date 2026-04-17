import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionSyncResponse {
  subscribed: boolean;
  plan: string | null;
  price_id?: string | null;
  subscription_end?: string | null;
}

export async function syncSubscription(accessToken: string) {
  return supabase.functions.invoke<SubscriptionSyncResponse>('check-subscription', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}