export const APPLICATION_STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
} as const;

export const REPORT_STATUS_LABELS = {
  pending: "Needs review",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
} as const;

export const CONTENT_TYPE_LABELS = {
  thread: "Forum thread",
  post: "Feed post",
  comment: "Comment",
  group: "Community group",
} as const;

export const GROUP_STATUS_LABELS = {
  active: "Active",
  inactive: "Hidden",
  archived: "Archived",
} as const;

export const CATEGORY_TYPE_LABELS = {
  EVENT: "Events",
  DISCOUNT: "Partner discounts",
  ONBOARDING: "Onboarding",
  AFFIRMATION: "Affirmations",
} as const;

export function formatApplicationStatus(status: string): string {
  return APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] ?? status;
}

export function formatReportStatus(status: string): string {
  return REPORT_STATUS_LABELS[status as keyof typeof REPORT_STATUS_LABELS] ?? status;
}

export function formatContentType(type: string): string {
  return CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS] ?? type;
}

export function formatGroupStatus(status: string): string {
  return GROUP_STATUS_LABELS[status as keyof typeof GROUP_STATUS_LABELS] ?? status;
}
