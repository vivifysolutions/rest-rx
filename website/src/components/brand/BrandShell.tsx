"use client";

import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";

export function BrandShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = usePortalAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/brand" className="admin-brand-title">
            Rest & Rx
          </Link>
          <span className="admin-brand-sub">Brand dashboard</span>
        </div>
        <nav className="admin-nav" aria-label="Brand navigation">
          <Link href="/brand" className="admin-nav-link active">
            Overview
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <p className="admin-user-email">{user?.email}</p>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => signOut()}>
            Sign out
          </button>
          <Link href="/" className="admin-link-muted">
            ← Back to site
          </Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
