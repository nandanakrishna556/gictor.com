import { useQuery } from '@tanstack/react-query';
import { Coins, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

const creditPackages = [
  { credits: 50, price: 5, popular: false },
  { credits: 100, price: 10, popular: true },
  { credits: 250, price: 20, popular: false },
  { credits: 500, price: 35, popular: false },
];

export default function Billing() {
  const { user } = useAuth();
  const { profile } = useProfile();

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

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader breadcrumbs={[{ label: 'Billing' }]} />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.credits}
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
                    <p className="mb-1 text-2xl font-semibold text-foreground">
                      {pkg.credits}
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">credits</p>
                    <Button
                      variant={pkg.popular ? 'default' : 'outline'}
                      className="w-full rounded-xl"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />$
                      {pkg.price}
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
                                : 'Credits refunded'}
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
