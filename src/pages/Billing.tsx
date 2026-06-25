import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, Loader2, CheckCircle2, PartyPopper, Check, ArrowRight, Gift, Crown, Settings, ArrowDownLeft, ArrowUpRight, RotateCcw, History } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { CREDIT_PACKAGES } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';
import { syncSubscription } from '@/lib/subscription-sync';
import { useCreditTransactions } from '@/hooks/useCreditTransactions';
import PricingComparisonTable from '@/components/billing/PricingComparisonTable';

export default function Billing() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePriceId, setActivePriceId] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { data: transactions = [], isLoading: isLoadingTransactions } = useCreditTransactions(50);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.fallback) {
        toast.error(data.error || 'Please subscribe to a plan first.');
        return;
      }
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    const fetchActivePriceId = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) return;

        const { data, error } = await syncSubscription(accessToken);
        if (error) throw error;

        if (data?.price_id) {
          setActivePriceId(data.price_id);
        }
      } catch (e) {
        console.error('Failed to fetch subscription details:', e);
      }
    };
    fetchActivePriceId();
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setShowSuccess(true);
      toast.success('Purchase successful! Your credits have been added.');
      // Sync subscription + refetch credits (webhook may take a moment)
      (async () => {
        const sync = async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) return;
            const { data } = await syncSubscription(accessToken);
            if (data?.price_id) setActivePriceId(data.price_id);
          } catch (e) {
            console.error('Subscription sync failed:', e);
          }
          refetchProfile();
        };
        await sync();
        setTimeout(sync, 2500);
        setTimeout(sync, 6000);
      })();
      setSearchParams({});
      setTimeout(() => setShowSuccess(false), 4000);
    } else if (canceled === 'true') {
      toast.info('Purchase canceled');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetchProfile]);

  const handlePurchase = async (priceId: string) => {
    setLoadingPriceId(priceId);
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
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader breadcrumbs={[{ label: 'Billing' }]} />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* Success Overlay */}
            {showSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col items-center gap-6 rounded-2xl border border-primary/20 bg-card p-12 shadow-2xl animate-scale-in">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-14 w-14 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <PartyPopper className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Subscription Active!</h2>
                      <PartyPopper className="h-6 w-6 text-primary scale-x-[-1]" />
                    </div>
                    <p className="text-lg text-muted-foreground">
                      Your plan is now active. Credits will be added each billing cycle.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowSuccess(false)} className="mt-2">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-10 text-center">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-foreground">
                    {(profile?.credits ?? 0).toFixed(2)} credits available
                  </span>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
                  profile?.plan
                    ? "border border-primary/30 bg-primary/10"
                    : "border border-border bg-card"
                )}>
                  <Crown className={cn("h-4 w-4", profile?.plan ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium capitalize", profile?.plan ? "text-primary" : "text-muted-foreground")}>
                    {profile?.plan ? `${profile.plan} Plan` : 'No Active Plan'}
                  </span>
                </div>
                {profile?.plan && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                  >
                    {loadingPortal ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Settings className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Manage Subscription
                  </Button>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground">Select plan</h1>
              <p className="mt-2 text-muted-foreground">
                Choose the best plan for your needs. No hidden fees. Cancel anytime.
              </p>

            </div>

            {/* Pricing Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {CREDIT_PACKAGES.map((pkg) => {
                const priceId = pkg.monthlyPriceId;
                const isCurrentPlan = activePriceId === priceId;
                const isLoading = loadingPriceId === priceId;
                const hasBonus = pkg.bonusCredits > 0;

                return (
                  <div
                    key={pkg.name}
                    className={cn(
                      "relative rounded-2xl p-6 border-2 transition-shadow flex flex-col",
                      pkg.popular
                        ? "border-primary shadow-lg ring-1 ring-primary"
                        : "border-border shadow-sm"
                    )}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full whitespace-nowrap">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="font-bold text-foreground mb-1 text-2xl">{pkg.name}</h3>
                      <p className="text-muted-foreground text-base">{pkg.description}</p>
                    </div>

                    <div className="mb-5">
                      <span className="text-4xl font-bold text-foreground">${pkg.monthlyPrice}</span>
                      <span className="text-base text-muted-foreground ml-1">per month</span>
                    </div>

                    <Button
                      className={cn(
                        "w-full rounded-full py-3 h-auto text-base font-semibold mb-5",
                        isCurrentPlan
                          ? ""
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                      variant={isCurrentPlan ? "secondary" : "default"}
                      onClick={() => !isCurrentPlan && handlePurchase(priceId)}
                      disabled={isLoading || isCurrentPlan}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          Choose Plan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {hasBonus && (
                      <div className="flex items-start gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                          <Gift className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">
                            +{pkg.bonusCredits} bonus credits/mo
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Included every month
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-5 mt-auto">
                      <p className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">What's included</p>
                      <ul className="space-y-2.5">
                        {[
                          hasBonus
                            ? `${pkg.baseCredits} + ${pkg.bonusCredits} bonus = ${pkg.totalCredits} credits/mo`
                            : `${pkg.totalCredits} credits per month`,
                          pkg.monthlyVideoTime,
                          ...pkg.features,
                        ].map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              pkg.popular ? "bg-primary/15" : "bg-muted"
                            )}>
                              <Check className={cn("h-3 w-3", pkg.popular ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <span className="text-foreground text-base">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plan Comparison Table */}
            <div className="mt-12">
              <h2 className="mb-4 text-2xl font-bold text-foreground">Compare plans side by side</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                See exactly how monthly credits, bonus credits, and features stack up across plans.
              </p>
              <PricingComparisonTable />
            </div>

            {/* Credit Transactions History */}
            <div className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground">Credit history</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Recent credit usage, purchases, and refunds for failed generations.
              </p>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No credit activity yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {transactions.map((tx) => {
                      const isRefund = tx.transaction_type === 'refund';
                      const isPurchase = tx.transaction_type === 'purchase' || tx.transaction_type === 'subscription';
                      const isPositive = tx.amount > 0;

                      const Icon = isRefund ? RotateCcw : isPositive ? ArrowDownLeft : ArrowUpRight;
                      const iconBg = isRefund
                        ? 'bg-warning/10 text-warning'
                        : isPositive
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground';

                      // Normalize text to sentence case for consistency
                      const toSentenceCase = (s: string) => {
                        const trimmed = s.trim();
                        if (!trimmed) return trimmed;
                        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                      };

                      const rawDescription = tx.description ? toSentenceCase(tx.description) : '';

                      const label = isRefund
                        ? 'Credits refunded'
                        : isPurchase
                        ? 'Credits added'
                        : rawDescription || 'Credit usage';

                      const dateText = tx.created_at
                        ? new Date(tx.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '';

                      return (
                        <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                                iconBg
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {label}
                              </p>
                              {tx.description && !isRefund && !isPurchase && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {rawDescription}
                                </p>
                              )}
                              {isRefund && tx.description && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {rawDescription}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground/80">{dateText}</p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-sm font-semibold tabular-nums',
                              isPositive ? 'text-success' : 'text-foreground'
                            )}
                          >
                            {isPositive ? '+' : ''}
                            {tx.amount.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
