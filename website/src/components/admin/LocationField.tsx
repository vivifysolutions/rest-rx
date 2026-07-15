"use client";

import { useId } from "react";
import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";
import type { LocationValue } from "@/lib/address";
import { EMPTY_LOCATION, isVirtualLocation } from "@/lib/address";

type LocationMode = "physical" | "online";

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** When true, city/state are required for physical addresses. */
  requireCityState?: boolean;
  /** Show Online vs physical address choice. Defaults to true. */
  allowOnline?: boolean;
};

const ONLINE_LOCATION: LocationValue = {
  ...EMPTY_LOCATION,
  line1: "Online",
};

/**
 * Street + city + state + ZIP, or Online (no city/state). Autocomplete fills
 * physical fields; server geocodes to latitude / longitude on save.
 */
export function LocationField({
  value,
  onChange,
  label = "Location",
  hint,
  placeholder = "123 Main St",
  required,
  requireCityState = true,
  allowOnline = true,
}: Props) {
  const modeName = useId();
  const mode: LocationMode =
    allowOnline && isVirtualLocation(value.line1) ? "online" : "physical";
  const needCityState =
    requireCityState && mode === "physical" && Boolean(value.line1.trim());

  const defaultHint =
    mode === "online"
      ? "Online locations do not need a city or state."
      : "Search and pick an address, or enter street, city, state, and ZIP manually.";
  const resolvedHint = hint ?? defaultHint;

  const patch = (partial: Partial<LocationValue>) => {
    onChange({ ...value, ...partial });
  };

  const setMode = (next: LocationMode) => {
    if (next === "online") {
      onChange({ ...ONLINE_LOCATION });
      return;
    }
    if (mode === "online") {
      onChange({ ...EMPTY_LOCATION });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <span className="admin-field-label">
          {label}
          {required ? " *" : ""}
        </span>
        {resolvedHint ? <span className="admin-field-hint">{resolvedHint}</span> : null}

        {allowOnline ? (
          <div
            className="admin-form-choice-list"
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: "0.35rem" }}
          >
            <label className="admin-form-choice">
              <input
                type="radio"
                name={modeName}
                checked={mode === "physical"}
                onChange={() => setMode("physical")}
              />
              <span>
                <strong>Physical address</strong>
              </span>
            </label>
            <label className="admin-form-choice">
              <input
                type="radio"
                name={modeName}
                checked={mode === "online"}
                onChange={() => setMode("online")}
              />
              <span>
                <strong>Online</strong>
              </span>
            </label>
          </div>
        ) : null}
      </div>

      {mode === "online" ? (
        <p className="admin-field-hint" style={{ margin: 0 }}>
          Saved as <strong>Online</strong> — city, state, and ZIP are not required.
        </p>
      ) : (
        <>
          <div>
            <AddressAutocomplete
              value={value}
              onChange={patch}
              placeholder={placeholder}
              required={required}
            />
          </div>

          <label>
            <span className="admin-field-label">Apt / suite</span>
            <input
              value={value.line2}
              onChange={(e) => patch({ line2: e.target.value })}
              placeholder="Suite 200"
            />
          </label>

          <div className="admin-form-row">
            <label>
              <span className="admin-field-label">
                City
                {requireCityState ? " *" : ""}
              </span>
              <input
                required={needCityState}
                value={value.city}
                onChange={(e) => patch({ city: e.target.value })}
                placeholder="Austin"
              />
            </label>
            <label>
              <span className="admin-field-label">
                State
                {requireCityState ? " *" : ""}
              </span>
              <input
                required={needCityState}
                value={value.state}
                onChange={(e) => patch({ state: e.target.value })}
                placeholder="TX"
                maxLength={2}
                autoCapitalize="characters"
              />
            </label>
            <label>
              <span className="admin-field-label">ZIP</span>
              <input
                value={value.postalCode}
                onChange={(e) => patch({ postalCode: e.target.value })}
                placeholder="78701"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
