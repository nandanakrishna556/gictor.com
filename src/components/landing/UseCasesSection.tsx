import { useState } from "react";
import { ShoppingBag, Building2, Palette, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tabs = [
  {
    id: "ecommerce",
    icon: ShoppingBag,
    label: "E-commerce",
    headline: "Make Your Products Go Viral",
    description: "Generate scroll-stopping product ads with AI actors that hold, wear, and demo your products. Test 20 angles in a day instead of waiting weeks for a single shoot.",
    bullets: [
      "AI actors naturally interact with your product",
      "Test multiple hooks and angles instantly",
      "Ready for TikTok Shop, Meta Ads, and more",
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
      "White-label ready with custom actors",
      "Reduce production costs by 90%",
    ],
  },
  {
    id: "creators",
    icon: Palette,
    label: "Content Creators",
    headline: "Create Without Being On Camera",
    description: "Clone yourself and let your AI twin create content while you focus on strategy. Or use any of our AI actors to test new content formats risk-free.",
    bullets: [
      "Clone your face and voice",
      "Post consistently without burnout",
      "Test new niches with different AI actors",
    ],
  },
  {
    id: "saas",
    icon: Monitor,
    label: "SaaS & Apps",
    headline: "Explainer Videos That Convert",
    description: "Have AI actors present your software, walk through features, and explain benefits. Use green screen mode to show your app interface behind the presenter.",
    bullets: [
      "Perfect for product demos and tutorials",
      "Green screen for app UI walkthroughs",
      "Localize into 30+ languages instantly",
    ],
  },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState("ecommerce");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="use-cases" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Built For You
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Scale Your Content
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Hundreds of ad creatives in minutes, not weeks.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{active.headline}</h3>
            <p className="text-base text-gray-500 leading-relaxed mb-8">{active.description}</p>
            <ul className="space-y-4 mb-8">
              {active.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
            <Button className="bg-gray-900 text-white rounded-full px-6 hover:bg-gray-800" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
          <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Use case preview</p>
              <p className="text-xs text-gray-400 mt-1">Add screenshot or video here</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
