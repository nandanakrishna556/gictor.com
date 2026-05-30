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
    description: "For creators just getting started.",
    monthlyPrice: 29,
    yearlyPrice: 348,
    credits: 10,
    yearlyBaseCredits: 120,
    yearlyTotalCredits: 151,
    yearlyFreeCredits: 31,
    yearlyFreeCreditsValue: "$93+",
    monthlyVideoTime: "~1 min 6 sec of video / mo",
    yearlyVideoTime: "~16 min 46 sec of video / yr",
    
    popular: false,
  },
  {
    name: "Creator",
    description: "For growing brands ready to scale.",
    monthlyPrice: 79,
    yearlyPrice: 948,
    credits: 30,
    yearlyBaseCredits: 360,
    yearlyTotalCredits: 444,
    yearlyFreeCredits: 84,
    yearlyFreeCreditsValue: "$210+",
    monthlyVideoTime: "~3 min 20 sec of video / mo",
    yearlyVideoTime: "~49 min 20 sec of video / yr",
    
    popular: true,
  },
  {
    name: "Pro",
    description: "For teams and agencies at scale.",
    monthlyPrice: 149,
    yearlyPrice: 1788,
    credits: 70,
    yearlyBaseCredits: 840,
    yearlyTotalCredits: 1008,
    yearlyFreeCredits: 168,
    yearlyFreeCreditsValue: "$420+",
    monthlyVideoTime: "~7 min 46 sec of video / mo",
    yearlyVideoTime: "~1 hr 52 min of video / yr",
    
    popular: false,
  },
];
