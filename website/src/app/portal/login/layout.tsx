import { Suspense } from "react";

export default function PortalLoginSuspenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="portal-login portal-login-loading">Loading…</div>}>
      {children}
    </Suspense>
  );
}
