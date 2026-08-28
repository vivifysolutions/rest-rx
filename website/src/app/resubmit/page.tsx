"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { getMyBrandPartnerApplication } from "@/lib/api";
import { partnerResubmitPrompt } from "@/lib/application-rejection";
import {
  fromBrandPartnerApplication,
  type BrandPartnerApplication,
  type PartnerApplicationFormData,
} from "@/lib/brand-partner-application";
import BrandPartnerApplicationForm from "@/components/partner/BrandPartnerApplicationForm";

export default function ResubmitPage() {
  const { user, loading, token } = usePortalAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [initialData, setInitialData] = useState<PartnerApplicationFormData | null>(null);
  const [application, setApplication] = useState<BrandPartnerApplication | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/portal/login?next=${encodeURIComponent("/resubmit")}`);
      return;
    }
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const application = await getMyBrandPartnerApplication(token);
        if (cancelled) return;
        if (application && application.status === "rejected") {
          setApplication(application);
          setInitialData(fromBrandPartnerApplication(application));
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, token, router]);

  if (loading || !user || checking) {
    return (
      <div className="admin-login-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <h1 className="font-subheading">Nothing to resubmit</h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
            We couldn&apos;t find a rejected application for your account.
          </p>
          <Link href="/portal/login" className="admin-btn admin-btn-primary">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="partner-application-page" style={{ minHeight: "100vh", padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header className="partner-application-hero">
          <Link href="/" className="partner-application-back">
            ← Back to Home
          </Link>
          <h1 className="font-heading">Resubmit your application</h1>
          <p>
            {partnerResubmitPrompt(application?.rejectionIssue)}
          </p>
          {application?.rejectionReason ? (
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              Reviewer note: {application.rejectionReason}
            </p>
          ) : null}
        </header>
        <Suspense fallback={<p>Loading application…</p>}>
          <BrandPartnerApplicationForm
            mode="resubmit"
            initialData={initialData}
            rejectionIssue={application?.rejectionIssue}
          />
        </Suspense>
      </div>
    </div>
  );
}
