/** Exponential pick value curve (same shape as draft `pick_value` helper). */
export function nflPickValue(pick: number): number {
  if (pick <= 0) return 0;
  return Math.max(0, 3000 * Math.exp(-0.075 * (pick - 1)));
}
