"use client";

import Link from "next/link";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";

export default function BrandDashboardPage() {
  return (
    <>
      <ContentPageHeader
        title="Brand overview"
        description="Metrics and partnership tools for brand partners. More reports will be added here."
      />
      <div className="admin-callout admin-card">
        <p>
          You are signed in as a <strong>brand partner</strong>. Submit discounts from the{" "}
          <Link href="/brand/discounts">Discounts</Link> page — use reference categories and tiers
          so your offers appear correctly in the mobile app.
        </p>
      </div>
    </>
  );
}
