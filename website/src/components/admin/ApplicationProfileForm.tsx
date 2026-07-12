"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DetailRow,
  DetailVerificationPhoto,
} from "@/components/admin/AdminDetailView";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { ApiUser } from "@/lib/types";
import {
  getNpiRequirement,
  PROFESSIONAL_ROLE_OPTIONS,
} from "@/lib/professionalRoles";
import type { UpdateUserProfilePayload } from "@/lib/api";

type Props = {
  user: ApiUser;
  saving: boolean;
  saveError: string | null;
  onSave: (payload: UpdateUserProfilePayload) => Promise<boolean>;
};

function toFormState(user: ApiUser) {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: user.displayName ?? "",
    professionalRole: user.professionalRole ?? "",
    specialty: user.specialty ?? "",
    npiNumber: user.npiNumber ?? "",
    phone: user.phone ?? "",
    identityPhotoUrl: user.identityPhotoUrl ?? "",
    workCredentialPhotoUrl: user.workCredentialPhotoUrl ?? "",
  };
}

export function ApplicationProfileForm({ user, saving, saveError, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toFormState(user));

  useEffect(() => {
    if (!editing) {
      setForm(toFormState(user));
    }
  }, [user, editing]);

  const npiRequirement = useMemo(
    () => getNpiRequirement(form.professionalRole),
    [form.professionalRole],
  );
  const showNpiField = npiRequirement !== "none";

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setForm(toFormState(user));
    setEditing(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      displayName: form.displayName.trim() || undefined,
      professionalRole: form.professionalRole.trim() || undefined,
      specialty: form.specialty.trim() || undefined,
      npiNumber: showNpiField ? form.npiNumber.replace(/\D/g, "") || undefined : undefined,
      phone: form.phone.trim() || undefined,
      identityPhotoUrl: form.identityPhotoUrl || undefined,
      workCredentialPhotoUrl: form.workCredentialPhotoUrl || undefined,
    });
    if (ok) {
      setEditing(false);
    }
  }

  return (
    <section className="admin-detail-section">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: editing ? "0.75rem" : 0,
        }}
      >
        <h2 className="admin-detail-section-title" style={{ margin: 0 }}>
          Profile
        </h2>
        {!editing && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setEditing(true)}
          >
            Edit profile
          </button>
        )}
      </div>

      {!editing ? (
        <dl className="admin-detail-grid">
          <DetailRow label="Email" value={user.email ?? "—"} />
          <DetailRow label="First name" value={user.firstName ?? "—"} />
          <DetailRow label="Last name" value={user.lastName ?? "—"} />
          <DetailRow label="Display name" value={user.displayName ?? "—"} />
          <DetailRow label="Professional role" value={user.professionalRole ?? "—"} />
          <DetailRow label="Specialty" value={user.specialty ?? "—"} />
          <DetailRow label="NPI number" value={user.npiNumber ?? "—"} />
          <DetailRow label="Phone" value={user.phone ?? "—"} />
          <DetailRow label="Verification photos">
            <div className="admin-verification-grid">
              <DetailVerificationPhoto src={user.identityPhotoUrl} label="Identity photo" />
              <DetailVerificationPhoto
                src={user.workCredentialPhotoUrl}
                label="Work credential"
              />
            </div>
          </DetailRow>
        </dl>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <p className="admin-callout" style={{ marginBottom: "0.75rem" }}>
            Email is managed by Firebase sign-in and cannot be changed here.
          </p>

          <div className="admin-form-row">
            <label>
              Email
              <input type="email" value={user.email ?? ""} disabled readOnly />
            </label>
            <label>
              Display name
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              First name
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                required
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                required
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Professional role
              <select
                value={form.professionalRole}
                onChange={(e) => {
                  const role = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    professionalRole: role,
                    npiNumber: getNpiRequirement(role) === "none" ? "" : prev.npiNumber,
                  }));
                }}
                required
              >
                <option value="">Select role…</option>
                {PROFESSIONAL_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Specialty
              <input
                type="text"
                value={form.specialty}
                onChange={(e) => setField("specialty", e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="admin-form-row">
            {showNpiField && (
              <label>
                NPI number
                {npiRequirement === "required" ? " *" : " (optional)"}
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.npiNumber}
                  onChange={(e) => setField("npiNumber", e.target.value)}
                  placeholder="10-digit NPI"
                  required={npiRequirement === "required"}
                />
              </label>
            )}
            <label>
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <ImageUpload
              folder="verification/admin/identity"
              label="Identity photo"
              value={form.identityPhotoUrl}
              onChange={(url) => setField("identityPhotoUrl", url)}
            />
            <ImageUpload
              folder="verification/admin/work-credential"
              label="Work credential"
              value={form.workCredentialPhotoUrl}
              onChange={(url) => setField("workCredentialPhotoUrl", url)}
            />
          </div>

          {saveError && <p className="admin-error">{saveError}</p>}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
