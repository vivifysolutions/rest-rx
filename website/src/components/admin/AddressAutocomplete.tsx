"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { searchAddresses } from "@/lib/api";
import type { AddressSuggestion, LocationValue } from "@/lib/address";
import { formatLocationLabel, parseManualAddressQuery, suggestionToForm } from "@/lib/address";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

type Props = {
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  placeholder?: string;
  required?: boolean;
};

/**
 * Street search with autocomplete — fills street / city / state / ZIP on select.
 * Coordinates are resolved server-side on save.
 */
export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing the street address…",
  required,
}: Props) {
  const autoId = useId();
  const listboxId = `${autoId}-listbox`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const displayValue =
    query ||
    selectedLabel ||
    (value.line1 && value.city ? formatLocationLabel(value) : value.line1);

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

  const commitManual = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const parsed = parseManualAddressQuery(trimmed);
    onChange(parsed);
    setQuery(parsed.line1 ?? trimmed);
    setSelectedLabel(null);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    setSelectedLabel(null);
    onChange({ line1: text });
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, DEBOUNCE_MS);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestionToForm(suggestion));
    setQuery("");
    setSelectedLabel(suggestion.formatted);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const showEmpty =
    !loading && suggestions.length === 0 && query.trim().length >= MIN_QUERY_LENGTH;
  const showDropdown = open && (loading || suggestions.length > 0 || showEmpty);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
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
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
              selectSuggestion(suggestions[activeIndex]);
            } else if (showEmpty) {
              commitManual(query);
            }
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
          {showEmpty && (
            <li className="combo-item" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="combo-item-empty" style={{ padding: 0 }}>
                No matches from search. You can still save a manual address.
              </span>
              <button
                type="button"
                className="admin-btn"
                style={{ width: "100%", justifyContent: "flex-start", textAlign: "left" }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitManual(query)}
              >
                Use “{query.trim()}” as street address
              </button>
              <span className="combo-item-empty" style={{ padding: 0 }}>
                Then fill city, state, and ZIP below.
              </span>
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
  );
}
