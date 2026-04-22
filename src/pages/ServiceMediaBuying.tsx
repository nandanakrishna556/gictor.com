import ServicePageLayout from "@/components/marketing/ServicePageLayout";

export default function ServiceMediaBuying() {
  return (
    <ServicePageLayout
      pageTitle="Media Buying & Performance Ads — Gictor"
      pageDescription="Full-stack media buying on Meta, TikTok, YouTube, and Google. AI creative engine + human strategy + weekly optimization. Avg 2.1x ROAS lift."
      eyebrow="Full-stack media buying"
      eyebrowEmoji="🎯"
      h1Top="Performance ads that"
      h1Highlight="actually perform."
      sub="We run your paid accounts on Meta, TikTok, YouTube, and Google. AI creative, human strategy, and a weekly cadence that keeps ROAS climbing."
      heroBullets={["Weekly creative refresh", "Cross-platform expertise", "Transparent reporting"]}
      statsPills={[
        { emoji: "📈", label: "Avg 2.1x ROAS lift" },
        { emoji: "🧪", label: "5+ hooks / week" },
        { emoji: "💸", label: "No retainer lock-in" },
      ]}
      deliverablesHeader="One team running creative and media as one engine."
      deliverables={[
        { emoji: "🎯", title: "Campaign strategy", description: "We audit your current funnel, map your audiences, and build a test plan that ties creative directly to the metrics you report to your board.", accent: "from-blue-500 to-indigo-500", bg: "bg-blue-50" },
        { emoji: "⚡", title: "AI creative engine", description: "Dozens of ad variations per week using Gictor's AI actors. You never wait on a production schedule to test a new hook again.", accent: "from-orange-500 to-amber-500", bg: "bg-orange-50" },
        { emoji: "🎛️", title: "Daily account ops", description: "Bid tuning, audience refinement, budget reallocation, and pixel hygiene. We don't wait a week to fix what's broken.", accent: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
        { emoji: "🔁", title: "Creative iteration", description: "Ad fatigue is the silent killer of ROAS. We spin up fresh variations the moment frequency creeps up, so your CPMs stay honest.", accent: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
        { emoji: "📊", title: "Weekly reporting", description: "Clean, operator-ready reports. What we spent, what we learned, what we're changing next week. No dashboard spaghetti.", accent: "from-purple-500 to-fuchsia-500", bg: "bg-purple-50" },
        { emoji: "🚀", title: "Scale & protect", description: "When a winner appears, we scale it aggressively while protecting CPA. When a loser appears, we cut it before it drains the budget.", accent: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
      ]}
      processHeader="Onboarded in a week, optimized every week after."
      process={[
        { emoji: "🔍", title: "Account audit", description: "We review your ad accounts, pixel, offers, and past creative. You get a written audit with 10+ specific next moves.", duration: "Days 1 to 3" },
        { emoji: "🧪", title: "Test plan", description: "We pick 5 angles, script the hooks, and queue them for production. You approve before anything spends a dollar.", duration: "Days 4 to 6" },
        { emoji: "🚦", title: "Go live", description: "Ads push to your accounts with structured budgets and naming. Tracking is validated end-to-end before we scale.", duration: "Week 2" },
        { emoji: "📈", title: "Compound", description: "Weekly creative refresh, daily account ops, and monthly strategy reviews. ROAS goes up, then up again.", duration: "Ongoing" },
      ]}
      pricingHeadline="Full-service media buying, priced like a partner."
      pricingPrice="$6,000"
      pricingCadence="/ month + % of spend"
      pricingIncluded={[
        "Dedicated media buyer + strategist",
        "Up to 4 ad platforms managed",
        "40+ creative variants per month",
        "Daily account management",
        "Weekly reports + strategy calls",
        "No long-term contract",
      ]}
      whoItsFor={[
        "E-commerce brands at $50k to $1M/mo ad spend",
        "Agencies looking to white-label creative + buying",
        "SaaS teams scaling demand gen past organic",
        "Founders who refuse to babysit ad accounts",
      ]}
      finalCtaTitle={{ plain: "Stop wasting spend.", italic: "Start compounding." }}
      finalCtaSub="Book a 20-minute call. We'll come back with an account audit and a first-week test plan, no obligation."
    />
  );
}
