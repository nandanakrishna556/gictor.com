import { useState } from "react";
import { Megaphone, Building2, ShoppingBag, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tabs = [
  {
    id: "ads",
    icon: Megaphone,
    label: "Paid Ads",
    headline: "High-Converting Talking Head Ads at Scale",
    description: "Generate dozens of ad variations in a single day. Test different actors, scripts, and hooks to find what converts best. No actors to hire, no shoots to schedule.",
    bullets: [
      "Realistic AI actors that build trust",
      "Test multiple hooks and angles instantly",
      "Ready for Meta Ads, YouTube, TikTok, and more",
    ],
  },
  {
    id: "agencies",
    icon: Building2,
    label: "Agencies",
    headline: "Scale Creative Output 10x",
    description: "Deliver more ad variations to clients without increasing headcount. Generate dozens of creatives per campaign, A/B test at scale, and improve ROAS across every account.",
    bullets: [
      "Unlimited creative variations per client",
      "Custom AI actors for each brand",
      "Reduce production costs by 90%",
    ],
  },
  {
    id: "ecommerce",
    icon: ShoppingBag,
    label: "E-commerce",
    headline: "Product Ads That Drive Sales",
    description: "Create compelling product demonstration videos with AI actors that present your products naturally. Test 20 angles in a day instead of waiting weeks for a single shoot.",
    bullets: [
      "AI actors naturally present your product",
      "Test multiple hooks and angles instantly",
      "Ready for TikTok Shop, Meta Ads, and more",
    ],
  },
  {
    id: "saas",
    icon: Monitor,
    label: "SaaS & Apps",
    headline: "Explainer Videos That Convert",
    description: "Have AI actors present your software, walk through features, and explain benefits. Perfect for product demos, tutorials, and onboarding videos.",
    bullets: [
      "Perfect for product demos and tutorials",
      "Localize into 30+ languages instantly",
      "Scale your video marketing effortlessly",
    ],
  },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState("ads");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="use-cases" className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Built For You
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Scale Your Video Ads
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Hundreds of ad creatives in minutes, not weeks.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">{active.headline}</h3>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">{active.description}</p>
            <ul className="space-y-4 mb-10">
              {active.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span className="text-base text-gray-700 font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
            <Button className="bg-orange-600 text-white rounded-full px-8 py-3 text-base font-semibold hover:bg-orange-700" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
          </div>
          <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 mx-auto mb-3" />
              <p className="text-base font-medium">Use case preview</p>
              <p className="text-sm text-gray-400 mt-1">Add screenshot or video here</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
