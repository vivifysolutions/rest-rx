/** Matches API OFFER_HIGHLIGHT_MAX_LENGTH — badge / carousel copy limit. */
export const OFFER_HIGHLIGHT_MAX_LENGTH = 28;

/** Matches API OFFER_SUMMARY_MAX_LENGTH — deal line under Offer details. */
export const OFFER_SUMMARY_MAX_LENGTH = 120;

export type DiscountOfferFields = {
  offerHighlight?: string | null;
  offerSummary?: string | null;
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

/** Deal line for Offer details / share — not the long About this offer copy. */
export function getDiscountOfferSummary(discount: DiscountOfferFields): string | null {
  const summary = discount.offerSummary?.trim();
  if (summary) return summary;
  return getDiscountBadgeLabel(discount);
}
