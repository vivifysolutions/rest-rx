"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";

const NAV = [
  { href: "/brand", label: "Overview", exact: true },
  { href: "/brand/discounts", label: "Discounts" },
];

export function BrandShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = usePortalAuth();
  const pathname = usePathname();

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
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "admin-nav-link active" : "admin-nav-link"}
              >
                {label}
              </Link>
            );
          })}
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
