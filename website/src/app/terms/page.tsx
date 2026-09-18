import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { TERMS_OF_SERVICE } from "@/lib/legal-copy";

export const metadata: Metadata = {
  title: "Terms of Use — Rest & Rx",
  description: TERMS_OF_SERVICE.summary,
};

export default function TermsPage() {
  return (
    <LegalPage
      title={TERMS_OF_SERVICE.title}
      summary={TERMS_OF_SERVICE.summary}
      sections={TERMS_OF_SERVICE.sections}
      meta={TERMS_OF_SERVICE.meta}
    />
  );
}
