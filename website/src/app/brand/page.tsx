"use client";

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
          You are signed in as a <strong>brand partner</strong>. Performance metrics and offer
          management will appear on this dashboard as they are built out.
        </p>
      </div>
    </>
  );
}
