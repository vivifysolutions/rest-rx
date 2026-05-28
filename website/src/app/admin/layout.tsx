import type { Metadata } from "next";
import { PortalAuthProvider } from "@/contexts/PortalAuthProvider";
import { AdminAreaGate } from "@/components/portal/AdminAreaGate";
import "./admin.css";

export const metadata: Metadata = {
  title: "Management | Rest & Rx",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalAuthProvider>
      <AdminAreaGate>{children}</AdminAreaGate>
    </PortalAuthProvider>
  );
}
