"use client";

import { useMemo } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { PartnerApplicationFormData } from "@/lib/brand-partner-application";
import {
  getNpiRequirement,
  PROFESSIONAL_ROLE_OPTIONS,
} from "@/lib/professionalRoles";

type ProfessionalValue = PartnerApplicationFormData["professional"];

type Props = {
  value: ProfessionalValue;
  onChange: (patch: Partial<ProfessionalValue>) => void;
};

export function PartnerProfessionalCredentialsFields({ value, onChange }: Props) {
  const npiRequirement = useMemo(
    () => getNpiRequirement(value.professionalRole),
    [value.professionalRole],
  );
  const showNpiField = npiRequirement !== "none";

  return (
    <div className="partner-application-form admin-form">
      <div className="admin-form-row">
        <label>
          First name *
          <input
            value={value.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            required
          />
        </label>
        <label>
          Last name *
          <input
            value={value.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            required
          />
        </label>
      </div>

      <div className="admin-form-row">
        <label>
          Professional role *
          <select
            value={value.professionalRole}
            onChange={(e) => {
              const role = e.target.value;
              onChange({
                professionalRole: role,
                npiNumber: getNpiRequirement(role) === "none" ? "" : value.npiNumber,
              });
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
            value={value.specialty}
            onChange={(e) => onChange({ specialty: e.target.value })}
            placeholder="Optional"
          />
        </label>
      </div>

      {showNpiField && (
        <label>
          NPI number{npiRequirement === "required" ? " *" : " (optional)"}
          <input
            type="text"
            inputMode="numeric"
            value={value.npiNumber}
            onChange={(e) => onChange({ npiNumber: e.target.value })}
            placeholder="10-digit NPI"
            required={npiRequirement === "required"}
          />
        </label>
      )}

      <div className="admin-form-row">
        <ImageUpload
          folder="verification/work-credential"
          label="Work credential photo *"
          value={value.workCredentialPhotoUrl}
          onChange={(url) => onChange({ workCredentialPhotoUrl: url })}
        />
        <ImageUpload
          folder="verification/identity"
          label="Identity photo *"
          value={value.identityPhotoUrl}
          onChange={(url) => onChange({ identityPhotoUrl: url })}
        />
      </div>
    </div>
  );
}
