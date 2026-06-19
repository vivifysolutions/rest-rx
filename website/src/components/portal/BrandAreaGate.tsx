"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { BrandShell } from "@/components/brand/BrandShell";
import { canAccessBrandRoutes } from "@/lib/user-types";

export function BrandAreaGate({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileError, userType, hasPortalAccess, homeRoute } =
    usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = canAccessBrandRoutes(userType);
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
            {profileError ?? "Still connecting to Rest & Rx…"}
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="admin-login-page">
        <p>Redirecting…</p>
      </div>
    );
  }

  return <BrandShell>{children}</BrandShell>;
}
