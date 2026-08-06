export type UserType = "member" | "admin" | "brand_partner" | "expert" | "ambassador" | "foundation";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  member: "Member",
  admin: "Admin",
  brand_partner: "Brand partner",
  expert: "Expert",
  ambassador: "Ambassador",
  foundation: "Non-profit / foundation",
};

/**
 * Approved mobile-app accounts listed under Admin → Members.
 * Ambassadors are community members who share on behalf of Rest & Rx.
 */
export const MEMBER_DIRECTORY_TYPES: UserType[] = ["member", "ambassador"];

/**
 * Approved portal partner accounts listed under Admin → Partners.
 * Ambassadors are not partners — they appear under Members.
 */
export const PARTNER_DIRECTORY_TYPES: UserType[] = [
  "brand_partner",
  "expert",
  "foundation",
];

/** Roles that use the web portal (not the consumer mobile app home). */
export const PORTAL_USER_TYPES: UserType[] = [
  "admin",
  "brand_partner",
  "expert",
  "foundation",
];

type PartnerApplicationStatus = "pending" | "approved" | "rejected";

export function hasPortalAccess(
  userType: UserType | undefined | null,
  partnerApplicationStatus?: PartnerApplicationStatus | null,
): boolean {
  if (!userType || !PORTAL_USER_TYPES.includes(userType)) return false;
  if (userType === "admin") return true;
  return partnerApplicationStatus === "approved";
}

/**
 * True for a rejected brand_partner/expert/foundation applicant — they don't have
 * app access, so a rejection is resolved by resubmitting the /partner form (not the
 * mobile signup flow). Ambassadors go through the mobile app instead, not this portal.
 */
export function canResubmitPartnerApplication(
  userType: UserType | undefined | null,
  partnerApplicationStatus?: PartnerApplicationStatus | null,
): boolean {
  if (!userType) return false;
  return (
    ["brand_partner", "expert", "foundation"] as UserType[]
  ).includes(userType) && partnerApplicationStatus === "rejected";
}

export function getHomeRouteForUserType(userType: UserType): string {
  switch (userType) {
    case "admin":
      return "/admin";
    case "brand_partner":
      return "/brand";
    case "expert":
      return "/admin/community";
    case "foundation":
      return "/admin/resources";
    default:
      return "/portal/unauthorized";
  }
}

export function canAccessAdminRoutes(userType: UserType | undefined | null): boolean {
  return userType === "admin";
}

export function canAccessBrandRoutes(userType: UserType | undefined | null): boolean {
  return userType === "brand_partner";
}

export function canAccessExpertRoutes(userType: UserType | undefined | null): boolean {
  return userType === "expert" || userType === "admin";
}

export function canAccessFoundationRoutes(userType: UserType | undefined | null): boolean {
  return userType === "foundation" || userType === "admin";
}

export type PortalNavMode = "admin" | "expert" | "foundation";

export function getPortalNavMode(userType: UserType | undefined | null): PortalNavMode {
  if (userType === "expert") return "expert";
  if (userType === "foundation") return "foundation";
  return "admin";
}
