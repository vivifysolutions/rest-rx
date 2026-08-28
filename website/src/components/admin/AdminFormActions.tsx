"use client";

import { type ReactNode, useState } from "react";

export const SAVE_CHANGES_LABEL = "Save changes";

export function serializeFormState(value: unknown): string {
  return JSON.stringify(value);
}

export function formHasUnsavedChanges(current: unknown, baseline: string): boolean {
  return serializeFormState(current) !== baseline;
}

/** Snapshots `form` on mount. When `enabled`, true only after the values change. */
export function useUnsavedChanges<T>(form: T, enabled: boolean): boolean {
  const [baseline] = useState(() => serializeFormState(form));
  return enabled && serializeFormState(form) !== baseline;
}

type ActionsProps = {
  label: string;
  disabled?: boolean;
  sticky?: boolean;
  extra?: ReactNode;
  /** When false, skip the “No unsaved changes” hint (e.g. while saving). */
  showDisabledHint?: boolean;
};

export function AdminFormActions({
  label,
  disabled = false,
  sticky = false,
  extra,
  showDisabledHint = true,
}: ActionsProps) {
  return (
    <div className={`admin-form-actions${sticky ? " admin-form-actions--sticky" : ""}`}>
      <button type="submit" className="admin-btn admin-btn-primary" disabled={disabled}>
        {label}
      </button>
      {extra}
      {disabled && showDisabledHint ? (
        <span className="admin-form-actions-hint">No unsaved changes</span>
      ) : null}
    </div>
  );
}

type SubmitProps = {
  label: string;
  form: unknown;
  extra?: ReactNode;
};

/** Create: always enabled at the call site. Save changes: sticky top bar, disabled until dirty. */
export function AdminFormSubmit({ label, form, extra }: SubmitProps) {
  const trackChanges = label === SAVE_CHANGES_LABEL;
  const hasChanges = useUnsavedChanges(form, trackChanges);
  return (
    <AdminFormActions
      label={label}
      disabled={trackChanges && !hasChanges}
      sticky={trackChanges}
      extra={extra}
    />
  );
}
