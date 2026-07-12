"use client";

import Link from "next/link";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";

export default function BrandDashboardPage() {
  return (
    <>
      <ContentPageHeader
        title="Brand overview"
        description="Manage your partnership with Rest & Rx from the web portal."
      />
      <div className="admin-callout admin-card">
        <p>
          You are signed in as a <strong>brand partner</strong>. Use the{" "}
          <Link href="/brand/discounts">Discounts</Link> page to submit offers for review after your
          discovery call.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Brand partners use this web portal only — the Rest &amp; Rx mobile app is for verified
          healthcare professionals.
        </p>
      </div>
    </>
  );
}
