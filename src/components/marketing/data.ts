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

// Re-export the unified credit packages so marketing and app stay in sync.
export { CREDIT_PACKAGES } from "@/constants/creditPackages";
