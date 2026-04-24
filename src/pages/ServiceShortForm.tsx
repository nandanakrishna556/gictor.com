import ServicePageLayout from "@/components/marketing/ServicePageLayout";

export default function ServiceShortForm() {
  return (
    <ServicePageLayout
      pageTitle="Short-form Content Production — Gictor"
      pageDescription="30 to 60 Reels, Shorts, and TikToks per month. Trend research, hook-tested scripts, AI creators, captions, and scheduling. Daily posting cadence."
      eyebrow="Reels, Shorts, and TikToks"
      eyebrowEmoji="⚡"
      h1Top="Short-form content,"
      h1Highlight="at creator volume."
      sub="We produce the daily posting cadence that actually grows a brand. 30 to 60 Reels, Shorts, and TikToks per month, hook-tested and post-ready."
      heroBullets={["Daily posting cadence", "Trend-aware scripts", "Auto-localized"]}
      statsPills={[
        { emoji: "📆", label: "Daily post cadence" },
        { emoji: "🔥", label: "30 to 60 posts / mo" },
        { emoji: "🌍", label: "Multi-language" },
      ]}
      deliverablesHeader="Everything you need to run a content machine."
      deliverables={[
        { emoji: "🔍", title: "Trend research", description: "We track what's breaking on TikTok and Reels in real time. Your content rides the wave instead of showing up two weeks late.", accent: "from-fuchsia-500 to-pink-500", bg: "bg-fuchsia-50" },
        { emoji: "✍️", title: "Hook-tested scripts", description: "Every post opens with a pattern interrupt. We write 40+ hooks a month and test them against your audience every week.", accent: "from-orange-500 to-amber-500", bg: "bg-orange-50" },
        { emoji: "🎬", title: "AI creator footage", description: "Cloned or library AI creators deliver your script on camera. Natural pacing, authentic delivery, zero filming required.", accent: "from-rose-500 to-red-500", bg: "bg-rose-50" },
        { emoji: "📝", title: "Captions & clips", description: "Kinetic captions, trending sounds, and AI clips that actually match the hook. Post-ready in 9:16 for every platform.", accent: "from-purple-500 to-fuchsia-500", bg: "bg-purple-50" },
        { emoji: "🌍", title: "Multi-platform, multi-language", description: "Same concept, localized for English, Spanish, Portuguese, French, Hindi, and 25 more. Scale one script into 10 markets.", accent: "from-blue-500 to-indigo-500", bg: "bg-blue-50" },
        { emoji: "📈", title: "Content calendar", description: "Everything scheduled, tagged, and ready. You know what posts tomorrow, next week, and next month without chasing your team.", accent: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
      ]}
      processHeader="Posting every day inside of two weeks."
      process={[
        { emoji: "🧭", title: "Brand deep-dive", description: "We map your voice, audience, offers, and past top posts. The content plan flows from a clear brand brief, not guesses.", duration: "Days 1 to 3" },
        { emoji: "🎭", title: "Creator selection", description: "Pick AI creators that match your brand persona, or clone your founder. One face or a cast, your call.", duration: "Days 4 to 5" },
        { emoji: "🎥", title: "First content batch", description: "10 posts scripted, produced, and approved before going live. You'll see the style locked in week two.", duration: "Days 6 to 10" },
        { emoji: "🔁", title: "Post & iterate", description: "Daily posting with weekly hook tests. We double down on the content that gets saves, shares, and comments.", duration: "Ongoing" },
      ]}
      pricingHeadline="Short-form content, flat monthly."
      pricingPrice="$3,500"
      pricingCadence="/ month"
      pricingIncluded={[
        "30 to 60 short-form posts monthly",
        "Trend research + hook writing",
        "Custom or cloned AI creators",
        "Captions, music, and clips included",
        "Content calendar + scheduling",
        "Weekly performance review",
      ]}
      whoItsFor={[
        "DTC brands that know organic compounds over time",
        "Creators who want to post daily without filming",
        "Founders building a personal brand in public",
        "Agencies adding organic to their paid offering",
      ]}
      finalCtaTitle={{ plain: "Post every day.", italic: "Grow every week." }}
      finalCtaSub="Send us your brand brief. We'll send back a 30-day content plan and 5 sample hooks in 48 hours."
    />
  );
}
