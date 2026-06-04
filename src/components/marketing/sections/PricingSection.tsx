import { Link } from "react-router-dom";
import { Check, ArrowRight, Gift, ScanFace } from "lucide-react";
import { CREDIT_PACKAGES } from "../data";
import { cn } from "@/lib/utils";
import PricingComparisonTable from "@/components/billing/PricingComparisonTable";

export default function PricingSection() {
  return (
    <section id="pricing" className="relative bg-white section-pad">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Pricing</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Simple monthly pricing. <span className="text-gradient-orange">Zero surprises.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            All plans are monthly. Credits roll over and never expire.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg, i) => {
            const popular = pkg.popular;
            const hasBonus = pkg.bonusCredits > 0;
            return (
              <div
                key={pkg.name}
                className={cn(
                  "reveal relative flex flex-col rounded-3xl p-6 transition",
                  popular
                    ? "scale-[1.03] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]"
                    : "border border-gray-100 bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {popular && (
                  <>
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/30 blur-3xl" />
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-br from-[#ff8a4c] to-[#e85a1f] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
                      <ScanFace className="h-3 w-3" /> Most Popular
                    </span>
                  </>
                )}

                <div className="relative">
                  <h3 className={cn("text-xl font-bold tracking-tight", popular ? "text-white" : "text-gray-950")}>{pkg.name}</h3>
                  <p className={cn("mt-1 text-[13px]", popular ? "text-gray-300" : "text-gray-500")}>{pkg.description}</p>

                  <div className="mt-5 flex items-end gap-1.5">
                    <span className={cn("text-4xl font-black tracking-[-0.03em]", popular ? "text-white" : "text-gray-950")}>${pkg.monthlyPrice}</span>
                    <span className={cn("pb-1.5 text-sm", popular ? "text-gray-400" : "text-gray-500")}>/month</span>
                  </div>

                  {hasBonus && (
                    <div className={cn("mt-3 flex items-center gap-2 rounded-2xl p-3", popular ? "bg-white/10" : "bg-orange-50")}>
                      <span className={cn("grid h-8 w-8 place-items-center rounded-lg", popular ? "bg-orange-500/30 text-orange-300" : "bg-orange-100 text-orange-600")}>
                        <Gift className="h-4 w-4" />
                      </span>
                      <div className="text-[12px]">
                        <div className={cn("font-semibold", popular ? "text-white" : "text-gray-950")}>+{pkg.bonusCredits} bonus credits/mo</div>
                        <div className={cn(popular ? "text-gray-400" : "text-gray-500")}>Included every month</div>
                      </div>
                    </div>
                  )}

                  <Link
                    to="/signup"
                    className={cn(
                      "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold transition",
                      popular
                        ? "bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] text-white cta-glow"
                        : "bg-gray-950 text-white hover:bg-gray-800"
                    )}
                  >
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className={cn("mt-6 border-t pt-5", popular ? "border-white/10" : "border-gray-100")}>
                    <div className={cn("text-[11px] font-semibold uppercase tracking-wide", popular ? "text-gray-400" : "text-gray-500")}>What's included</div>
                    <ul className="mt-3 space-y-2.5">
                      {[
                        hasBonus
                          ? `${pkg.baseCredits} credits + ${pkg.bonusCredits} bonus = ${pkg.totalCredits} credits/month`
                          : `${pkg.totalCredits} credits per month`,
                        pkg.monthlyVideoTime,
                        ...pkg.features,
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px]">
                          <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full", popular ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-600")}>
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                          <span className={cn(popular ? "text-gray-200" : "text-gray-700")}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <h3 className="mb-6 text-center text-2xl font-black tracking-[-0.02em] text-gray-950">
            Full plan comparison
          </h3>
          <PricingComparisonTable />
        </div>

        <p className="mt-10 text-center text-[13px] text-gray-500">
          Cancel anytime. Credits roll over and never expire.
        </p>
      </div>
    </section>
  );
}
