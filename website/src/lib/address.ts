export type AddressSuggestion = {
  placeId: string | null;
  formatted: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
};

/** Structured address form (Green Door pattern). */
export type LocationValue = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

export const EMPTY_LOCATION: LocationValue = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

const VIRTUAL_LOCATION = /\b(online|virtual|zoom|remote|hybrid)\b/i;
const ONLINE_FORMAT = /\b(online|virtual|remote)\b/i;

export function isVirtualLocation(location: string | null | undefined): boolean {
  if (!location?.trim()) return false;
  return VIRTUAL_LOCATION.test(location);
}

/** Event format values that imply no physical venue (city/state not needed). */
export function isOnlineFormat(format: string | null | undefined): boolean {
  if (!format?.trim()) return false;
  return ONLINE_FORMAT.test(format);
}

export function formatLocationLabel(address: LocationValue): string {
  const street = [address.line1.trim(), address.line2.trim()].filter(Boolean).join(", ");
  const state = address.state.trim().toUpperCase();
  const zip = address.postalCode.trim();
  const tail = state && zip ? `${state} ${zip}` : state || zip || "";
  return [street, address.city.trim(), tail].filter(Boolean).join(", ");
}

export function suggestionToForm(suggestion: AddressSuggestion): LocationValue {
  return {
    line1: suggestion.line1 || "",
    line2: suggestion.line2 ?? "",
    city: suggestion.city || "",
    state: suggestion.state ?? "",
    postalCode: suggestion.postalCode ?? "",
  };
}

/** Best-effort parse of stored "Street, City, ST ZIP" back into form fields. */
export function parseLocationString(location: string | null | undefined): LocationValue {
  if (!location?.trim()) return { ...EMPTY_LOCATION };
  let trimmed = location.trim();

  if (isVirtualLocation(trimmed)) {
    return { ...EMPTY_LOCATION, line1: trimmed };
  }

  // Drop trailing country segments that Nominatim sometimes appends.
  trimmed = trimmed
    .replace(/,?\s*(United States|USA|US)\s*$/i, "")
    .trim();

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    const line1 = parts.slice(0, -2).join(", ");
    const match = stateZip.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    const stateOnly = stateZip.match(/^([A-Za-z]{2})$/);
    return {
      line1,
      line2: "",
      city,
      state: (match?.[1] ?? stateOnly?.[1] ?? stateZip).toUpperCase(),
      postalCode: match?.[2] ?? "",
    };
  }

  if (parts.length === 2) {
    const stateZip = parts[1];
    const match = stateZip.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    const stateOnly = stateZip.match(/^([A-Za-z]{2})$/);
    return {
      line1: "",
      line2: "",
      city: parts[0],
      state: (match?.[1] ?? stateOnly?.[1] ?? stateZip).toUpperCase(),
      postalCode: match?.[2] ?? "",
    };
  }

  return { ...EMPTY_LOCATION, line1: trimmed };
}

export function locationFromString(location: string | null | undefined): LocationValue {
  return parseLocationString(location);
}

export function locationFromListing(item: {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): LocationValue {
  return parseLocationString(item.location);
}

export function locationToApiPayload(address: LocationValue): {
  location: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
} {
  const label = formatLocationLabel(address);
  if (!label) {
    return { location: "" };
  }

  if (isVirtualLocation(label)) {
    return { location: label };
  }

  return {
    location: label,
    address: {
      line1: address.line1.trim() || undefined,
      line2: address.line2.trim() || undefined,
      city: address.city.trim() || undefined,
      state: address.state.trim() || undefined,
      postalCode: address.postalCode.trim() || undefined,
    },
  };
}
