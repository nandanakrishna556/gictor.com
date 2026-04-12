import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, CreditCard, Loader2, CheckCircle2, PartyPopper, Check, Film } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { CREDIT_PACKAGES, calculateVideoMinutes } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function Billing() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState<number | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const credits = searchParams.get('credits');

    if (success === 'true') {
      setPurchasedCredits(Number(credits) || 0);
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
          <div className="mx-auto max-w-6xl">
            {/* Success Animation Overlay */}
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
                      <span className="font-bold text-primary">{purchasedCredits}</span> credits per month have been added to your plan
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
                <Coins className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-foreground">
                  {(profile?.credits ?? 0).toFixed(2)} credits available
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Choose Your Plan</h1>
              <p className="mt-2 text-muted-foreground">
                Subscribe monthly or yearly. Credits are added each billing cycle and never expire.
              </p>

              {/* Billing Toggle */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5">
                <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>
                  Monthly
                </span>
                <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                <span className={cn("text-sm font-medium transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>
                  Yearly
                </span>
                {isYearly && (
                  <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Save 20%
                  </span>
                )}
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CREDIT_PACKAGES.map((pkg) => {
                const isPopular = pkg.popular;
                const currentPrice = isYearly ? pkg.yearlyPrice : pkg.monthlyPrice;
                const displayPrice = isYearly ? Math.round(pkg.yearlyPrice / 12) : pkg.monthlyPrice;
                const priceId = isYearly ? pkg.yearlyPriceId : pkg.monthlyPriceId;
                const isLoading = loadingPriceId === priceId;
                const videoMinutes = calculateVideoMinutes(pkg.credits);

                return (
                  <div
                    key={pkg.name}
                    className={cn(
                      "relative flex flex-col rounded-xl border bg-card p-6 transition-all duration-200",
                      isPopular
                        ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02] z-10"
                        : "border-border hover:border-muted-foreground/30 hover:shadow-md"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Package Name */}
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {pkg.name}
                    </p>

                    {/* Price (hero element) */}
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-foreground">${displayPrice}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                    {isYearly && (
                      <p className="mb-5 text-sm text-muted-foreground">
                        ${currentPrice} billed annually
                      </p>
                    )}
                    {!isYearly && (
                      <p className="mb-5 text-sm text-muted-foreground">
                        Billed monthly
                      </p>
                    )}

                    {/* Features */}
                    <ul className="mb-6 flex-1 space-y-2.5">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                        {pkg.credits} credits per month
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Film className="h-4 w-4 flex-shrink-0 text-primary" />
                        ~{videoMinutes} min of video
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                        Credits never expire
                      </li>
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handlePurchase(priceId)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Subscribe
                        </>
                      )}
                    </Button>
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
