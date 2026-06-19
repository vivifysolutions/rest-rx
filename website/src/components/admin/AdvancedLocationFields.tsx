"use client";

type AdvancedLocationFieldsProps = {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

/**
 * Coordinates are optional and rarely needed — tuck them away so admins
 * aren't faced with raw lat/lng fields on every form.
 */
export function AdvancedLocationFields({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: AdvancedLocationFieldsProps) {
  const hasValues = Boolean(latitude || longitude);

  return (
    <details className="admin-advanced" open={hasValues}>
      <summary>Map coordinates (optional)</summary>
      <p className="admin-field-hint">
        Only needed for precise map placement. Most listings work fine with a city or venue name.
      </p>
      <div className="admin-form-row">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            placeholder="e.g. 41.8781"
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            placeholder="e.g. -87.6298"
          />
        </label>
      </div>
    </details>
  );
}
