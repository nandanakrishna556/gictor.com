import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tabs = [
  {
    id: "ecommerce",
    label: "E-commerce",
    headline: "Make your products go viral",
    description: "Create compelling product video ads with AI actors that present your products naturally. Test multiple hooks, angles, and scripts. Find what converts best without a single camera.",
    bullets: [
      "AI actors naturally present your product",
      "Test dozens of ad variations in a single day",
      "Ready for TikTok Shop, Meta Ads, and more",
    ],
  },
  {
    id: "agencies",
    label: "Agencies",
    headline: "Scale creative output for every client",
    description: "Deliver more ad variations to clients without increasing headcount. Generate dozens of creatives per campaign and improve ROAS across every account you manage.",
    bullets: [
      "Unlimited creative variations per client",
      "Custom AI actors for each brand",
      "Reduce production costs by 90%",
    ],
  },
  {
    id: "creators",
    label: "Content Creator",
    headline: "Clone yourself and scale your content",
    description: "Let your AI clone post content daily while you focus on strategy. Create videos in 30+ languages and reach new audiences globally.",
    bullets: [
      "Clone your face and voice effortlessly",
      "Post content daily without filming",
      "Reach global audiences in 30+ languages",
    ],
  },
  {
    id: "saas",
    label: "Software",
    headline: "Create profitable ads for your SaaS",
    description: "Have AI actors promote or explain your tool with state-of-the-art lip-syncing. Perfect for product demos, explainer videos, and onboarding content.",
    bullets: [
      "Perfect for explainers and product tutorials",
      "Localize into 30+ languages instantly",
      "Use custom backgrounds to show your app",
    ],
  },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState("ecommerce");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="use-cases" className="py-28 px-6">
      <div className="max-w-6xl mx-auto bg-orange-50/50 rounded-[32px] py-20 px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
            Scale your content
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Get hundreds of ad creatives in minutes, not weeks, all without the hassle of hiring real creators.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-5 text-base font-semibold transition-colors relative ${
                  activeTab === tab.id
                    ? "text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-600" />
                )}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-10 p-8 md:p-12">
            <div className="flex flex-col justify-center">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                {active.headline}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed mb-8">
                {active.description}
              </p>
              <ul className="space-y-4 mb-8">
                {active.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">{bullet}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-orange-600 text-white rounded-full px-8 py-3.5 h-auto text-base font-semibold hover:bg-orange-700 self-start" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </div>

            {/* PLACEHOLDER: Replace with use case video/image */}
            <div className="bg-gray-100 rounded-2xl aspect-[4/5] flex items-center justify-center border-2 border-gray-200">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 mx-auto mb-3" />
                <p className="text-base font-medium">Use case preview</p>
                <p className="text-base text-gray-400 mt-1">Add screenshot or video here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
