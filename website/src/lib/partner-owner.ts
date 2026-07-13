import type { BrandPartnerApplication } from "@/lib/brand-partner-application";
import type { PartnerOwnerOption } from "@/components/discounts/BrandPartnerPicker";

const OWNER_APPLICATION_TYPES = new Set([
  "brand_partner",
  "expert",
  "foundation",
]);

/** Approved brand / expert / foundation apps for admin content ownership pickers. */
export function toPartnerOwnerOptions(
  apps: BrandPartnerApplication[],
): PartnerOwnerOption[] {
  return apps
    .filter((a) => OWNER_APPLICATION_TYPES.has(a.applicationType))
    .map((a) => ({
      id: a.id,
      companyName: a.companyName,
      fullName: a.fullName,
      email: a.email,
      applicationType: a.applicationType,
    }))
    .sort((a, b) =>
      (a.companyName || a.fullName).localeCompare(b.companyName || b.fullName),
    );
}

export function partnerOwnerDisplayName(app: {
  companyName?: string | null;
  fullName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!app) return "—";
  return app.companyName?.trim() || app.fullName?.trim() || app.email || "—";
}
