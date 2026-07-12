"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminNav } from "./AdminNav";
import { getPortalNavMode, type PortalNavMode } from "@/lib/user-types";

const NAV_MODE_LABELS: Record<PortalNavMode, string> = {
  admin: "Management",
  expert: "Community",
  foundation: "Resources",
};

const NAV_MODE_HOME: Record<PortalNavMode, string> = {
  admin: "/admin",
  expert: "/admin/community",
  foundation: "/admin/resources",
};

export function AdminShell({
  children,
  navMode,
}: {
  children: React.ReactNode;
  navMode?: PortalNavMode;
}) {
  const { user, signOut, userType } = usePortalAuth();
  const router = useRouter();
  const mode = navMode ?? getPortalNavMode(userType);

  async function handleSignOut() {
    await signOut();
    router.replace("/portal/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href={NAV_MODE_HOME[mode]} className="admin-brand-title">
            Rest & Rx
          </Link>
          <span className="admin-brand-sub">{NAV_MODE_LABELS[mode]}</span>
        </div>
        <AdminNav navMode={mode} />
        <div className="admin-sidebar-footer">
          <p className="admin-user-email">{user?.email}</p>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void handleSignOut()}>
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
