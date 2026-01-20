export interface CreditPackage {
  credits: number;
  price: number;
  priceId: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, price: 30, priceId: "price_1SpA1zJzf8eDXLMZPi8s5Xrs" },
  { credits: 28, price: 79, priceId: "price_1SpA2FJzf8eDXLMZnKFWCMUQ", popular: true },
  { credits: 56, price: 149, priceId: "price_1SpA2SJzf8eDXLMZLnZfvzYF" },
  { credits: 120, price: 299, priceId: "price_1SpA37Jzf8eDXLMZVGBXfegT" },
  { credits: 400, price: 899, priceId: "price_1SpA3RJzf8eDXLMZEChNM5hq" },
  { credits: 1050, price: 1989, priceId: "price_1SpA3lJzf8eDXLMZ87RfaCt5" },
];

// Credit costs for different generation types
export const CREDIT_COSTS = {
  lip_sync_per_second: 0.15,
  speech_per_1000_chars: 0.25,
  script_per_generation: 0.25,
  frame_per_generation: 0.1, // 1K/2K resolution
  frame_4k: 0.15, // 4K resolution
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
