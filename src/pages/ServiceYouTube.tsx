import ServicePageLayout from "@/components/marketing/ServicePageLayout";

export default function ServiceYouTube() {
  return (
    <ServicePageLayout
      pageTitle="YouTube Video Ad Production — Gictor"
      pageDescription="Done-for-you YouTube ads with AI hosts, cinematic post-production, and weekly performance loops. First cut in 72 hours."
      eyebrow="Done-for-you YouTube ads"
      eyebrowEmoji="📺"
      h1Top="YouTube ads that"
      h1Highlight="stop the scroll."
      sub="We script, produce, and optimize AI-hosted YouTube ads. You get pre-roll, in-feed, and Shorts creative that fits your brand and actually converts."
      heroBullets={["Scripts that hook in 3 seconds", "Lip-synced AI hosts", "Multi-variant A/B tested"]}
      statsPills={[
        { emoji: "⚡", label: "First cut in 72 hrs" },
        { emoji: "🎬", label: "20+ variants/mo" },
        { emoji: "🌍", label: "30+ languages" },
      ]}
      deliverablesHeader="Everything for a YouTube ad program, in one engagement."
      deliverables={[
        { emoji: "✍️", title: "Hook-first scripts", description: "Written by operators who've shipped thousands of ads. We open with the strongest pattern interrupt and test multiple hooks per week.", accent: "from-orange-500 to-amber-500", bg: "bg-orange-50" },
        { emoji: "🎭", title: "Custom AI hosts", description: "Pick from our library or clone your founder. Natural lip-sync, real expressions, zero uncanny valley. Post in your voice at scale.", accent: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
        { emoji: "🎙️", title: "Native voiceovers", description: "30+ languages and accents. Localize the same creative for every market without re-shooting or hiring voice talent.", accent: "from-blue-500 to-indigo-500", bg: "bg-blue-50" },
        { emoji: "🎞️", title: "Full post-production", description: "Clips, motion graphics, kinetic captions, music, and pacing. Every deliverable is upload-ready for YouTube and Shorts.", accent: "from-purple-500 to-fuchsia-500", bg: "bg-purple-50" },
        { emoji: "📊", title: "Performance loop", description: "We review the ad data weekly, cut losers, and scale the winners. Your creative stays fresh without ad fatigue killing ROAS.", accent: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
        { emoji: "🧱", title: "Creative library", description: "Every asset organized and reusable. Winning hooks, backgrounds, clip packs you can remix across campaigns forever.", accent: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
      ]}
      processHeader="From kickoff to live in under 2 weeks."
      process={[
        { emoji: "📞", title: "Kickoff call", description: "30-minute call. Share your product, audience, offers, and competitive ads. We leave with everything we need.", duration: "Day 1" },
        { emoji: "✍️", title: "Scripts & storyboards", description: "You approve 3 to 5 hook-tested scripts. We storyboard, pick hosts, and lock the creative direction.", duration: "Days 2 to 4" },
        { emoji: "🎬", title: "Production & review", description: "AI hosts render, we edit, subtitle, and QC. You review one round of revisions before approval.", duration: "Days 5 to 9" },
        { emoji: "🚀", title: "Ship & iterate", description: "Ads go live on your accounts. We monitor, refresh hooks weekly, and scale what wins.", duration: "Ongoing" },
      ]}
      pricingHeadline="Full-service YouTube creative, flat monthly."
      pricingPrice="$4,500"
      pricingCadence="/ month"
      pricingIncluded={[
        "Up to 20 ad variants per month",
        "Dedicated creative strategist",
        "Weekly performance reviews",
        "Unlimited script revisions",
        "Multi-language localization",
        "First deliverable in 72 hours",
      ]}
      whoItsFor={[
        "DTC and e-commerce brands spending $20k+/month on YouTube",
        "SaaS teams scaling founder-led content into paid",
        "Agencies that need creative firepower without hiring",
        "Creators looking to clone themselves and post daily",
      ]}
      finalCtaTitle={{ plain: "Your next YouTube winner", italic: "ships this week." }}
      finalCtaSub="Tell us your offer. We'll send back a creative plan and a first draft in 72 hours."
    />
  );
}
