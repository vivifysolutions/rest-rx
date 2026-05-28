import type { Metadata } from "next";
import { PortalAuthProvider } from "@/contexts/PortalAuthProvider";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Sign in | Rest & Rx",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
