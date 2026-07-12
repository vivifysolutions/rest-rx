"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { searchAddresses } from "@/lib/api";
import type { AddressSuggestion, LocationValue } from "@/lib/address";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
};

/**
 * Location search with autocomplete (Green Door pattern).
 * Coordinates are stored internally — admins never enter lat/lng manually.
 */
export function LocationField({
  value,
  onChange,
  label = "Location",
  hint = "Search for a city, state, venue, or street address. Pick a result or type your own.",
  placeholder = "e.g. Austin, TX or 123 Main St, Chicago, IL",
  required,
}: Props) {
  const autoId = useId();
  const listboxId = `${autoId}-listbox`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const displayValue = query || value.location;

  const runSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const results = await searchAddresses(trimmed);
      if (requestId !== requestIdRef.current) return;
      setSuggestions(results);
      setActiveIndex(results.length ? 0 : -1);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setSuggestions([]);
      setActiveIndex(-1);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange({ location: text, latitude: null, longitude: null });
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, DEBOUNCE_MS);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange({
      location: suggestion.formatted,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const showDropdown =
    open && (loading || suggestions.length > 0 || query.trim().length >= MIN_QUERY_LENGTH);

  const pinned =
    value.latitude != null && value.longitude != null ? "Location pinned on map" : null;

  return (
    <div ref={rootRef} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--downriver)" }}>
        {label}
        {required ? " *" : ""}
      </span>
      {hint && (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
          {hint}
        </span>
      )}

      <div style={{ position: "relative" }}>
        <input
          id={autoId}
          required={required}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (query.trim().length >= MIN_QUERY_LENGTH) void runSearch(query);
          }}
          onKeyDown={(e) => {
            if (!showDropdown) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
              e.preventDefault();
              selectSuggestion(suggestions[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
        />

        {showDropdown && (
          <ul
            id={listboxId}
            role="listbox"
            className="combo-list"
            style={{ position: "absolute", zIndex: 40, top: "calc(100% + 4px)", left: 0, right: 0 }}
          >
            {loading && <li className="combo-item combo-item-empty">Searching…</li>}
            {!loading && suggestions.length === 0 && query.trim().length >= MIN_QUERY_LENGTH && (
              <li className="combo-item combo-item-empty">
                No matches — you can still save what you typed.
              </li>
            )}
            {!loading &&
              suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.placeId ?? suggestion.formatted}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`combo-item${index === activeIndex ? " is-highlighted" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                >
                  {suggestion.formatted}
                </li>
              ))}
          </ul>
        )}
      </div>

      {pinned && (
        <span style={{ fontSize: "0.75rem", color: "var(--astral)" }}>{pinned}</span>
      )}
    </div>
  );
}
