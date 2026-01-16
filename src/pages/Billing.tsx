import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, CreditCard, Loader2, Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { CREDIT_PACKAGES } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';

// Find the 28 credits package priceId for default selection
const DEFAULT_PACKAGE = CREDIT_PACKAGES.find((pkg) => pkg.credits === 28)?.priceId || CREDIT_PACKAGES[1]?.priceId;

// Helper to find package by credits
const getPackageByCredits = (credits: number) => CREDIT_PACKAGES.find((pkg) => pkg.credits === credits);

export default function Billing() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState<number | null>(null);

  // Handle initial package selection from query params or default
  useEffect(() => {
    const packageParam = searchParams.get('package');
    
    if (packageParam) {
      const credits = parseInt(packageParam, 10);
      const pkg = getPackageByCredits(credits);
      if (pkg) {
        setSelectedPackage(pkg.priceId);
        // Clear the package param to avoid reselecting on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('package');
        setSearchParams(newParams, { replace: true });
      } else {
        setSelectedPackage(DEFAULT_PACKAGE);
      }
    } else if (!selectedPackage) {
      setSelectedPackage(DEFAULT_PACKAGE);
    }
  }, []);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const credits = searchParams.get('credits');

    if (success === 'true') {
      setPurchasedCredits(Number(credits) || 0);
      setShowSuccess(true);
      refetchProfile();
      setSearchParams({});
      // Hide success animation after 4 seconds
      setTimeout(() => setShowSuccess(false), 4000);
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
            {/* Success Animation Overlay */}
            {showSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col items-center gap-6 rounded-3xl border border-primary/20 bg-card p-12 shadow-2xl animate-scale-in">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-14 w-14 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <PartyPopper className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Purchase Successful!</h2>
                      <PartyPopper className="h-6 w-6 text-primary scale-x-[-1]" />
                    </div>
                    <p className="text-lg text-muted-foreground">
                      <span className="font-bold text-primary">{purchasedCredits}</span> credits have been added to your account
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowSuccess(false)}
                    className="mt-2"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

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

            {/* Purchase Credits */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Purchase Credits
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CREDIT_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.priceId;
                  const isMostPopular = pkg.credits === 28;
                  return (
                    <button
                      key={pkg.priceId}
                      onClick={() => setSelectedPackage(pkg.priceId)}
                      className={cn(
                        "relative rounded-2xl border bg-card p-5 text-left shadow-apple transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-lg",
                        isSelected
                          ? "border-primary ring-2 ring-primary scale-[1.02]"
                          : isMostPopular
                          ? "border-primary/30"
                          : "border-border"
                      )}
                    >
                      {isMostPopular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                          Most Popular
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