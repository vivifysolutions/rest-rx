export type NpiRequirement = "required" | "optional" | "none";

export type ProfessionalRole = {
  label: string;
  npi: NpiRequirement;
};

/** Matches rest-and-rx/mobile/components/signup/signupConstants.ts */
export const PROFESSIONAL_ROLES: readonly ProfessionalRole[] = [
  { label: "Healthcare Student", npi: "optional" },
  { label: "Attending Physician", npi: "required" },
  { label: "Resident / Fellow Physician", npi: "required" },
  { label: "Podiatry Resident", npi: "required" },
  { label: "Pharmacist", npi: "required" },
  { label: "Dentist", npi: "required" },
  { label: "Dental Hygienist", npi: "required" },
  { label: "Veterinarian", npi: "none" },
  { label: "Veterinary Technician", npi: "none" },
  { label: "Registered Nurse", npi: "required" },
  { label: "LPN / LVN", npi: "required" },
  { label: "Nurse Practitioner", npi: "required" },
  { label: "Certified Nurse Midwife", npi: "required" },
  { label: "CRNA", npi: "required" },
  { label: "Physician Assistant", npi: "required" },
  { label: "Respiratory Therapist", npi: "required" },
  { label: "Physical Therapist", npi: "required" },
  { label: "Occupational Therapist", npi: "required" },
  { label: "Speech-Language Pathologist", npi: "required" },
  { label: "Medical Technologist", npi: "required" },
  { label: "Sonographer", npi: "required" },
  { label: "Radiographer", npi: "required" },
  { label: "Dietitian", npi: "required" },
  { label: "Psychologist", npi: "required" },
  { label: "Social Worker", npi: "required" },
  { label: "Case Manager", npi: "required" },
  { label: "Paramedic / EMT", npi: "required" },
  { label: "Medical Assistant", npi: "optional" },
  { label: "Patient Care Technician / Nurse's Aide", npi: "optional" },
  { label: "Medical Scribe", npi: "none" },
  { label: "Epidemiologist", npi: "optional" },
  { label: "Retired Healthcare Professional", npi: "optional" },
] as const;

export const PROFESSIONAL_ROLE_OPTIONS = PROFESSIONAL_ROLES.map((role) => role.label);

export function getNpiRequirement(roleLabel: string): NpiRequirement {
  return PROFESSIONAL_ROLES.find((role) => role.label === roleLabel)?.npi ?? "none";
}
