"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";

function ApiStatusBadge() {
  const { apiUrl, apiStatus, pingApi } = usePortalAuth();

  const config = (() => {
    switch (apiStatus) {
      case "ok":
        return { color: "#1e7a4c", bg: "#e6f4ec", label: "API connected" };
      case "checking":
        return { color: "#5a6c7d", bg: "#eef2f6", label: "Checking API…" };
      case "unreachable":
        return { color: "#b03a2e", bg: "#fdecea", label: "API unreachable" };
      case "not-configured":
        return { color: "#b03a2e", bg: "#fdecea", label: "API not configured" };
      default:
        return { color: "#5a6c7d", bg: "#eef2f6", label: "API status unknown" };
    }
  })();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        background: config.bg,
        color: config.color,
        padding: "0.5rem 0.75rem",
        borderRadius: 8,
        fontSize: "0.8rem",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: config.color,
            display: "inline-block",
          }}
        />
        <span style={{ fontWeight: 600 }}>{config.label}</span>
        {apiUrl && (
          <code style={{ fontSize: "0.75rem", opacity: 0.85 }}>{apiUrl}</code>
        )}
      </div>
      <button
        type="button"
        onClick={pingApi}
        style={{
          background: "transparent",
          border: `1px solid ${config.color}`,
          color: config.color,
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.15rem 0.5rem",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default function PortalLoginPage() {
  const {
    signIn,
    loading,
    user,
    profile,
    profileError,
    apiConfigured,
    apiStatus,
    hasPortalAccess,
    homeRoute,
  } = usePortalAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const denied = searchParams.get("error") === "unauthorized";

  // Redirect once Firebase user + API profile are both present.
  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return;
    if (!hasPortalAccess) {
      router.replace("/portal/unauthorized");
    } else {
      router.replace(homeRoute);
    }
  }, [loading, user, profile, hasPortalAccess, homeRoute, router]);

  // Stop the spinner once profile has either loaded or failed.
  useEffect(() => {
    if (!submitting) return;
    if (profile || profileError) {
      setSubmitting(false);
    }
  }, [submitting, profile, profileError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Profile load + redirect happens in effects above.
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setSubmitting(false);
    }
  }

  // Show the most relevant error: form error first, otherwise profile error.
  const displayError = error ?? (user ? profileError : null);

  // Note: don't disable on `loading` (provider's auth-state-init flag) — that
  // would silently block the very first click. Disable only while submitting
  // or if the API URL isn't configured.
  const formDisabled = submitting || !apiConfigured;

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Sign in</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Rest & Rx partner and team access
        </p>

        <ApiStatusBadge />

        {!apiConfigured && (
          <p className="admin-callout" style={{ marginBottom: "1rem" }}>
            <strong>API not configured.</strong> In <code>rest-rx/website/.env.local</code>, set{" "}
            <code>NEXT_PUBLIC_API_URL</code> (e.g. <code>http://localhost:3000</code>), then
            restart the dev server.
          </p>
        )}

        {apiStatus === "unreachable" && apiConfigured && (
          <p className="admin-callout" style={{ marginBottom: "1rem" }}>
            <strong>Cannot reach the API.</strong> Make sure <code>rest-and-rx/api</code> is
            running on the URL above, and that its <code>CORS_ORIGIN</code> allows{" "}
            <code>http://localhost:9000</code>.
          </p>
        )}

        {denied && (
          <p className="admin-error" style={{ marginBottom: "1rem" }}>
            Your account does not have access to this portal.
          </p>
        )}

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={formDisabled}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={formDisabled}
            />
          </label>
          {displayError && <p className="admin-error">{displayError}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={formDisabled}
            style={{ marginTop: "0.5rem" }}
          >
            {submitting
              ? user
                ? "Loading profile…"
                : "Signing in…"
              : "Continue"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Step 1 verifies your password with Firebase, step 2 fetches your role from the Rest & Rx
          API. Open the browser console for full <code>[Portal]</code> logs.
        </p>

        <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
          <Link href="/" style={{ color: "var(--astral)" }}>
            ← Back to Rest & Rx
          </Link>
        </p>
      </div>
    </div>
  );
}
