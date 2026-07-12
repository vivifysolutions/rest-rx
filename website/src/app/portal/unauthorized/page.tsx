"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { USER_TYPE_LABELS } from "@/lib/user-types";

export default function PortalUnauthorizedPage() {
  const { user, loading, profile, signOut } = usePortalAuth();
  const router = useRouter();
  const pendingApproval = profile?.partnerApplicationStatus === "pending";
  const rejected = profile?.partnerApplicationStatus === "rejected";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/portal/login");
    }
  }, [loading, user, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/portal/login");
  }

  if (loading || !user) {
    return (
      <div className="admin-login-page">
        <p>Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>
          {pendingApproval
            ? "Application under review"
            : rejected
              ? "Application not approved"
              : "You don't have access"}
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
          {pendingApproval ? (
            <>
              You are signed in
              {profile?.email ? ` as ${profile.email}` : ""} as{" "}
              <strong>
                {profile?.userType ? USER_TYPE_LABELS[profile.userType] : "a partner applicant"}
              </strong>
              . Portal access opens after your application is approved.
            </>
          ) : rejected ? (
            <>
              Your partner application was not approved
              {profile?.email ? ` for ${profile.email}` : ""}. If you think this is a mistake,
              contact the Rest &amp; Rx team.
            </>
          ) : (
            <>
              You are signed in
              {profile?.email ? ` as ${profile.email}` : ""}, but your account type is{" "}
              <strong>
                {profile?.userType ? USER_TYPE_LABELS[profile.userType] : "unknown"}
              </strong>
              . This portal is for team, brand, expert, and non-profit partner accounts. Healthcare
              members and ambassadors use the mobile app.
            </>
          )}
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => void handleSignOut()}
        >
          Sign out
        </button>
        <p style={{ marginTop: "1.5rem", fontSize: "0.85rem" }}>
          <Link href="/" style={{ color: "var(--astral)" }}>
            ← Back to Rest & Rx
          </Link>
        </p>
      </div>
    </div>
  );
}
