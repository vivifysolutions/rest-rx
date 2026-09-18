"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { deleteMe } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { SUPPORT_EMAIL } from "@/lib/legal-copy";

type Step = "loading" | "sign-in" | "confirm" | "done";

const fieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "0.75rem 0.9rem",
  borderRadius: 10,
  border: "1px solid rgba(15, 53, 94, 0.18)",
  background: "white",
  color: "var(--downriver)",
  fontSize: "1rem",
};

export function DeleteAccountClient() {
  const [step, setStep] = useState<Step>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setStep(next ? "confirm" : "sign-in");
    });
    return () => unsub();
  }, []);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setError("Confirm that you want to permanently delete this account.");
      return;
    }
    const current = auth.currentUser;
    if (!current) {
      setStep("sign-in");
      setError("Sign in again to delete your account.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await current.getIdToken();
      await deleteMe(token);
      await signOut(auth);
      setUser(null);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--brand-cream)" }}>
      <article style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--astral)",
            marginBottom: "1.5rem",
          }}
        >
          ← Back to home
        </Link>
        <h1 className="font-subheading" style={{ fontSize: "2rem", color: "var(--downriver)", margin: "0 0 0.75rem" }}>
          Delete account
        </h1>
        {step === "done" ? (
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Your Rest & Rx account has been deleted. You can close this page.
          </p>
        ) : (
          <>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              This is the same deletion as Profile → Delete Account in the app. It permanently
              removes your account and associated personal data from our primary systems. This
              cannot be undone.
            </p>
            {step === "loading" ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : null}
            {step === "sign-in" ? (
              <form onSubmit={handleSignIn}>
                <label style={labelStyle}>
                  Email
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={fieldStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Password
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={fieldStyle}
                  />
                </label>
                {error ? <ErrorText>{error}</ErrorText> : null}
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? "Signing in…" : "Sign in to continue"}
                </button>
              </form>
            ) : null}
            {step === "confirm" ? (
              <form onSubmit={handleDelete}>
                <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Signed in as <strong style={{ color: "var(--downriver)" }}>{user?.email ?? "your account"}</strong>
                </p>
                <label style={{ display: "flex", gap: 10, marginBottom: "1.1rem", color: "var(--text-primary)", lineHeight: 1.45 }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  I understand this permanently deletes my account and cannot be undone.
                </label>
                {error ? <ErrorText>{error}</ErrorText> : null}
                <button
                  type="submit"
                  disabled={submitting || !confirmed}
                  style={{
                    ...primaryButtonStyle,
                    background: "#9b2c2c",
                    opacity: submitting || !confirmed ? 0.5 : 1,
                  }}
                >
                  {submitting ? "Deleting…" : "Delete my account"}
                </button>
              </form>
            ) : null}
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.55, marginTop: "1.75rem" }}>
              Cannot sign in? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my Rest & Rx account")}`} style={{ color: "var(--astral)" }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </>
        )}
      </article>
    </main>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p style={{ fontSize: "0.9rem", color: "#9b2c2c", margin: "0 0 0.85rem" }}>{children}</p>;
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "0.9rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--downriver)",
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "0.85rem 1.1rem",
  borderRadius: 50,
  border: "none",
  background: "var(--downriver)",
  color: "white",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
};
