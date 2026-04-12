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
  // Yearly bonus info
  yearlyTotalCredits: number;
  yearlyBaseCredits: number;
  yearlyFreeCredits: number;
  yearlyFreeCreditsValue: string;
  // Video time display
  monthlyVideoTime: string;
  yearlyVideoTime: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    credits: 13,
    monthlyPrice: 30,
    yearlyPrice: 288,
    monthlyPriceId: "price_1TLFlxJzf8eDXLMZ5L5jFgIO",
    yearlyPriceId: "price_1TLFn0Jzf8eDXLMZ2tMm9eT8",
    name: "Starter",
    description: "For creators just getting started",
    actorSlots: 3,
    yearlyTotalCredits: 187,
    yearlyBaseCredits: 156,
    yearlyFreeCredits: 31,
    yearlyFreeCreditsValue: "$75+",
    monthlyVideoTime: "~1.3 min video",
    yearlyVideoTime: "~18.7 min video",
    features: [
      "3 active actors",
      "Credits never expire",
    ],
  },
  {
    credits: 35,
    monthlyPrice: 79,
    yearlyPrice: 756,
    monthlyPriceId: "price_1TLFmHJzf8eDXLMZkoSzptGy",
    yearlyPriceId: "price_1TLFnOJzf8eDXLMZdcIKZjCm",
    popular: true,
    name: "Creator",
    description: "For growing brands ready to scale",
    actorSlots: 10,
    yearlyTotalCredits: 504,
    yearlyBaseCredits: 420,
    yearlyFreeCredits: 84,
    yearlyFreeCreditsValue: "$210+",
    monthlyVideoTime: "~3.5 min video",
    yearlyVideoTime: "~50 min video",
    features: [
      "10 active actors",
      "Credits never expire",
      "Priority support",
    ],
  },
  {
    credits: 70,
    monthlyPrice: 149,
    yearlyPrice: 1428,
    monthlyPriceId: "price_1TLFmWJzf8eDXLMZb5LO6VQP",
    yearlyPriceId: "price_1TLFncJzf8eDXLMZlgW2E0RQ",
    name: "Pro",
    description: "For teams and agencies at scale",
    actorSlots: 30,
    yearlyTotalCredits: 1008,
    yearlyBaseCredits: 840,
    yearlyFreeCredits: 168,
    yearlyFreeCreditsValue: "$420+",
    monthlyVideoTime: "~7 min video",
    yearlyVideoTime: "~1 hr 40 min video",
    features: [
      "30 active actors",
      "Credits never expire",
      "Priority support",
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
