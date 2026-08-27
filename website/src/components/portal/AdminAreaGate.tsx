"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  canAccessAdminRoutes,
  canAccessExpertRoutes,
  canAccessFoundationRoutes,
} from "@/lib/user-types";

const EXPERT_ALLOWED_PREFIX = "/admin/community";
const FOUNDATION_ALLOWED_PREFIX = "/admin/resources";

export function AdminAreaGate({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileError, deactivatedMessage, userType, hasPortalAccess, homeRoute } =
    usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isCommunityRoute = pathname.startsWith(EXPERT_ALLOWED_PREFIX);
  const isResourcesRoute = pathname.startsWith(FOUNDATION_ALLOWED_PREFIX);
  const allowed =
    canAccessAdminRoutes(userType) ||
    (isCommunityRoute && canAccessExpertRoutes(userType)) ||
    (isResourcesRoute && canAccessFoundationRoutes(userType));

  const profileMissing = !loading && !!user && !profile;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (profileMissing && profileError) {
      router.replace("/portal/login?error=profile");
      return;
    }
    if (!profile) return;
    if (!hasPortalAccess) {
      router.replace("/portal/unauthorized");
      return;
    }
    if (!allowed) {
      router.replace(homeRoute);
    }
  }, [
    loading,
    user,
    profile,
    profileMissing,
    profileError,
    hasPortalAccess,
    allowed,
    homeRoute,
    router,
    pathname,
  ]);

  if (loading || !user) {
    return (
      <div className="admin-login-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (profileMissing) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <h1 className="font-subheading">Couldn&apos;t load your account</h1>
          <p className="admin-error" style={{ marginTop: "0.75rem" }}>
            {deactivatedMessage ?? profileError ?? "Still connecting to Rest & Rx…"}
          </p>
        </div>
      </div>
    );
  }

  if (!hasPortalAccess || !allowed) {
    return (
      <div className="admin-login-page">
        <p>Redirecting…</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
