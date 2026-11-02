import type { Event, EventRecurrenceFrequency } from "@/lib/types";

export const RECURRENCE_OPTIONS: { value: EventRecurrenceFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function recurrenceLabel(frequency: EventRecurrenceFrequency): string {
  return RECURRENCE_OPTIONS.find((option) => option.value === frequency)?.label ?? frequency;
}

/** The admin's own zone, sent with new series so times stay put across DST changes. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** e.g. "Weekly · occurrence 3 of 8 · ends Mar 1, 2027". Null for one-off events. */
export function recurrenceSummary(event: Event): string | null {
  if (!event.recurrenceFrequency) return null;
  const parts = [recurrenceLabel(event.recurrenceFrequency)];
  const index = event.recurrenceIndex ?? 1;
  parts.push(
    event.recurrenceCount ? `occurrence ${index} of ${event.recurrenceCount}` : `occurrence ${index}`,
  );
  if (event.recurrenceEndsAt) {
    parts.push(`ends ${new Date(event.recurrenceEndsAt).toLocaleDateString()}`);
  }
  if (event.nextOccurrenceCreatedAt) parts.push("past occurrence");
  return parts.join(" · ");
}

/** Deleting the latest occurrence also stops the series, since nothing is left to repeat from. */
export function deleteEventConfirmMessage(event: Event): string {
  if (event.recurrenceFrequency && !event.nextOccurrenceCreatedAt) {
    return "Delete this event? It's the latest occurrence of a repeating event, so the series stops too.";
  }
  return "Delete this event?";
}

/** Longest an occurrence may last so it ends before the next one starts. Mirrors the API. */
const MAX_OCCURRENCE_DAYS: Record<EventRecurrenceFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 28,
};

/** Same rules the API enforces, so the form can block the save with a clear message. */
export function eventDateError(
  startDate: string,
  endDate: string,
  frequency: EventRecurrenceFrequency | "",
): string | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (end < start) return "The end must be after the start.";
  if (!frequency) return null;
  const maxDays = MAX_OCCURRENCE_DAYS[frequency];
  if (end - start >= maxDays * 24 * 60 * 60 * 1000) {
    return `An event that repeats ${recurrenceLabel(frequency).toLowerCase()} must last less than ${maxDays} days, so it ends before the next one starts.`;
  }
  return null;
}
