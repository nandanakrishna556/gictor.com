export interface CreditPackage {
  name: string;
  description: string;
  monthlyPrice: number;
  monthlyPriceId: string;
  productId: string;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  monthlyVideoTime: string;
  features: string[];
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    name: "Trial",
    description: "Test drive Gictor for a week.",
    monthlyPrice: 6,
    monthlyPriceId: "price_1TdOh3Jzf8eDXLMZ8inf1qYZ",
    productId: "prod_Ucdzjww2wSiE1Y",
    baseCredits: 1.7,
    bonusCredits: 0,
    totalCredits: 1.7,
    monthlyVideoTime: "~11 sec of video",
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
    ],
  },
  {
    name: "Starter",
    description: "For creators just getting started.",
    monthlyPrice: 29,
    monthlyPriceId: "price_1TdOhNJzf8eDXLMZlGdHKNU6",
    productId: "prod_UcdzyGbUFQxYYH",
    baseCredits: 9,
    bonusCredits: 0,
    totalCredits: 9,
    monthlyVideoTime: "~1 min of video",
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
      "Email support",
    ],
  },
  {
    name: "Creator",
    description: "For growing brands ready to scale.",
    monthlyPrice: 79,
    monthlyPriceId: "price_1TdOhfJzf8eDXLMZScwouVCX",
    productId: "prod_UcdzZxCSby0rTU",
    baseCredits: 27,
    bonusCredits: 0,
    totalCredits: 27,
    monthlyVideoTime: "~3 min of video",
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
      "All Starter features",
    ],
  },
  {
    name: "Pro",
    description: "For pros producing more video weekly.",
    monthlyPrice: 149,
    monthlyPriceId: "price_1TdOi4Jzf8eDXLMZ0teAHouz",
    productId: "prod_Uce0fI11YcWVSG",
    baseCredits: 51,
    bonusCredits: 10,
    totalCredits: 61,
    monthlyVideoTime: "~6 min 47 sec of video",
    popular: true,
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
      "Priority support",
      "All Creator features",
    ],
  },
  {
    name: "Studio",
    description: "For studios shipping content at scale.",
    monthlyPrice: 299,
    monthlyPriceId: "price_1TdOiIJzf8eDXLMZhZSHMl1P",
    productId: "prod_Uce0fhFJM8wHwd",
    baseCredits: 105,
    bonusCredits: 25,
    totalCredits: 130,
    monthlyVideoTime: "~14 min 27 sec of video",
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
      "Priority support",
      "All Pro features",
    ],
  },
  {
    name: "Agency",
    description: "For agencies running multiple brands.",
    monthlyPrice: 499,
    monthlyPriceId: "price_1TdOiwJzf8eDXLMZwokNhBZj",
    productId: "prod_Uce0ao4H63hmqT",
    baseCredits: 180,
    bonusCredits: 50,
    totalCredits: 230,
    monthlyVideoTime: "~25 min 33 sec of video",
    features: [
      "Unlimited actors",
      "Credits roll over and never expire",
      "Priority support",
      "All Studio features",
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
