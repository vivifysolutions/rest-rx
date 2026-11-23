import { recurrenceLabel } from "@/lib/event-recurrence";
import type { Event } from "@/lib/types";

/** Events table cell: how the event repeats. Past occurrences are greyed out. */
export function RecurrenceBadge({ event }: { event: Event }) {
  if (!event.recurrenceFrequency) return <>—</>;
  const index = event.recurrenceIndex ?? 1;
  const position = event.recurrenceCount
    ? `Occurrence ${index} of ${event.recurrenceCount}`
    : `Occurrence ${index} in this series`;
  const isPast = Boolean(event.nextOccurrenceCreatedAt);
  return (
    <span
      className={`admin-badge admin-badge-repeat ${isPast ? "admin-badge-muted" : ""}`}
      title={
        isPast
          ? `${position}. Past occurrence — edit the latest one to change the series.`
          : `${position}. The next one is created after this one ends.`
      }
    >
      ↻ {recurrenceLabel(event.recurrenceFrequency)}
      {isPast ? " · Past" : ""}
    </span>
  );
}
