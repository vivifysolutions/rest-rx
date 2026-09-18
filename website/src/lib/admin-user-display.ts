import type { ApiUser } from "@/lib/types";

export function displayUserName(u: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
}): string {
  return (
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.displayName || u.email || "—"
  );
}

export function displaySharedByName(
  user:
    | {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      }
    | null
    | undefined,
): string {
  if (!user) return "—";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.displayName?.trim() ||
    "—"
  );
}

export function verificationSummary(u: ApiUser): string {
  const hasIdentity = Boolean(u.identityPhotoUrl);
  const hasCredential = Boolean(u.workCredentialPhotoUrl);
  if (hasIdentity && hasCredential) return "Photos submitted";
  if (hasIdentity || hasCredential) return "Partial";
  return "None";
}

export function onboardingSummary(u: ApiUser): string {
  return u.onboardingCompletedAt ? "Complete" : "Incomplete";
}
