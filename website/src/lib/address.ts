export type AddressSuggestion = {
  placeId: string | null;
  formatted: string;
  latitude: number;
  longitude: number;
};

export type LocationValue = {
  location: string;
  latitude: number | null;
  longitude: number | null;
};

export const EMPTY_LOCATION: LocationValue = {
  location: "",
  latitude: null,
  longitude: null,
};

export function locationFromString(location: string | null | undefined): LocationValue {
  return {
    location: location ?? "",
    latitude: null,
    longitude: null,
  };
}

export function locationFromListing(item: {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): LocationValue {
  return {
    location: item.location ?? "",
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
  };
}
