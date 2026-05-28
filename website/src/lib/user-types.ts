export type UserType = "member" | "admin" | "brand_partner" | "expert";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  member: "Member",
  admin: "Admin",
  brand_partner: "Brand partner",
  expert: "Expert",
};

/** Roles that use the web portal (not the consumer mobile app home). */
export const PORTAL_USER_TYPES: UserType[] = [
  "admin",
  "brand_partner",
  "expert",
];

export function hasPortalAccess(userType: UserType | undefined | null): boolean {
  return !!userType && PORTAL_USER_TYPES.includes(userType);
}

export function getHomeRouteForUserType(userType: UserType): string {
  switch (userType) {
    case "admin":
      return "/admin";
    case "brand_partner":
      return "/brand";
    case "expert":
      return "/admin/community";
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
