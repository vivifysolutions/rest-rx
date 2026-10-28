import { reload, type User } from "firebase/auth";
import { ApiError, sendVerificationEmail } from "@/lib/api";

/**
 * Production-only, matching the API's EmailVerifiedGuard (which keys off VERCEL_ENV).
 * NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true|false overrides, e.g. to test the flow locally.
 */
export function isEmailVerificationRequired(): boolean {
  const override = process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION;
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/**
 * The API's EmailVerifiedGuard rejected the request. The API is the source of truth, so
 * the form follows it even when this build's flag says verification is off.
 */
export function isEmailNotVerifiedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    /verify your email/i.test(error.message)
  );
}

/**
 * The API generates the Firebase verification link and emails it through Resend.
 * The link opens Firebase's hosted page, which marks the email verified.
 */
export async function sendApplicantEmailVerification(user: User): Promise<void> {
  await sendVerificationEmail(await user.getIdToken());
}

/**
 * Reloads the user after they click the link. When verified, also force-refreshes the
 * ID token — the cached one still says email_verified: false and the API reads the token.
 */
export async function refreshAndCheckEmailVerified(user: User): Promise<boolean> {
  await reload(user);
  if (user.emailVerified) {
    await user.getIdToken(true);
  }
  return user.emailVerified;
}
