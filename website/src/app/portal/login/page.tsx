"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { canResubmitPartnerApplication } from "@/lib/user-types";

function ConnectionStatus() {
  const { apiStatus, pingApi } = usePortalAuth();

  if (apiStatus === "ok") return null;

  const isChecking = apiStatus === "checking";
  const isUnreachable = apiStatus === "unreachable" || apiStatus === "not-configured";

  return (
    <div
      className={`portal-login-alert ${
        isChecking ? "portal-login-alert-muted" : "portal-login-alert-error"
      }`}
      role="status"
    >
      <p>
        {isChecking
          ? "Connecting to Rest & Rx…"
          : "We couldn't reach the server. Make sure the API is running, then try again."}
      </p>
      {!isChecking && (
        <button type="button" className="portal-login-alert-btn" onClick={pingApi}>
          Try again
        </button>
      )}
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
    deactivatedMessage,
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
  const profileLoadFailed = searchParams.get("error") === "profile";

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return;
    if (!hasPortalAccess) {
      if (canResubmitPartnerApplication(profile.userType, profile.partnerApplicationStatus)) {
        router.replace("/resubmit");
      } else {
        router.replace("/portal/unauthorized");
      }
    } else {
      router.replace(homeRoute);
    }
  }, [loading, user, profile, hasPortalAccess, homeRoute, router]);

  useEffect(() => {
    if (!submitting) return;
    if (profile || profileError || deactivatedMessage) {
      setSubmitting(false);
    }
  }, [submitting, profile, profileError, deactivatedMessage]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setSubmitting(false);
    }
  }

  const displayError = deactivatedMessage ?? error ?? (user ? profileError : null);
  const formDisabled =
    submitting || !apiConfigured || apiStatus === "unreachable" || apiStatus === "not-configured";

  return (
    <div className="portal-login">
      <div className="portal-login-backdrop" aria-hidden />

      <section className="portal-login-brand" aria-label="Rest & Rx">
        <Link href="/" className="portal-login-logo-link">
          <Image
            src="/logo.png"
            alt="Rest & Rx"
            width={180}
            height={90}
            className="portal-login-logo"
            priority
          />
        </Link>
        <p className="portal-login-eyebrow">Management portal</p>
        <h1 className="portal-login-headline font-subheading">
          Wellness tools for the team behind the care
        </h1>
        <p className="portal-login-lead">
          Sign in to manage content, review applications, and access your partner workspace.
        </p>
        <ul className="portal-login-features">
          <li>Approve healthcare professional applications</li>
          <li>Publish partner offers, events, and resources</li>
          <li>Review flagged community content</li>
        </ul>
      </section>

      <section className="portal-login-panel">
        <div className="portal-login-card">
          <div className="portal-login-card-header">
            <h2 className="font-subheading">Welcome back</h2>
            <p>Sign in with your team credentials</p>
          </div>

          <ConnectionStatus />

          {profileLoadFailed && profileError && (
            <div className="portal-login-alert portal-login-alert-error" role="alert">
              <p>{profileError}</p>
            </div>
          )}

          {denied && (
            <div className="portal-login-alert portal-login-alert-error" role="alert">
              <p>Your account doesn&apos;t have access to this portal. Contact an administrator.</p>
            </div>
          )}

          <form className="portal-login-form" onSubmit={handleSubmit}>
            <label className="portal-login-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                disabled={formDisabled}
              />
            </label>
            <label className="portal-login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={formDisabled}
              />
            </label>

            {displayError && (
              <p className="portal-login-form-error" role="alert">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              className="portal-login-submit"
              disabled={formDisabled}
            >
              {submitting
                ? user
                  ? "Loading your workspace…"
                  : "Signing in…"
                : "Sign in"}
            </button>
          </form>

          <p className="portal-login-footer">
            <Link href="/">← Back to Rest & Rx</Link>
            <br />
            <Link href="/partner">Apply to partner</Link>
          </p>
        </div>

        <p className="portal-login-legal">
          For admins, brand partners, and expert contributors only.
        </p>
      </section>
    </div>
  );
}
