import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, Loader2, CheckCircle2, PartyPopper, Check, ArrowRight, Gift, Crown, Settings } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { CREDIT_PACKAGES } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [activePriceId, setActivePriceId] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

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
        const { data } = await supabase.functions.invoke('check-subscription');
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
      refetchProfile();
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
              <div className="mb-4 flex items-center justify-center gap-3">
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

              {/* Billing Toggle - matching landing page style */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-semibold transition-colors text-base",
                    !isYearly
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-semibold transition-colors text-base",
                    isYearly
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Yearly (Get free credits)
                </button>
              </div>
            </div>

            {/* Pricing Cards - matching landing page design */}
            <div className="grid gap-6 lg:grid-cols-3">
              {CREDIT_PACKAGES.map((pkg, i) => {
                const priceId = isYearly ? pkg.yearlyPriceId : pkg.monthlyPriceId;
                const isCurrentPlan = activePriceId === priceId;
                const isLoading = loadingPriceId === priceId;

                return (
                  <div
                    key={pkg.name}
                    className={cn(
                      "relative rounded-2xl p-8 border-2 transition-shadow",
                      pkg.popular
                        ? "border-primary shadow-lg ring-1 ring-primary"
                        : "border-border shadow-sm"
                    )}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-base font-bold px-5 py-1 rounded-full whitespace-nowrap">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="font-bold text-foreground mb-1 text-3xl">{pkg.name}</h3>
                      <p className="text-muted-foreground text-lg">{pkg.description}</p>
                    </div>

                    <div className="mb-6">
                      <span className="text-5xl font-bold text-foreground">
                        ${isYearly ? pkg.yearlyPrice : pkg.monthlyPrice}
                      </span>
                      <span className="text-base text-muted-foreground ml-1">
                        {isYearly ? 'per year' : 'per month'}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={cn(
                        "w-full rounded-full py-3.5 h-auto text-base font-semibold mb-6",
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

                    {/* Bonus credits gift box for yearly */}
                    {isYearly && (
                      <div className="flex items-start gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-6">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                          <Gift className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-primary">
                            +{pkg.yearlyFreeCredits} bonus credits free
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Worth <span className="font-semibold text-foreground">{pkg.yearlyFreeCreditsValue}</span> at no additional cost
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-6">
                      <p className="text-base font-bold text-foreground mb-4 uppercase tracking-wide">What's included</p>
                      <ul className="space-y-3">
                        {(() => {
                          const features = isYearly
                            ? [
                                `${pkg.yearlyTotalCredits} credits per year (${pkg.yearlyFreeCredits} bonus)`,
                                pkg.yearlyVideoTime,
                                `${pkg.actorSlots} active AI actors`,
                                "Credits never expire",
                                ...(pkg.features.includes("Priority support") ? ["Priority support"] : ["All core features"]),
                                i === 0 ? "Email support" : i === 1 ? "All Starter features" : "All Creator features",
                              ]
                            : [
                                `${pkg.credits} credits per month`,
                                pkg.monthlyVideoTime,
                                `${pkg.actorSlots} active AI actors`,
                                "Credits never expire",
                                ...(pkg.features.includes("Priority support") ? ["Priority support"] : ["All core features"]),
                                i === 0 ? "Email support" : i === 1 ? "All Starter features" : "All Creator features",
                              ];
                          return features.map((feature, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                pkg.popular ? "bg-primary/15" : "bg-muted"
                              )}>
                                <Check className={cn("h-3.5 w-3.5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
                              </div>
                              <span className="text-foreground text-lg">{feature}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
