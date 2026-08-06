import type { Metadata } from "next";
import { PortalAuthProvider } from "@/contexts/PortalAuthProvider";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Resubmit your application | Rest & Rx",
  robots: { index: false, follow: false },
};

export default function ResubmitLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
