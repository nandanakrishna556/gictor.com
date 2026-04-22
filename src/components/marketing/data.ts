export type ServiceItem = {
  label: string;
  href: string;
  emoji: string;
  tag: string;
  description: string;
  bg: string;
  accent: string;
};

export const SERVICES: ServiceItem[] = [
  {
    label: "YouTube Videos",
    href: "/services/youtube-videos",
    emoji: "📺",
    tag: "Long-form",
    description: "Long-form AI hosted videos, fully produced",
    bg: "bg-red-50",
    accent: "from-red-500 to-rose-600",
  },
  {
    label: "Media Buying",
    href: "/services/media-buying",
    emoji: "🎯",
    tag: "Paid ads",
    description: "Performance ad buying on Meta, TikTok, Google",
    bg: "bg-blue-50",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    label: "Short-form Content",
    href: "/services/short-form-content",
    emoji: "⚡",
    tag: "Viral",
    description: "Reels, Shorts, and TikToks at creator volume",
    bg: "bg-orange-50",
    accent: "from-orange-500 to-amber-500",
  },
];

export const CREDIT_PACKAGES = [
  {
    name: "Starter",
    description: "Perfect for testing the waters.",
    monthlyPrice: 29,
    yearlyPrice: 264,
    credits: 10,
    yearlyTotalCredits: 1500,
    yearlyFreeCredits: 300,
    yearlyFreeCreditsValue: "$87",
    monthlyVideoTime: "~30 min video / mo",
    yearlyVideoTime: "~7 hrs video / yr",
    actorSlots: 2,
    popular: false,
  },
  {
    name: "Creator",
    description: "For serious creators & small teams.",
    monthlyPrice: 79,
    yearlyPrice: 708,
    credits: 30,
    yearlyTotalCredits: 5200,
    yearlyFreeCredits: 1000,
    yearlyFreeCreditsValue: "$228",
    monthlyVideoTime: "~2 hrs video / mo",
    yearlyVideoTime: "~26 hrs video / yr",
    actorSlots: 5,
    popular: true,
  },
  {
    name: "Scale",
    description: "For agencies & performance teams.",
    monthlyPrice: 149,
    yearlyPrice: 1788,
    credits: 1000,
    yearlyTotalCredits: 15000,
    yearlyFreeCredits: 3000,
    yearlyFreeCreditsValue: "$597",
    monthlyVideoTime: "~6 hrs video / mo",
    yearlyVideoTime: "~75 hrs video / yr",
    actorSlots: 15,
    popular: false,
  },
];
