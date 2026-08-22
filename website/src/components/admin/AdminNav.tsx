"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalNavMode } from "@/lib/user-types";

type NavItem = { href: string; label: string; exact?: boolean };

const FULL_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Member applications" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/brand-applications", label: "Partner applications" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/retreats", label: "Retreats" },
  { href: "/admin/affirmations", label: "Affirmations" },
  { href: "/admin/micro-rx", label: "Micro RX" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/categories", label: "Categories" },
];

const EXPERT_NAV: NavItem[] = [{ href: "/admin/community", label: "Community" }];

const FOUNDATION_NAV: NavItem[] = [
  { href: "/admin/resources", label: "Resources", exact: true },
];

export function AdminNav({ navMode = "admin" }: { navMode?: PortalNavMode }) {
  const pathname = usePathname();
  const navItems =
    navMode === "expert" ? EXPERT_NAV : navMode === "foundation" ? FOUNDATION_NAV : FULL_NAV;

  return (
    <nav className="admin-nav" aria-label="Portal navigation">
      {navItems.map(({ href, label, exact }) => {
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
  );
}
