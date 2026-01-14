import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, CreditCard, Loader2, Sparkles } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { CREDIT_PACKAGES, CREDIT_COSTS } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const credits = searchParams.get('credits');

    if (success === 'true') {
      toast.success(`Successfully purchased ${credits} credits!`);
      refetchProfile();
      setSearchParams({});
    } else if (canceled === 'true') {
      toast.info('Purchase canceled');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetchProfile]);

  const selectedPkg = CREDIT_PACKAGES.find((pkg) => pkg.priceId === selectedPackage);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('Please select a credit package');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: selectedPackage },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(false);
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
                {CREDIT_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.priceId;
                  return (
                    <button
                      key={pkg.priceId}
                      onClick={() => setSelectedPackage(pkg.priceId)}
                      className={cn(
                        "relative rounded-2xl border bg-card p-5 text-left shadow-apple transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-lg",
                        isSelected
                          ? "border-primary ring-2 ring-primary scale-[1.02]"
                          : pkg.popular
                          ? "border-primary/30"
                          : "border-border"
                      )}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                          Popular
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="mb-2">
                        <p className="text-3xl font-bold text-foreground">
                          {pkg.credits}
                        </p>
                        <p className="text-sm text-muted-foreground">credits</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(pkg.price / pkg.credits).toFixed(2)} per credit
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Package Summary & Buy Button */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-apple">
                {selectedPkg ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Selected</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedPkg.credits} credits
                        </p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="text-3xl font-bold text-primary">
                          ${selectedPkg.price}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handlePurchase}
                      disabled={isLoading}
                      className="min-w-[180px] rounded-xl text-base font-semibold shadow-primary-glow"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Buy Now
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Select a credit package above to continue
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