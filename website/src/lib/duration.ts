/**
 * Resource durations are stored as text ("15 min", "30 sec", "2 hrs"). The app reads that
 * text for badges and the Micro RX timer, so admin forms build it from a unit + whole number.
 */

export type DurationUnit = "sec" | "min" | "hr";

export const DURATION_UNITS: { value: DurationUnit; label: string; seconds: number }[] = [
  { value: "sec", label: "Seconds", seconds: 1 },
  { value: "min", label: "Minutes", seconds: 60 },
  { value: "hr", label: "Hours", seconds: 3600 },
];

const UNIT_PATTERNS: [RegExp, number][] = [
  [/^(hours?|hrs?|h)$/, 3600],
  [/^(minutes?|mins?|m)$/, 60],
  [/^(seconds?|secs?|s)$/, 1],
];

/** Total seconds from stored duration text, or null when it can't be read. Mirrors the app's parser. */
function durationTextToSeconds(text: string): number | null {
  const t = text.trim().toLowerCase();
  let seconds = 0;
  const clock = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    seconds = c !== undefined ? +a * 3600 + +b * 60 + +c : +a * 60 + +b;
  } else if (/^\d+(\.\d+)?$/.test(t)) {
    seconds = Number(t);
  } else {
    for (const [, value, unit] of t.matchAll(/(\d+(?:\.\d+)?)\s*([a-z]+)/g)) {
      const match = UNIT_PATTERNS.find(([pattern]) => pattern.test(unit));
      if (match) seconds += Number(value) * match[1];
    }
  }
  seconds = Math.round(seconds);
  return seconds > 0 ? seconds : null;
}

/** Split stored text into the largest whole unit, e.g. "1 min 30 sec" → 90 sec, "120 min" → 2 hr. */
export function splitDuration(text: string): { amount: string; unit: DurationUnit | null } {
  const seconds = durationTextToSeconds(text);
  if (seconds == null) return { amount: "", unit: null };
  const unit = [...DURATION_UNITS].reverse().find((u) => seconds % u.seconds === 0)!;
  return { amount: String(seconds / unit.seconds), unit: unit.value };
}

/** Stored text for a unit + amount: "30 sec", "15 min", "1 hr", "2 hrs". Empty when no amount. */
export function formatDuration(amount: string, unit: DurationUnit): string {
  const n = Number(amount);
  if (!amount || !Number.isInteger(n) || n <= 0) return "";
  if (unit === "hr") return `${n} ${n === 1 ? "hr" : "hrs"}`;
  return `${n} ${unit}`;
}
