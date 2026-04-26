import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Gift, ScanFace } from "lucide-react";
import { CREDIT_PACKAGES } from "../data";
import { cn } from "@/lib/utils";

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative bg-white section-pad">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Pricing</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Simple pricing. <span className="text-gradient-orange">Zero surprises.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            Whether you're just starting out or scaling, there's a plan that fits.
          </p>
        </div>

        {/* Toggle */}
        <div className="reveal mt-10 flex items-center justify-center gap-3">
          <div className="relative inline-flex items-center rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn("rounded-full px-5 py-2 text-sm font-semibold transition", !yearly ? "bg-white text-gray-950 shadow-sm" : "text-gray-500")}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn("relative rounded-full px-5 py-2 text-sm font-semibold transition", yearly ? "bg-white text-gray-950 shadow-sm" : "text-gray-500")}
            >
              Yearly
              <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">+ Bonus credits</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3 md:gap-5">
          {CREDIT_PACKAGES.map((pkg, i) => {
            const popular = pkg.popular;
            const price = yearly ? pkg.yearlyPrice : pkg.monthlyPrice;
            return (
              <div
                key={pkg.name}
                className={cn(
                  "reveal relative flex flex-col rounded-3xl p-7 transition",
                  popular
                    ? "scale-[1.03] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]"
                    : "border border-gray-100 bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]"
                )}
                style={{ animationDelay: `${i * 80}ms` }}
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
                  <p className={cn("mt-1 text-[13.5px]", popular ? "text-gray-300" : "text-gray-500")}>{pkg.description}</p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className={cn("text-5xl font-black tracking-[-0.03em]", popular ? "text-white" : "text-gray-950")}>${price}</span>
                    <span className={cn("pb-2 text-sm", popular ? "text-gray-400" : "text-gray-500")}>{yearly ? "/year" : "/month"}</span>
                  </div>

                  {yearly && (
                    <>
                      <div className={cn("mt-3 flex items-center gap-2 rounded-2xl p-3", popular ? "bg-white/10" : "bg-orange-50")}>
                        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", popular ? "bg-orange-500/30 text-orange-300" : "bg-orange-100 text-orange-600")}>
                          <Gift className="h-4 w-4" />
                        </span>
                        <div className="text-[12px]">
                          <div className={cn("font-semibold", popular ? "text-white" : "text-gray-950")}>+{pkg.yearlyFreeCredits} bonus credits free</div>
                          <div className={cn(popular ? "text-gray-400" : "text-gray-500")}>Worth {pkg.yearlyFreeCreditsValue} at no extra cost</div>
                        </div>
                      </div>
                    </>
                  )}

                  <Link
                    to="/signup"
                    className={cn(
                      "mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold transition",
                      popular
                        ? "bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] text-white cta-glow"
                        : "bg-gray-950 text-white hover:bg-gray-800"
                    )}
                  >
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className={cn("mt-7 border-t pt-5", popular ? "border-white/10" : "border-gray-100")}>
                    <div className={cn("text-[11px] font-semibold uppercase tracking-wide", popular ? "text-gray-400" : "text-gray-500")}>What's included</div>
                    <ul className="mt-3 space-y-2.5">
                      {[
                        yearly
                          ? `${pkg.yearlyBaseCredits} credits per year (+${pkg.yearlyFreeCredits} bonus) total ${pkg.yearlyTotalCredits} credits per year`
                          : `${pkg.credits} credits per month`,
                        yearly ? pkg.yearlyVideoTime : pkg.monthlyVideoTime,
                        `${pkg.actorSlots} active AI actors`,
                        "Credits never expire",
                        popular ? "Priority support" : "All core features",
                        i === 0 ? "Email support" : i === 1 ? "All Starter features" : "All Creator features",
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13.5px]">
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

        <p className="mt-10 text-center text-[13px] text-gray-500">
          Cancel anytime. Credits never expire.
        </p>
      </div>
    </section>
  );
}
