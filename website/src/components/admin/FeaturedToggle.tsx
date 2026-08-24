"use client";

type Props = {
  isFeatured: boolean;
  isFeaturedOnHome: boolean;
  onChangeFeatured: (next: boolean) => void;
  onChangeFeaturedOnHome: (next: boolean) => void;
  /** e.g. "Resources", "Discounts" — the Discover section this item belongs to */
  sectionLabel: string;
  disabled?: boolean;
};

function ToggleRow({
  checked,
  onChange,
  title,
  descriptionOn,
  descriptionOff,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  descriptionOn: string;
  descriptionOff: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`admin-featured-toggle${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="admin-featured-toggle-switch" aria-hidden>
        <span className="admin-featured-toggle-knob" />
      </span>
      <span className="admin-featured-toggle-copy">
        <strong>{title}</strong>
        <span>{checked ? descriptionOn : descriptionOff}</span>
      </span>
    </button>
  );
}

/**
 * Two independent placement toggles:
 * - App Home tab
 * - Discover → [section] Featured carousel
 */
export function FeaturedToggle({
  isFeatured,
  isFeaturedOnHome,
  onChangeFeatured,
  onChangeFeaturedOnHome,
  sectionLabel,
  disabled = false,
}: Props) {
  return (
    <div className="admin-featured-placement">
      <p className="admin-featured-placement-label">Placement</p>
      <ToggleRow
        checked={isFeaturedOnHome}
        onChange={onChangeFeaturedOnHome}
        disabled={disabled}
        title="Feature on Home"
        descriptionOn="Showing on the app Home tab"
        descriptionOff="Turn on to show this on the app Home tab"
      />
      <ToggleRow
        checked={isFeatured}
        onChange={onChangeFeatured}
        disabled={disabled}
        title={`Feature on Discover → ${sectionLabel}`}
        descriptionOn={`Showing in the Featured carousel at the top of ${sectionLabel}`}
        descriptionOff={`Pin this to the Featured carousel on the ${sectionLabel} page`}
      />
    </div>
  );
}
