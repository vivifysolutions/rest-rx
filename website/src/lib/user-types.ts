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
 * Approved accounts listed under Admin → Members.
 * Ambassadors appear here alongside healthcare members.
 */
export const MEMBER_DIRECTORY_TYPES: UserType[] = ["member", "ambassador"];

/**
 * Approved expert accounts listed under Admin → Experts.
 */
export const EXPERT_DIRECTORY_TYPES: UserType[] = ["expert"];

/**
 * Approved portal partner accounts listed under Admin → Partners.
 * Experts are listed under Experts; ambassadors are listed under Members.
 */
export const PARTNER_DIRECTORY_TYPES: UserType[] = ["brand_partner", "foundation"];

export function getApprovedDirectory(userType: UserType): { href: string; label: string } {
  if (EXPERT_DIRECTORY_TYPES.includes(userType)) {
    return { href: "/admin/experts", label: "Experts" };
  }
  if (PARTNER_DIRECTORY_TYPES.includes(userType)) {
    return { href: "/admin/partners", label: "Partners" };
  }
  return { href: "/admin/members", label: "Members" };
}

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
 * True for a rejected partner applicant (brand, expert, ambassador, foundation).
 * They fix and resubmit on the website /resubmit form rather than the mobile signup flow.
 */
export function canResubmitPartnerApplication(
  userType: UserType | undefined | null,
  partnerApplicationStatus?: PartnerApplicationStatus | null,
): boolean {
  if (!userType) return false;
  return (
    ["brand_partner", "expert", "ambassador", "foundation"] as UserType[]
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
