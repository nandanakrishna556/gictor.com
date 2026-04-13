import { useState } from "react";
import { Check, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CREDIT_PACKAGES } from "@/constants/creditPackages";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
            Pricing
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed text-xl">
            Whether you're just starting out or scaling, find the plan that works for you.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-full font-semibold transition-colors text-lg ${
                !isYearly ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-full font-semibold transition-colors text-lg ${
                isYearly ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Yearly (Get free credits)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border-2 transition-shadow ${
                pkg.popular
                  ? "border-orange-600 shadow-lg ring-1 ring-orange-600"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-base font-bold px-5 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-1 text-3xl">{pkg.name}</h3>
                <p className="text-gray-600 text-lg">{pkg.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  ${isYearly ? pkg.yearlyPrice : pkg.monthlyPrice}
                </span>
                <span className="text-base text-gray-500 ml-1">
                  {isYearly ? "per year" : "per month"}
                </span>
              </div>

              <Button
                className="w-full rounded-full py-3.5 h-auto text-base font-semibold mb-6 bg-orange-600 hover:bg-orange-700 text-white"
                asChild
              >
                <Link to="/signup">
                  Choose Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Bonus credits gift box for yearly */}
              {isYearly && (
                <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 mb-6">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Gift className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-orange-600">
                      +{pkg.yearlyFreeCredits} bonus credits free
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Worth <span className="font-semibold text-gray-900">{pkg.yearlyFreeCreditsValue}</span> at no additional cost
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <p className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">What's included</p>
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          pkg.popular ? "bg-orange-100" : "bg-gray-100"
                        }`}>
                          <Check className={`h-3.5 w-3.5 ${pkg.popular ? "text-orange-600" : "text-gray-600"}`} />
                        </div>
                        <span className="text-gray-700 text-lg">{feature}</span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
