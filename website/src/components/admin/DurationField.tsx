"use client";

import { useEffect, useState } from "react";
import {
  DURATION_UNITS,
  formatDuration,
  splitDuration,
  type DurationUnit,
} from "@/lib/duration";

type Props = {
  label?: string;
  /** Stored duration text, e.g. "15 min". */
  value: string;
  onChange: (value: string) => void;
  defaultUnit?: DurationUnit;
  hint?: string;
};

/** Unit dropdown + whole-number input, so durations are always in a format the app can read. */
export function DurationField({
  label = "Duration",
  value,
  onChange,
  defaultUnit = "min",
  hint,
}: Props) {
  // What the admin typed and picked is the source of truth, so the unit never flips mid-typing
  // (e.g. "60" seconds stays 60 Seconds rather than becoming 1 Minute).
  const [amount, setAmount] = useState(() => splitDuration(value).amount);
  const [unit, setUnit] = useState<DurationUnit>(() => splitDuration(value).unit ?? defaultUnit);

  // Re-read only when the value changes from outside, e.g. loading an item to edit.
  useEffect(() => {
    if (value === formatDuration(amount, unit)) return;
    const parsed = splitDuration(value);
    setAmount(parsed.amount);
    if (parsed.unit) setUnit(parsed.unit);
  }, [value, amount, unit]);

  return (
    <label>
      {label}
      <span style={{ display: "flex", gap: "0.5rem" }}>
        <select
          aria-label={`${label} unit`}
          value={unit}
          onChange={(e) => {
            const next = e.target.value as DurationUnit;
            setUnit(next);
            onChange(formatDuration(amount, next));
          }}
          // admin.css gives every select/input width: 100%; fix the unit width so the amount stays visible.
          style={{ flex: "0 0 9rem", width: "9rem" }}
        >
          {DURATION_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <input
          // Text + numeric keypad rather than type="number", which accepts "1.5" and "1e2".
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`${label} amount`}
          value={amount}
          onChange={(e) => {
            const next = e.target.value.trim();
            // Whole numbers only: ignore the keystroke rather than altering what was typed.
            if (!/^\d*$/.test(next)) return;
            setAmount(next);
            onChange(formatDuration(next, unit));
          }}
          placeholder="1"
          style={{ flex: 1, width: "auto", minWidth: "4rem" }}
        />
      </span>
      {hint ? <span className="admin-field-hint">{hint}</span> : null}
    </label>
  );
}
