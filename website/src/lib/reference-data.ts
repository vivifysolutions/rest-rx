/** Canonical discount tiers — stored lowercase; matches mobile discover filters and badges. */
export const DISCOUNT_TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
] as const;

export const DISCOUNT_TIER_VALUES = DISCOUNT_TIER_OPTIONS.map((t) => t.value);

export function formatDiscountTierLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const match = DISCOUNT_TIER_OPTIONS.find((t) => t.value === value.toLowerCase());
  return match?.label ?? value;
}
