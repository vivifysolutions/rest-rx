"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const HIDDEN_PREFIXES = ["/admin", "/portal", "/brand"];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  async function handleSignOut() {
    await firebaseSignOut(auth);
    router.push("/portal/login");
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(15, 53, 94, 0.08)",
        boxShadow: "0 2px 12px rgba(15, 53, 94, 0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0.75rem 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Image
            src="/logo.png"
            alt="Rest & Rx"
            width={120}
            height={48}
            style={{ width: "auto", height: 40 }}
            priority
          />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/partner"
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--astral)",
            }}
          >
            Partner
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              style={{
                display: "inline-block",
                padding: "0.5rem 1.25rem",
                background: "var(--astral)",
                color: "white",
                borderRadius: "50px",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(52, 131, 165, 0.35)",
              }}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/portal/login"
              style={{
                display: "inline-block",
                padding: "0.5rem 1.25rem",
                background: "var(--astral)",
                color: "white",
                borderRadius: "50px",
                fontWeight: 600,
                fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(52, 131, 165, 0.35)",
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
