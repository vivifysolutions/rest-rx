import {
  APP_DISCOUNT_TIER_DETAILS,
  APP_PARTNERSHIP_PRICING_NOTE,
  PARTNERSHIP_PATHWAYS,
  PARTNER_DISCOVERY_CALL_URL,
  EXPERT_CONTENT_RESOURCE_OPTIONS,
} from "@/lib/partner-application-content";

export type PartnerApplicationType = "brand_partner" | "expert" | "ambassador" | "foundation";

export type PartnerGeographicScope = "local" | "regional" | "national" | "international";

export type PartnerOfferingType = "service" | "physical_product" | "both";

/** @deprecated Use OFFERING_OPTIONS — kept for legacy application display */
export type LegacyOfferingType = PartnerOfferingType;

export {
  APP_DISCOUNT_TIER_DETAILS,
  APP_PARTNERSHIP_PRICING_NOTE,
  PARTNERSHIP_PATHWAYS,
  PARTNER_DISCOVERY_CALL_URL,
  EXPERT_CONTENT_RESOURCE_OPTIONS,
};

export const APP_DISCOUNT_TIER_VALUES = ["complimentary", "preferred", "featured"] as const;

export const PRODUCT_PARTNERSHIP_VALUES = ["irl_events", "retreats", "wellness_boxes"] as const;

export const CUSTOM_PARTNERSHIP_VALUE = "custom";

/** @deprecated Legacy values kept for existing applications */
export const LEGACY_PARTNERSHIP_VALUES = ["sponsored_content", "gifting"] as const;

export const APP_DISCOUNT_TIER_OPTIONS = APP_DISCOUNT_TIER_DETAILS.map((tier) => ({
  value: tier.value,
  label: tier.label,
  description: tier.summary,
}));

export const PRODUCT_PARTNERSHIP_OPTIONS = [
  {
    value: "irl_events",
    label: "IRL Events",
    description: "Provide products for in-person events",
  },
  {
    value: "retreats",
    label: "Retreats",
    description: "Gift or sponsor products for retreats",
  },
  {
    value: "wellness_boxes",
    label: "Wellness Boxes",
    description: "Include products in wellness boxes",
  },
] as const;

export const CUSTOM_PARTNERSHIP_OPTION = {
  value: CUSTOM_PARTNERSHIP_VALUE,
  label: "Custom Partnership",
  description: "Tell us about a partnership idea not listed above",
} as const;

/** All selectable values (current + legacy for label lookup) */
export const PARTNERSHIP_INTEREST_OPTIONS = [
  ...APP_DISCOUNT_TIER_OPTIONS,
  ...PRODUCT_PARTNERSHIP_OPTIONS,
  CUSTOM_PARTNERSHIP_OPTION,
  { value: "sponsored_content", label: "Sponsored Content", description: "" },
  { value: "gifting", label: "Gifting", description: "" },
] as const;

export const GEOGRAPHIC_SCOPE_OPTIONS: {
  value: PartnerGeographicScope;
  label: string;
}[] = [
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

export const OFFERING_OPTIONS = [
  {
    value: "in_person",
    label: "In-person services/experiences",
  },
  {
    value: "virtual",
    label: "Virtual/Online offerings",
  },
  {
    value: "physical_product",
    label: "Physical products",
  },
] as const;

export const OFFERING_TYPE_VALUES = OFFERING_OPTIONS.map((o) => o.value);

/** @deprecated Legacy combined delivery + offering values */
export const DELIVERY_TYPE_OPTIONS = OFFERING_OPTIONS;

/** @deprecated Use OFFERING_OPTIONS */
export const OFFERING_TYPE_OPTIONS: {
  value: PartnerOfferingType;
  label: string;
}[] = [
  { value: "service", label: "Service" },
  { value: "physical_product", label: "Physical product" },
  { value: "both", label: "Both" },
];

export function getAppDiscountTier(interests: string[]): string {
  return interests.find((v) =>
    (APP_DISCOUNT_TIER_VALUES as readonly string[]).includes(v),
  ) ?? "";
}

export function getProductPartnerships(interests: string[]): string[] {
  return interests.filter((v) =>
    (PRODUCT_PARTNERSHIP_VALUES as readonly string[]).includes(v),
  );
}

export function hasCustomPartnership(interests: string[]): boolean {
  return interests.includes(CUSTOM_PARTNERSHIP_VALUE);
}

export function getOtherPartnershipInterests(interests: string[]): string[] {
  const known = new Set<string>([
    ...APP_DISCOUNT_TIER_VALUES,
    ...PRODUCT_PARTNERSHIP_VALUES,
    CUSTOM_PARTNERSHIP_VALUE,
  ]);
  return interests.filter((v) => !known.has(v));
}

export function buildPartnershipInterests(
  appTier: string,
  productPartnerships: string[],
  customPartnership: boolean,
): string[] {
  const result: string[] = [];
  if (appTier) result.push(appTier);
  result.push(...productPartnerships);
  if (customPartnership) result.push(CUSTOM_PARTNERSHIP_VALUE);
  return result;
}

export function labelPartnershipInterest(value: string): string {
  return PARTNERSHIP_INTEREST_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function labelOfferingOption(value: string): string {
  return OFFERING_OPTIONS.find((o) => o.value === value)?.label ?? labelLegacyOfferingValue(value);
}

function labelLegacyOfferingValue(value: string): string {
  if (value === "both") return "In-person and virtual";
  if (value === "service") return "Service";
  if (value === "content_resources") return "Content or Resources";
  return value;
}

/** @deprecated Use labelOfferingOption */
export function labelDeliveryType(value: string): string {
  return labelOfferingOption(value);
}

/** @deprecated Use labelOfferingOption */
export function labelOfferingType(value: string): string {
  if (value === "both") return "Service and physical product";
  return labelOfferingOption(value);
}

export function labelGeographicScope(value: string): string {
  return GEOGRAPHIC_SCOPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getDisplayOfferings(
  deliveryTypes: string[] | null | undefined,
  offeringType: string | null | undefined,
): string[] {
  const items = new Set<string>();

  for (const value of deliveryTypes ?? []) {
    if (value === "both") {
      items.add("in_person");
      items.add("virtual");
    } else {
      items.add(value);
    }
  }

  if (offeringType === "both") {
    items.add("service");
    items.add("physical_product");
  } else if (offeringType) {
    items.add(offeringType);
  }

  return Array.from(items);
}

export function labelApplicationType(value: PartnerApplicationType): string {
  switch (value) {
    case "expert":
      return "Expert contributor";
    case "ambassador":
      return "Ambassador";
    case "foundation":
      return "Non-profit / foundation";
    default:
      return "Brand partner";
  }
}

/** Short label for badges/filters in admin tables. */
export function labelApplicationTypeShort(value: PartnerApplicationType): string {
  switch (value) {
    case "expert":
      return "Expert";
    case "ambassador":
      return "Ambassador";
    case "foundation":
      return "Foundation";
    default:
      return "Brand partner";
  }
}

export const PARTNER_APPLICATION_TYPE_FILTERS: PartnerApplicationType[] = [
  "brand_partner",
  "expert",
  "ambassador",
  "foundation",
];

