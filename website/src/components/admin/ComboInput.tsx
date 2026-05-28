"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  name: string;
  value: string;
  onChange: (next: string) => void;
  /** Existing values to suggest in the dropdown. */
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * Visible combobox: input with a chevron that opens a panel of options.
 * Admins can click an option, OR type a brand-new value (which is allowed
 * because the input is free-text — the dropdown is just a suggestion list
 * built from existing DB values).
 */
export function ComboInput({
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options by what the user has typed (case-insensitive).
  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v) return options;
    return options.filter((o) => o.toLowerCase().includes(v));
  }, [value, options]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Reset highlight when options change.
  useEffect(() => setHighlight(0), [filtered.length]);

  function pick(opt: string) {
    onChange(opt);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open) {
      const opt = filtered[highlight];
      if (opt) {
        e.preventDefault();
        pick(opt);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showAddNew =
    open &&
    value.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === value.trim().toLowerCase());
  const showEmpty = open && options.length === 0 && !showAddNew;
  const showOptions = open && filtered.length > 0;

  return (
    <div ref={wrapRef} className="combo">
      <div className="combo-field">
        <input
          ref={inputRef}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          className="combo-chevron"
          aria-label="Toggle options"
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          tabIndex={-1}
          disabled={disabled}
        >
          ▾
        </button>
      </div>

      {(showOptions || showAddNew || showEmpty) && (
        <ul className="combo-list" role="listbox">
          {showAddNew && (
            <li
              className="combo-item combo-item-new"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(value.trim());
              }}
            >
              + Use &ldquo;{value.trim()}&rdquo; as new
            </li>
          )}
          {showEmpty && (
            <li className="combo-item combo-item-empty">
              No suggestions yet — type a value
            </li>
          )}
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === highlight}
              className={`combo-item${i === highlight ? " is-highlighted" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(opt);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
