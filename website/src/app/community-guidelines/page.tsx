import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMMUNITY_GUIDELINES } from "@/lib/legal-copy";

export const metadata: Metadata = {
  title: "Community Guidelines — Rest & Rx",
  description: COMMUNITY_GUIDELINES.summary,
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      title={COMMUNITY_GUIDELINES.title}
      summary={COMMUNITY_GUIDELINES.summary}
      sections={COMMUNITY_GUIDELINES.sections}
      meta={COMMUNITY_GUIDELINES.meta}
    />
  );
}
