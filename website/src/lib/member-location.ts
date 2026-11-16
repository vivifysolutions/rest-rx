/** "Atlanta, Georgia, United States" from whichever parts are set; "" when none are. */
export function formatMemberLocation(
  location: { city?: string | null; state?: string | null; country?: string | null } | null | undefined,
): string {
  return [location?.city, location?.state, location?.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
