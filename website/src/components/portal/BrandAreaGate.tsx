"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { BrandShell } from "@/components/brand/BrandShell";
import { canAccessBrandRoutes } from "@/lib/user-types";

export function BrandAreaGate({ children }: { children: ReactNode }) {
  const { user, loading, userType, hasPortalAccess, homeRoute } = usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = canAccessBrandRoutes(userType);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!hasPortalAccess) {
      router.replace("/portal/unauthorized");
      return;
    }
    if (!allowed) {
      router.replace(homeRoute);
    }
  }, [loading, user, hasPortalAccess, allowed, homeRoute, router, pathname]);

  if (loading || !user || !allowed) {
    return (
      <div className="admin-login-page">
        <p>Loading…</p>
      </div>
    );
  }

  return <BrandShell>{children}</BrandShell>;
}
