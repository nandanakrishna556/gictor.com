export interface CreditPackage {
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  popular?: boolean;
  name: string;
  description: string;
  actorSlots: number;
  features: string[];
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    credits: 10,
    monthlyPrice: 30,
    yearlyPrice: 288,
    monthlyPriceId: "price_1TLFlxJzf8eDXLMZ5L5jFgIO",
    yearlyPriceId: "price_1TLFn0Jzf8eDXLMZ2tMm9eT8",
    name: "Starter",
    description: "For creators just getting started",
    actorSlots: 3,
    features: [
      "10 credits per month",
      "3 active actor slots",
      "HD 1080p quality",
      "Credits never expire",
    ],
  },
  {
    credits: 28,
    monthlyPrice: 79,
    yearlyPrice: 756,
    monthlyPriceId: "price_1TLFmHJzf8eDXLMZkoSzptGy",
    yearlyPriceId: "price_1TLFnOJzf8eDXLMZdcIKZjCm",
    popular: true,
    name: "Creator",
    description: "For growing brands ready to scale",
    actorSlots: 10,
    features: [
      "28 credits per month",
      "10 active actor slots",
      "Custom AI actors",
      "Faster generation queue",
      "Credits never expire",
    ],
  },
  {
    credits: 56,
    monthlyPrice: 149,
    yearlyPrice: 1428,
    monthlyPriceId: "price_1TLFmWJzf8eDXLMZb5LO6VQP",
    yearlyPriceId: "price_1TLFncJzf8eDXLMZlgW2E0RQ",
    name: "Pro",
    description: "For teams and agencies at scale",
    actorSlots: 30,
    features: [
      "56 credits per month",
      "30 active actor slots",
      "Priority generation queue",
      "Longer videos for deeper content",
      "Credits never expire",
    ],
  },
];

// Credit costs for different generation types
export const CREDIT_COSTS = {
  lip_sync_per_second: 0.15,
  speech_per_1000_chars: 0.25,
  script_per_generation: 0.25,
  frame_per_generation: 0.1,
  frame_4k: 0.15,
  animate_per_second: 0.15,
};

// Helper to calculate estimated video minutes from credits
export function calculateVideoMinutes(credits: number): number {
  const totalSeconds = credits / CREDIT_COSTS.animate_per_second;
  return Math.floor(totalSeconds / 60);
}

// Helper to calculate lip sync cost
export function calculateLipSyncCost(durationSeconds: number): number {
  return Math.ceil(durationSeconds * CREDIT_COSTS.lip_sync_per_second * 100) / 100;
}

// Helper to calculate speech cost
export function calculateSpeechCost(characterCount: number): number {
  return Math.ceil((characterCount / 1000) * CREDIT_COSTS.speech_per_1000_chars * 100) / 100;
}

// Helper to calculate animate cost
export function calculateAnimateCost(durationSeconds: number): number {
  return Math.ceil(durationSeconds * CREDIT_COSTS.animate_per_second * 100) / 100;
}
