import type { Metadata } from "next";
import { PortalAuthProvider } from "@/contexts/PortalAuthProvider";
import { BrandAreaGate } from "@/components/portal/BrandAreaGate";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Brand dashboard | Rest & Rx",
  robots: { index: false, follow: false },
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthProvider>
      <BrandAreaGate>{children}</BrandAreaGate>
    </PortalAuthProvider>
  );
}
