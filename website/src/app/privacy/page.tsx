import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACY_POLICY } from "@/lib/legal-copy";

export const metadata: Metadata = {
  title: "Privacy Policy — Rest & Rx",
  description: PRIVACY_POLICY.summary,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title={PRIVACY_POLICY.title}
      summary={PRIVACY_POLICY.summary}
      sections={PRIVACY_POLICY.sections}
      meta={PRIVACY_POLICY.meta}
    />
  );
}
