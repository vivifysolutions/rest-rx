"use client";

import { Suspense } from "react";
import Link from "next/link";
import BrandPartnerApplicationForm from "@/components/partner/BrandPartnerApplicationForm";

export default function PartnerPage() {
  return (
    <div className="partner-application-page" style={{ minHeight: "100vh", padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header className="partner-application-hero">
          <Link href="/" className="partner-application-back">
            ← Back to Home
          </Link>
          <h1 className="font-heading">Become a Partner</h1>
          <p>Interested in partnering with Rest &amp; Rx? We&apos;d love to hear from you.</p>
        </header>
        <Suspense fallback={<p>Loading application…</p>}>
          <BrandPartnerApplicationForm />
        </Suspense>
      </div>
    </div>
  );
}
