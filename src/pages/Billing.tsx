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

  // Fetch the active Stripe price ID for accurate plan matching
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
                Choose the best plan for your needs.<br />
                No hidden fees. Cancel anytime.
              </p>

              {/* Billing Toggle */}
              <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-muted p-1">
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-all",
                    !isYearly
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                    isYearly
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Yearly
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    isYearly
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/15 text-primary"
                  )}>
                    Get free credits
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              {CREDIT_PACKAGES.map((pkg) => {
                const isPopular = pkg.popular;
                const priceId = isYearly ? pkg.yearlyPriceId : pkg.monthlyPriceId;
                const isCurrentPlan = activePriceId === priceId;
                const isLoading = loadingPriceId === priceId;

                return (
                  <div
                    key={pkg.name}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-card transition-all duration-200",
                      isPopular
                        ? "border-primary shadow-lg ring-1 ring-primary/20"
                        : isCurrentPlan
                          ? "border-primary/50 shadow-md"
                          : "border-border hover:border-muted-foreground/30 hover:shadow-md"
                    )}
                  >
                    {/* Badge - Only Most Popular */}
                    {isPopular && (
                      <div className="absolute -top-3.5 left-0 right-0 flex items-center justify-center">
                        <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-sm">
                          🔥 Most Popular
                        </span>
                      </div>
                    )}
                    {/* Card Header */}
                    <div className={cn("px-6 pt-6 pb-0", isPopular && "pt-8")}>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{pkg.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mt-8">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold tracking-tight text-foreground">
                            ${isYearly ? pkg.yearlyPrice : pkg.monthlyPrice}
                          </span>
                          <span className="text-lg text-muted-foreground font-medium">
                            {isYearly ? 'per year' : 'per month'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          ${isYearly
                            ? (pkg.yearlyPrice / pkg.yearlyBaseCredits).toFixed(2)
                            : (pkg.monthlyPrice / pkg.credits).toFixed(2)
                          } per credit
                        </p>
                      </div>

                      {/* Credits - Hero element */}
                      <div className="mt-4 rounded-xl bg-primary/5 border border-primary/10 p-4">
                        {isYearly ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-foreground">
                                {pkg.yearlyBaseCredits} base credits
                              </span>
                              <span className="text-sm text-muted-foreground">/year</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary">+ {pkg.yearlyFreeCredits} free credits</span>
                            </div>
                            <div className="mt-2 h-px bg-border" />
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-2xl font-bold text-foreground">
                                {pkg.yearlyTotalCredits} total credits
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {pkg.yearlyVideoTime}
                            </p>

                            {/* Free credits value callout */}
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2">
                              <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <div>
                                <p className="text-sm font-semibold text-primary">
                                  {pkg.yearlyFreeCredits} bonus credits included
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Worth {pkg.yearlyFreeCreditsValue} at no additional cost
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-foreground">
                                {pkg.credits} credits
                              </span>
                              <span className="text-sm text-muted-foreground">/mo</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {pkg.monthlyVideoTime}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="my-6 h-px bg-border" />
                    </div>

                    {/* Features */}
                    <div className="flex-1 px-6 pb-6">
                      <p className="mb-4 text-sm font-semibold text-foreground">What's Included</p>
                      <ul className="space-y-3.5">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-[15px] font-medium text-foreground">
                            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <div className="p-6 pt-0">
                      <Button
                        className={cn(
                          "w-full h-12 text-base font-bold rounded-xl tracking-wide",
                          !isCurrentPlan && !isPopular && "border-2"
                        )}
                        variant={isCurrentPlan ? "secondary" : isPopular ? "default" : "outline"}
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
