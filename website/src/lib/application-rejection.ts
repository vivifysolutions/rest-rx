export const APPLICATION_REJECTION_ISSUES = [
  { value: "npi", label: "NPI number" },
  { value: "work_credential", label: "Work credential photo" },
  { value: "identity", label: "Identity photo" },
  { value: "other", label: "Other" },
] as const;

export type ApplicationRejectionIssue =
  (typeof APPLICATION_REJECTION_ISSUES)[number]["value"];
