import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Briefcase, Video, Code, Check, ArrowRight, TrendingUp, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: ShoppingBag,
    headline: "Make your products go viral.",
    description:
      "Compelling product video ads with AI actors. Test hooks, angles, and scripts. Find what converts without a single camera.",
    bullets: [
      "AI actors naturally present your product",
      "Dozens of ad variations in a day",
      "Ready for TikTok Shop, Meta, and more",
    ],
    metric: { value: "3.2x", label: "average ROAS lift" },
    gradient: "from-blue-400 via-indigo-400 to-sky-500",
  },
  {
    id: "agencies",
    label: "Agencies",
    icon: Briefcase,
    headline: "Scale creative for every client.",
    description:
      "Deliver more ad variations without increasing headcount. Generate dozens of creatives per campaign and lift ROAS across every account.",
    bullets: [
      "Unlimited creative variations per client",
      "Custom AI actors for each brand",
      "Reduce production costs by 90%",
    ],
    metric: { value: "90%", label: "cost reduction" },
    gradient: "from-blue-400 via-indigo-500 to-purple-600",
  },
  {
    id: "creators",
    label: "Creators",
    icon: Video,
    headline: "Clone yourself. Post daily.",
    description:
      "Let your AI twin handle content while you focus on strategy. Videos in 30+ languages, global reach on autopilot.",
    bullets: [
      "Clone your face + voice effortlessly",
      "Post content daily without filming",
      "Reach global audiences in 30+ languages",
    ],
    metric: { value: "30+", label: "languages supported" },
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
  },
  {
    id: "saas",
    label: "SaaS",
    icon: Code,
    headline: "Ads that sell your software.",
    description:
      "AI actors explain your product with state-of-the-art lip-sync. Perfect for demos, explainers, and onboarding.",
    bullets: [
      "Perfect for explainers and tutorials",
      "Localize into 30+ languages instantly",
      "Custom backgrounds to show your app",
    ],
    metric: { value: "< 3min", label: "to first video" },
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
  },
];

export default function UseCasesSection() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;
  const ActiveIcon = tab.icon;

  return (
    <section id="use-cases" className="relative bg-white section-pad">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Use Cases</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Built for every <em className="text-gradient-orange">creative team.</em>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            Hundreds of ad creatives in minutes, not weeks. No hiring, no filming.
          </p>
        </div>

        {/* Tabs */}
        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-gray-950 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Split card */}
        <div className="reveal mt-10 overflow-hidden rounded-[32px] border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)]">
          <div className="grid gap-0 md:grid-cols-2">
            {/* Left */}
            <div className="p-8 md:p-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                <ActiveIcon className="h-3 w-3" /> For {tab.label}
              </span>
              <h3 className="mt-5 text-3xl font-black tracking-[-0.02em] text-gray-950 md:text-4xl">{tab.headline}</h3>
              <p className="mt-4 text-[15.5px] leading-relaxed text-gray-500">{tab.description}</p>

              <ul className="mt-6 space-y-3">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-gray-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl">
                  <em className="text-gradient-orange">{tab.metric.value}</em>
                </div>
                <div className="mt-1 text-[13px] text-gray-500">{tab.metric.label}</div>
              </div>
            </div>

            {/* Right - phone mock */}
            <div className="relative grid place-items-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-12">
              <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
              <div className="pointer-events-none absolute -right-10 top-10 h-60 w-60 rounded-full bg-blue-100/40 blur-[80px]" />

              <div className="relative">
                {/* Phone */}
                <div className="relative h-[460px] w-[230px] overflow-hidden rounded-[44px] border-[10px] border-gray-950 bg-gray-950 shadow-2xl">
                  <div className={cn("absolute inset-0 bg-gradient-to-br", tab.gradient)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
                  {/* notch */}
                  <div className="absolute left-1/2 top-1.5 h-5 w-20 -translate-x-1/2 rounded-full bg-gray-950" />
                  {/* center play */}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 shadow-xl backdrop-blur">
                      <Play className="ml-0.5 h-5 w-5 fill-gray-950 text-gray-950" />
                    </div>
                  </div>
                  {/* caption card */}
                  <div className="absolute bottom-4 left-3 right-3 rounded-2xl bg-white p-3 shadow-xl">
                    <div className="h-1.5 w-2/3 rounded-full bg-gray-200" />
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-gray-200" />
                  </div>
                </div>

                {/* Floating CTR badge */}
                <div className="absolute -right-6 top-12 flex items-center gap-2 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-gray-100">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-gray-500">CTR</div>
                    <div className="text-sm font-bold text-emerald-600">+142%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
