/** Matches API OFFER_HIGHLIGHT_MAX_LENGTH — badge / carousel copy limit. */
export const OFFER_HIGHLIGHT_MAX_LENGTH = 28;

export type DiscountOfferFields = {
  offerHighlight?: string | null;
  percentage?: number | null;
  description?: string | null;
};

export function getDiscountBadgeLabel(discount: DiscountOfferFields): string | null {
  const highlight = discount.offerHighlight?.trim();
  if (highlight) return highlight;
  if (discount.percentage != null && !Number.isNaN(discount.percentage)) {
    return `${discount.percentage}% off`;
  }
  return null;
}

export function getDiscountOfferSummary(discount: DiscountOfferFields): string | null {
  if (discount.description?.trim()) return discount.description.trim();
  return getDiscountBadgeLabel(discount);
}
