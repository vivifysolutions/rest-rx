"use client";

type Option = { value: string; label: string };

type Props = {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

/** Strict select for reference data (categories, tiers). No free-text values. */
export function ReferenceSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
  disabled,
}: Props) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
