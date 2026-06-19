"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FULL_NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Applications" },
  { href: "/admin/discounts", label: "Partnerships" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/retreats", label: "Retreats" },
  { href: "/admin/affirmations", label: "Affirmations" },
  { href: "/admin/micro-rx", label: "Micro RX" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/categories", label: "Categories" },
];

const EXPERT_NAV = [{ href: "/admin/community", label: "Community", exact: true }];

export function AdminNav({ expertMode = false }: { expertMode?: boolean }) {
  const pathname = usePathname();
  const navItems = expertMode ? EXPERT_NAV : FULL_NAV;

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
