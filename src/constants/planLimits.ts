// Plan-to-actor-limit mapping
export const PLAN_ACTOR_LIMITS: Record<string, number> = {
  starter: 3,
  creator: 10,
  pro: 30,
};

export function getActorLimit(plan: string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_ACTOR_LIMITS[plan] ?? 0;
}
