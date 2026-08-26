"use client";

type SortOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SortOption<T>[];
  label?: string;
};

/** Shared sort dropdown for admin list pages. */
export function AdminSortSelect<T extends string>({
  value,
  onChange,
  options,
  label = "Sort by",
}: Props<T>) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
