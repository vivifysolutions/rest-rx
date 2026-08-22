"use client";

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`admin-badge ${isActive ? "admin-badge-success" : "admin-badge-muted"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function ActiveToggleButton({
  isActive,
  onToggle,
  disabled,
}: {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`admin-btn admin-btn-sm ${isActive ? "admin-btn-danger" : "admin-btn-primary"}`}
      onClick={onToggle}
      disabled={disabled}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
