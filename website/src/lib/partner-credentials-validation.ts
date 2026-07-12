import { getNpiRequirement } from "@/lib/professionalRoles";

export type ProfessionalCredentialsFields = {
  firstName: string;
  lastName: string;
  professionalRole: string;
  specialty: string;
  npiNumber: string;
  workCredentialPhotoUrl: string;
  identityPhotoUrl: string;
};

export function validateProfessionalCredentials(
  fields: ProfessionalCredentialsFields,
): string | null {
  if (!fields.firstName.trim()) return "Enter your first name.";
  if (!fields.lastName.trim()) return "Enter your last name.";
  if (!fields.professionalRole) return "Select your professional role.";

  const npiRequirement = getNpiRequirement(fields.professionalRole);
  const npiClean = fields.npiNumber.replace(/\D/g, "");
  if (npiRequirement === "required" && npiClean.length !== 10) {
    return "Enter a valid 10-digit NPI number.";
  }
  if (npiRequirement === "optional" && npiClean.length > 0 && npiClean.length !== 10) {
    return "Enter a valid 10-digit NPI number or leave it blank.";
  }
  if (!fields.workCredentialPhotoUrl.trim()) {
    return "Upload a photo of your work credential (badge, license, or employee ID).";
  }
  if (!fields.identityPhotoUrl.trim()) {
    return "Upload a verification photo of yourself.";
  }
  return null;
}

export function professionalCredentialsToProfilePayload(fields: ProfessionalCredentialsFields) {
  const npiRequirement = getNpiRequirement(fields.professionalRole);
  const npiClean = fields.npiNumber.replace(/\D/g, "");
  const firstName = fields.firstName.trim();
  const lastName = fields.lastName.trim();

  return {
    firstName,
    lastName,
    professionalRole: fields.professionalRole,
    specialty: fields.specialty.trim() || undefined,
    npiNumber:
      npiRequirement !== "none" && npiClean.length === 10 ? npiClean : undefined,
    workCredentialPhotoUrl: fields.workCredentialPhotoUrl.trim(),
    identityPhotoUrl: fields.identityPhotoUrl.trim(),
  };
}
