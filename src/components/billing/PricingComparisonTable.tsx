import { Check, Minus } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/constants/creditPackages';
import { cn } from '@/lib/utils';

export default function PricingComparisonTable() {
  const rows: Array<{ label: string; render: (p: typeof CREDIT_PACKAGES[number]) => React.ReactNode }> = [
    { label: 'Monthly price', render: (p) => <span className="font-semibold text-foreground">${p.monthlyPrice}/mo</span> },
    { label: 'Base credits / month', render: (p) => p.baseCredits.toFixed(2) },
    {
      label: 'Bonus credits / month',
      render: (p) =>
        p.bonusCredits > 0 ? (
          <span className="font-semibold text-primary">+{p.bonusCredits.toFixed(2)}</span>
        ) : (
          <Minus className="inline h-4 w-4 text-muted-foreground" />
        ),
    },
    { label: 'Total credits / month', render: (p) => <span className="font-semibold text-foreground">{p.totalCredits.toFixed(2)}</span> },
    { label: 'Estimated video output', render: (p) => p.monthlyVideoTime },
    { label: 'Unlimited actors', render: () => <Check className="inline h-4 w-4 text-success" /> },
    { label: 'Credits roll over (never expire)', render: () => <Check className="inline h-4 w-4 text-success" /> },
    {
      label: 'Priority support',
      render: (p) =>
        ['pro', 'studio', 'agency'].includes(p.name.toLowerCase()) ? (
          <Check className="inline h-4 w-4 text-success" />
        ) : (
          <Minus className="inline h-4 w-4 text-muted-foreground" />
        ),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-base">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Compare plans
            </th>
            {CREDIT_PACKAGES.map((p) => (
              <th
                key={p.name}
                className={cn(
                  'px-5 py-4 text-center text-base font-bold text-foreground',
                  p.popular && 'bg-primary/10 text-primary'
                )}
              >
                {p.name}
                {p.popular && <div className="text-xs font-semibold uppercase tracking-wide">Most popular</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={cn(i % 2 === 1 && 'bg-muted/10')}>
              <td className="px-5 py-3 text-left text-sm font-medium text-muted-foreground">{row.label}</td>
              {CREDIT_PACKAGES.map((p) => (
                <td
                  key={p.name}
                  className={cn('px-5 py-3 text-center text-foreground', p.popular && 'bg-primary/5')}
                >
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
