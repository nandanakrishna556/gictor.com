export interface CreditPackage {
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  popular?: boolean;
  name: string;
  description: string;
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
    credits: 10,
    monthlyPrice: 29,
    yearlyPrice: 348,
    monthlyPriceId: "price_1TQHWZJzf8eDXLMZ5cvMNlDP",
    yearlyPriceId: "price_1TQHWqJzf8eDXLMZvjVO3E4q",
    name: "Starter",
    description: "For creators just getting started",
    
    yearlyTotalCredits: 151,
    yearlyBaseCredits: 120,
    yearlyFreeCredits: 31,
    yearlyFreeCreditsValue: "$93+",
    monthlyVideoTime: "~1 min 6 sec of video",
    yearlyVideoTime: "~16 min 46 sec of video",
    features: [
      "Unlimited actors",
      "Credits never expire",
    ],
  },
  {
    credits: 30,
    monthlyPrice: 79,
    yearlyPrice: 948,
    monthlyPriceId: "price_1TLFmHJzf8eDXLMZkoSzptGy",
    yearlyPriceId: "price_1TLHy3Jzf8eDXLMZfBnpjQ6v",
    popular: true,
    name: "Creator",
    description: "For growing brands ready to scale",
    
    yearlyTotalCredits: 444,
    yearlyBaseCredits: 360,
    yearlyFreeCredits: 84,
    yearlyFreeCreditsValue: "$210+",
    monthlyVideoTime: "~3 min 20 sec of video",
    yearlyVideoTime: "~49 min 20 sec of video",
    features: [
      "Unlimited actors",
      "Credits never expire",
      "Priority support",
    ],
  },
  {
    credits: 70,
    monthlyPrice: 149,
    yearlyPrice: 1788,
    monthlyPriceId: "price_1TLFmWJzf8eDXLMZb5LO6VQP",
    yearlyPriceId: "price_1TLI3CJzf8eDXLMZuXujtzyx",
    name: "Pro",
    description: "For teams and agencies at scale",
    
    yearlyTotalCredits: 1008,
    yearlyBaseCredits: 840,
    yearlyFreeCredits: 168,
    yearlyFreeCreditsValue: "$420+",
    monthlyVideoTime: "~7 min 46 sec of video",
    yearlyVideoTime: "~1 hr 52 min of video",
    features: [
      "Unlimited actors",
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
