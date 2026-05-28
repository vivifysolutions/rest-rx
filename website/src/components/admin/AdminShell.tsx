"use client";

import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminNav } from "./AdminNav";

export function AdminShell({
  children,
  expertMode = false,
}: {
  children: React.ReactNode;
  expertMode?: boolean;
}) {
  const { user, signOut } = usePortalAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href={expertMode ? "/admin/community" : "/admin"} className="admin-brand-title">
            Rest & Rx
          </Link>
          <span className="admin-brand-sub">{expertMode ? "Community" : "Management"}</span>
        </div>
        <AdminNav expertMode={expertMode} />
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
