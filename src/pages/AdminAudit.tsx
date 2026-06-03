import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldAlert, RefreshCcw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { cn } from '@/lib/utils';

interface SubscriptionEvent {
  id: string;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  stripe_event_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: string | null;
  credits_granted: number | null;
  billing_reason: string | null;
  status: string;
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

const statusTone: Record<string, string> = {
  credits_granted: 'bg-success/10 text-success border-success/30',
  logged: 'bg-muted text-muted-foreground border-border',
  skipped: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  received: 'bg-muted text-muted-foreground border-border',
};

export default function AdminAudit() {
  const { isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const { data: events = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscription-events'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_events' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as SubscriptionEvent[];
    },
  });

  if (checkingAdmin) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex h-screen flex-col">
          <AppHeader breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]} />
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Admin access required</h2>
              <p className="text-base text-muted-foreground">
                You do not have permission to view subscription audit events.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]} />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Subscription audit log</h1>
                <p className="mt-1 text-base text-muted-foreground">
                  Every Stripe webhook event, who it affected, and what changed. Latest 200 events.
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <div className="py-16 text-center text-base text-muted-foreground">
                  No subscription events recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {events.map((e) => (
                    <li key={e.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">{e.event_type}</span>
                            <Badge variant="outline" className={cn('border', statusTone[e.status] || statusTone.received)}>
                              {e.status}
                            </Badge>
                            {e.plan && <Badge variant="secondary" className="capitalize">{e.plan}</Badge>}
                            {e.billing_reason && (
                              <span className="text-xs text-muted-foreground">{e.billing_reason}</span>
                            )}
                          </div>
                          <div className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                            {e.user_email && <div>User: <span className="text-foreground">{e.user_email}</span></div>}
                            {e.user_id && <div className="truncate">ID: <span className="font-mono text-xs">{e.user_id}</span></div>}
                            {e.stripe_subscription_id && (
                              <div className="truncate">Sub: <span className="font-mono text-xs">{e.stripe_subscription_id}</span></div>
                            )}
                            {e.stripe_price_id && (
                              <div className="truncate">Price: <span className="font-mono text-xs">{e.stripe_price_id}</span></div>
                            )}
                          </div>
                          {e.error_message && (
                            <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                              {e.error_message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right">
                          {e.credits_granted != null && (
                            <span className="text-base font-semibold tabular-nums text-success">
                              +{Number(e.credits_granted).toFixed(2)} credits
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
