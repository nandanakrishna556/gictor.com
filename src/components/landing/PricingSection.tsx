import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Perfect for creators just getting started with AI video ads.",
    monthlyPrice: 30,
    yearlyPrice: 30,
    monthlyCredits: 10,
    yearlyCredits: 151,
    features: [
      "10 credits per month",
      "~1 min 6 sec of video",
      "3 active AI actors",
      "Credits never expire",
      "All core features",
      "Email support",
    ],
    yearlyFeatures: [
      "151 credits per year (31 bonus)",
      "~16 min 46 sec of video",
      "3 active AI actors",
      "Credits never expire",
      "All core features",
      "Email support",
    ],
  },
  {
    name: "Creator",
    description: "For growing brands ready to scale their video ads.",
    monthlyPrice: 79,
    yearlyPrice: 79,
    monthlyCredits: 30,
    yearlyCredits: 444,
    popular: true,
    features: [
      "30 credits per month",
      "~3 min 20 sec of video",
      "10 active AI actors",
      "Credits never expire",
      "Priority support",
      "All Starter features",
    ],
    yearlyFeatures: [
      "444 credits per year (84 bonus)",
      "~49 min 20 sec of video",
      "10 active AI actors",
      "Credits never expire",
      "Priority support",
      "All Starter features",
    ],
  },
  {
    name: "Pro",
    description: "For teams and agencies producing at scale.",
    monthlyPrice: 149,
    yearlyPrice: 149,
    monthlyCredits: 70,
    yearlyCredits: 1008,
    features: [
      "70 credits per month",
      "~7 min 46 sec of video",
      "30 active AI actors",
      "Credits never expire",
      "Priority support",
      "All Creator features",
    ],
    yearlyFeatures: [
      "1,008 credits per year (168 bonus)",
      "~1 hr 52 min of video",
      "30 active AI actors",
      "Credits never expire",
      "Priority support",
      "All Creator features",
    ],
  },
];

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
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 border-2 transition-shadow ${
                plan.popular
                  ? "border-orange-600 shadow-lg ring-1 ring-orange-600"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-base font-bold px-5 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-1 text-3xl">{plan.name}</h3>
                <p className="text-gray-600 text-lg">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-base text-gray-500 ml-1">per month</span>
              </div>

              <Button
                className="w-full rounded-full py-3.5 h-auto text-base font-semibold mb-6 bg-orange-600 hover:bg-orange-700 text-white"
                asChild
              >
                <Link to="/signup">
                  {plan.popular ? "Start free trial" : "Choose Plan"}
                </Link>
              </Button>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">What's included</p>
                <ul className="space-y-3">
                  {(isYearly ? plan.yearlyFeatures : plan.features).map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "bg-orange-100" : "bg-gray-100"
                      }`}>
                        <Check className={`h-3.5 w-3.5 ${plan.popular ? "text-orange-600" : "text-gray-600"}`} />
                      </div>
                      <span className="text-gray-700 text-lg">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
