"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BrandPartnerApplication } from "@/lib/brand-partner-application";

export type BrandPartnerOption = Pick<
  BrandPartnerApplication,
  "id" | "companyName" | "fullName" | "email"
>;

type Props = {
  value: string;
  partners: BrandPartnerOption[];
  onChange: (applicationId: string) => void;
  loading?: boolean;
  disabled?: boolean;
};

function partnerLabel(partner: BrandPartnerOption): string {
  return partner.companyName.trim() || partner.fullName.trim() || partner.email;
}

function partnerSearchText(partner: BrandPartnerOption): string {
  return [partner.companyName, partner.fullName, partner.email]
    .join(" ")
    .toLowerCase();
}

/**
 * Searchable picker of approved brand partners for linking discounts.
 */
export function BrandPartnerPicker({
  value,
  partners,
  onChange,
  loading = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => partners.find((p) => p.id === value) ?? null,
    [partners, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => partnerSearchText(p).includes(q));
  }, [partners, query]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => setHighlight(0), [filtered.length, open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange("");
    setQuery("");
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
        pick(opt.id);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (e.key === "Backspace" && !query && value) {
      clear();
    }
  }

  const displayValue = open
    ? query
    : selected
      ? partnerLabel(selected)
      : "";

  return (
    <div ref={wrapRef} className="combo">
      <div className="combo-field">
        <input
          ref={inputRef}
          name="brandPartnerApplicationId"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
          placeholder={
            loading
              ? "Loading brand partners…"
              : "Search by company, contact, or email"
          }
          disabled={disabled || loading}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            className="combo-chevron"
            aria-label="Clear brand partner"
            onClick={clear}
            tabIndex={-1}
            disabled={disabled}
          >
            ×
          </button>
        ) : (
          <button
            type="button"
            className="combo-chevron"
            aria-label="Toggle brand partners"
            onClick={() => {
              if (disabled || loading) return;
              setOpen((v) => !v);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
            disabled={disabled || loading}
          >
            ▾
          </button>
        )}
      </div>

      {open && (
        <ul className="combo-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="combo-item combo-item-empty">
              {partners.length === 0
                ? "No approved brand partners yet"
                : "No matching brand partners"}
            </li>
          ) : (
            filtered.map((partner, i) => (
              <li
                key={partner.id}
                role="option"
                aria-selected={partner.id === value || i === highlight}
                className={`combo-item${i === highlight || partner.id === value ? " is-highlighted" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(partner.id);
                }}
              >
                <strong>{partnerLabel(partner)}</strong>
                <span className="combo-item-meta">
                  {[partner.fullName, partner.email].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
