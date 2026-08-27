"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { getCommunityMetrics } from "@/lib/api";
import { subscribeAdminMetricsChanged } from "@/lib/admin-metrics-events";
import type { PortalNavMode } from "@/lib/user-types";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** Key into pending application counts for sidebar badges. */
  pendingKey?: "members" | "partners";
};

const FULL_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Member applications", pendingKey: "members" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/brand-applications", label: "Partner applications", pendingKey: "partners" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/retreats", label: "Retreats" },
  { href: "/admin/affirmations", label: "Affirmations" },
  { href: "/admin/goals", label: "Goals" },
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

function navLabel(
  item: NavItem,
  pending: { members: number; partners: number } | null,
): string {
  if (!item.pendingKey || !pending) return item.label;
  const count = pending[item.pendingKey];
  if (count <= 0) return item.label;
  return `${item.label} (${count})`;
}

export function AdminNav({ navMode = "admin" }: { navMode?: PortalNavMode }) {
  const pathname = usePathname();
  const { refreshToken } = usePortalAuth();
  const [pending, setPending] = useState<{ members: number; partners: number } | null>(null);

  const loadPending = useCallback(async () => {
    if (navMode !== "admin") {
      setPending(null);
      return;
    }
    try {
      const token = await refreshToken();
      if (!token) return;
      const metrics = await getCommunityMetrics(token);
      setPending({
        members: metrics.pending.members,
        partners: metrics.pending.partners,
      });
    } catch {
      // Keep prior counts if refresh fails
    }
  }, [navMode, refreshToken]);

  useEffect(() => {
    void loadPending();
  }, [loadPending, pathname]);

  useEffect(() => {
    return subscribeAdminMetricsChanged(() => {
      void loadPending();
    });
  }, [loadPending]);

  const navItems =
    navMode === "expert" ? EXPERT_NAV : navMode === "foundation" ? FOUNDATION_NAV : FULL_NAV;

  return (
    <nav className="admin-nav" aria-label="Portal navigation">
      {navItems.map((item) => {
        const { href, exact } = item;
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "admin-nav-link active" : "admin-nav-link"}
          >
            {navLabel(item, pending)}
          </Link>
        );
      })}
    </nav>
  );
}
