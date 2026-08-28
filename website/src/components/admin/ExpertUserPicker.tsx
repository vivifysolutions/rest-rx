"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ApiUser } from "@/lib/types";

export type ExpertOwnerOption = Pick<
  ApiUser,
  | "id"
  | "displayName"
  | "firstName"
  | "lastName"
  | "email"
  | "userType"
  | "professionalRole"
  | "specialty"
>;

type Props = {
  value: string;
  experts: ExpertOwnerOption[];
  onChange: (userId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

function expertLabel(user: ExpertOwnerOption): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email?.trim() || "Expert";
}

function expertSearchText(user: ExpertOwnerOption): string {
  return [
    user.displayName,
    user.firstName,
    user.lastName,
    user.email,
    user.userType,
    user.professionalRole,
    user.specialty,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function userTypeLabel(userType: string): string {
  switch (userType) {
    case "expert":
      return "Expert";
    case "ambassador":
      return "Ambassador";
    case "foundation":
      return "Foundation";
    case "admin":
      return "Admin";
    default:
      return userType;
  }
}

/**
 * Searchable picker of approved experts for resource “Shared by” attribution —
 * same UX pattern as BrandPartnerPicker.
 */
export function ExpertUserPicker({
  value,
  experts,
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Search by name, email, role, or specialty",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => experts.find((u) => u.id === value) ?? null,
    [experts, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return experts;
    return experts.filter((u) => expertSearchText(u).includes(q));
  }, [experts, query]);

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
      ? `${expertLabel(selected)} (${userTypeLabel(selected.userType)})`
      : "";

  return (
    <div ref={wrapRef} className="combo">
      <div className="combo-field">
        <input
          ref={inputRef}
          name="updatedById"
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
          placeholder={loading ? "Loading experts…" : placeholder}
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
            aria-label="Clear expert"
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
            aria-label="Toggle experts"
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
              {experts.length === 0
                ? "No approved experts yet"
                : "No matching experts"}
            </li>
          ) : (
            filtered.map((user, i) => (
              <li
                key={user.id}
                role="option"
                aria-selected={user.id === value || i === highlight}
                className={`combo-item${i === highlight || user.id === value ? " is-highlighted" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(user.id);
                }}
              >
                <strong>{expertLabel(user)}</strong>
                <span className="combo-item-meta">
                  {userTypeLabel(user.userType)}
                  {" · "}
                  {[user.professionalRole || user.specialty, user.email]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
