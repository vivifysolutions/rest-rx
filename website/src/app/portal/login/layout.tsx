import { Suspense } from "react";

export default function PortalLoginSuspenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="admin-login-page">Loading…</div>}>
      {children}
    </Suspense>
  );
}
