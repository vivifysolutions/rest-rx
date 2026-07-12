"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";

/** Post-login hub: sends users to the route for their userType. */
export default function PortalHomePage() {
  const { loading, user, hasPortalAccess, homeRoute } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/portal/login");
      return;
    }
    if (!hasPortalAccess) {
      router.replace("/portal/unauthorized");
      return;
    }
    router.replace(homeRoute);
  }, [loading, user, hasPortalAccess, homeRoute, router]);

  return (
    <div className="admin-login-page">
      <p>Loading your workspace…</p>
    </div>
  );
}
