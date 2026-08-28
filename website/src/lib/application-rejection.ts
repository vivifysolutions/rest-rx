import type { PartnerApplicationType } from "@/lib/partner-application-options";

export const APPLICATION_REJECTION_ISSUES = [
  { value: "npi", label: "NPI number" },
  { value: "work_credential", label: "Work credential photo" },
  { value: "identity", label: "Identity photo" },
  { value: "other", label: "Other" },
] as const;

export type ApplicationRejectionIssue =
  (typeof APPLICATION_REJECTION_ISSUES)[number]["value"];

export type RejectionIssueOption = { value: string; label: string };

export const PARTNER_REJECTION_ISSUES: Record<
  PartnerApplicationType,
  RejectionIssueOption[]
> = {
  expert: [
    { value: "credentials", label: "Credentials page" },
    { value: "details", label: "Details page" },
    { value: "approved_as_member", label: "Approved as a member, not an expert" },
    { value: "other", label: "Other" },
  ],
  brand_partner: [
    { value: "more_business_info", label: "Need more business info" },
    { value: "offer_not_clear", label: "Offer not clear" },
    { value: "other", label: "Other" },
  ],
  ambassador: [
    { value: "more_info", label: "Need more info" },
    { value: "approved_as_member", label: "Approved as a member, not an ambassador" },
    { value: "other", label: "Other" },
  ],
  foundation: [
    { value: "more_info", label: "Need more info" },
    { value: "other", label: "Other" },
  ],
};

const ALL_REJECTION_ISSUE_LABELS: RejectionIssueOption[] = [
  ...APPLICATION_REJECTION_ISSUES,
  ...Object.values(PARTNER_REJECTION_ISSUES).flat(),
];

export type PartnerApplicationRejectionIssue =
  (typeof PARTNER_REJECTION_ISSUES)[PartnerApplicationType][number]["value"];

export function partnerRejectionIssuesFor(
  applicationType: PartnerApplicationType | undefined,
): RejectionIssueOption[] {
  if (!applicationType) return [];
  return PARTNER_REJECTION_ISSUES[applicationType];
}

export function partnerRejectionNotesRequired(issue: string): boolean {
  return (
    issue === "other" ||
    issue === "more_info" ||
    issue === "more_business_info" ||
    issue === "offer_not_clear"
  );
}

export function labelRejectionIssue(issue: string | null | undefined): string {
  if (!issue) return "—";
  return ALL_REJECTION_ISSUE_LABELS.find((option) => option.value === issue)?.label ?? issue;
}

export function partnerResubmitPrompt(issue: string | null | undefined): string {
  switch (issue) {
    case "credentials":
      return "Please update your credentials page and resubmit.";
    case "details":
      return "Please update your details page and resubmit.";
    case "more_business_info":
      return "Please add more business information and resubmit.";
    case "offer_not_clear":
      return "Please clarify your offer and resubmit.";
    case "more_info":
      return "Please add the additional information requested and resubmit.";
    case "approved_as_member":
      return "You were approved as a member. You can update this application if you want to reapply for the elevated role.";
    default:
      return "Fix what caused the rejection, then resubmit for review.";
  }
}
