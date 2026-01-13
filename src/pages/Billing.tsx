import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Coins, CreditCard, ArrowUpRight, ArrowDownRight, Loader2, Check } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { CREDIT_PACKAGES, CREDIT_COSTS } from '@/constants/creditPackages';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export default function Billing() {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const credits = searchParams.get('credits');

    if (success === 'true') {
      toast.success(`Successfully purchased ${credits} credits!`);
      refetchProfile();
      // Clean up URL
      setSearchParams({});
    } else if (canceled === 'true') {
      toast.info('Purchase canceled');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetchProfile]);

  const { data: transactions } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user,
  });

  const handlePurchase = async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader breadcrumbs={[{ label: 'Billing' }]} />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* Current Balance */}
            <div className="mb-8 rounded-2xl border border-border bg-card p-8 shadow-apple">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
                  <Coins className="h-7 w-7 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available Credits
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {profile?.credits ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Credit Costs Info */}
            <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-apple">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Credit Usage
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Lip Sync</span>
                  <span className="font-medium text-foreground">{CREDIT_COSTS.lip_sync_per_second} / sec</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Speech</span>
                  <span className="font-medium text-foreground">{CREDIT_COSTS.speech_per_1000_chars} / 1k chars</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Script</span>
                  <span className="font-medium text-foreground">{CREDIT_COSTS.script_per_generation} / gen</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Frame</span>
                  <span className="font-medium text-foreground">{CREDIT_COSTS.frame_per_generation} / gen</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Animate</span>
                  <span className="font-medium text-foreground">{CREDIT_COSTS.animate_per_second} / sec</span>
                </div>
              </div>
            </div>

            {/* Purchase Credits */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Purchase Credits
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.priceId}
                    className={`relative rounded-2xl border bg-card p-5 shadow-apple transition-apple hover-lift ${
                      pkg.popular
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                        Popular
                      </span>
                    )}
                    <div className="mb-4">
                      <p className="text-3xl font-semibold text-foreground">
                        {pkg.credits}
                      </p>
                      <p className="text-sm text-muted-foreground">credits</p>
                    </div>
                    <div className="mb-4 text-sm text-muted-foreground">
                      ${(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                    <Button
                      variant={pkg.popular ? 'default' : 'outline'}
                      className="w-full rounded-xl"
                      onClick={() => handlePurchase(pkg.priceId)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      ${pkg.price}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Transaction History
              </h2>
              <div className="rounded-2xl border border-border bg-card shadow-apple">
                {!transactions || transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              tx.amount > 0
                                ? 'bg-success/10'
                                : 'bg-destructive/10'
                            }`}
                          >
                            {tx.amount > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {tx.transaction_type === 'purchase'
                                ? 'Credits purchased'
                                : tx.transaction_type === 'usage'
                                ? 'Generation'
                                : tx.transaction_type === 'refund'
                                ? 'Credits refunded'
                                : tx.transaction_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tx.description ||
                                formatDistanceToNow(new Date(tx.created_at), {
                                  addSuffix: true,
                                })}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold ${
                            tx.amount > 0 ? 'text-success' : 'text-foreground'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {tx.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
