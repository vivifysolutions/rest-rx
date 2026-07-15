"use client";

import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";
import type { LocationValue } from "@/lib/address";

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** When true, city/state are required (physical business addresses). */
  requireCityState?: boolean;
};

/**
 * Street + city + state + ZIP. Autocomplete fills the fields; server geocodes
 * to latitude / longitude on save (Green Door pattern).
 */
export function LocationField({
  value,
  onChange,
  label = "Location",
  hint = "Search and pick an address, or enter street, city, state, and ZIP manually.",
  placeholder = "123 Main St",
  required,
  requireCityState = true,
}: Props) {
  const patch = (partial: Partial<LocationValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <span className="admin-field-label">
          {label}
          {required ? " *" : ""}
        </span>
        {hint ? <span className="admin-field-hint">{hint}</span> : null}
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
            required={requireCityState && Boolean(value.line1.trim())}
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
            required={requireCityState && Boolean(value.line1.trim())}
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
    </div>
  );
}
