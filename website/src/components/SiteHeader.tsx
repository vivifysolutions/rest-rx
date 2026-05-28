"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/admin", "/portal", "/brand"];

export function SiteHeader() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
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
        </nav>
      </div>
    </header>
  );
}
