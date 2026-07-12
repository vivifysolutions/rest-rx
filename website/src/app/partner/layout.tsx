import type { Metadata } from "next";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Become a Partner | Rest & Rx",
  description:
    "Apply to offer exclusive discounts to healthcare professionals on Rest & Rx.",
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <div className="partner-application-page">{children}</div>;
}
