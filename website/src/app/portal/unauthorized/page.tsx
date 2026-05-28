"use client";

import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { USER_TYPE_LABELS } from "@/lib/user-types";

export default function PortalUnauthorizedPage() {
  const { profile, signOut } = usePortalAuth();

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>No portal access</h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
          You are signed in
          {profile?.email ? ` as ${profile.email}` : ""}, but your account type is{" "}
          <strong>
            {profile?.userType ? USER_TYPE_LABELS[profile.userType] : "unknown"}
          </strong>
          . This portal is for team, brand, and expert accounts. Healthcare members use the mobile
          app.
        </p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => signOut()}>
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
