import type {
  PartnerApplicationType,
  PartnerGeographicScope,
  PartnerOfferingType,
} from "@/lib/partner-application-options";

export interface PartnerApplicationFormData {
  applicant: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  };
  business: {
    companyName: string;
    website: string;
    instagram: string;
    tiktok: string;
    linkedin: string;
    address: string;
    additionalUrls: string[];
  };
  applicationType: PartnerApplicationType | "";
  wellnessAlignment: string;
  brandPartner: {
    businessCategory: string;
    partnershipInterests: string[];
    geographicScope: PartnerGeographicScope | "";
    offeringTypes: string[];
  };
  expert: {
    bio: string;
    expertTopics: string[];
    contentResourceTypes: string[];
  };
  ambassador: {
    bio: string;
  };
  foundation: {
    organizationName: string;
    representativeName: string;
    representativeTitle: string;
    phone: string;
    website: string;
    instagram: string;
    tiktok: string;
    linkedin: string;
    additionalUrls: string[];
    topics: string[];
    contentResourceTypes: string[];
    additionalInfo: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalRole: string;
    specialty: string;
    npiNumber: string;
    workCredentialPhotoUrl: string;
    identityPhotoUrl: string;
  };
}

export const EMPTY_PARTNER_APPLICATION_FORM: PartnerApplicationFormData = {
  applicant: {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  },
  business: {
    companyName: "",
    website: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    address: "",
    additionalUrls: [""],
  },
  applicationType: "",
  wellnessAlignment: "",
  brandPartner: {
    businessCategory: "",
    partnershipInterests: [],
    geographicScope: "",
    offeringTypes: [],
  },
  expert: {
    bio: "",
    expertTopics: [],
    contentResourceTypes: [],
  },
  ambassador: {
    bio: "",
  },
  foundation: {
    organizationName: "",
    representativeName: "",
    representativeTitle: "",
    phone: "",
    website: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    additionalUrls: [""],
    topics: [],
    contentResourceTypes: [],
    additionalInfo: "",
  },
  professional: {
    firstName: "",
    lastName: "",
    professionalRole: "",
    specialty: "",
    npiNumber: "",
    workCredentialPhotoUrl: "",
    identityPhotoUrl: "",
  },
};

export type BrandPartnerApplicationStatus = "pending" | "approved" | "rejected";

export type BrandPartnerApplication = {
  id: string;
  status: BrandPartnerApplicationStatus;
  applicationType: PartnerApplicationType;
  fullName: string;
  email: string;
  phone: string | null;
  representativeTitle: string | null;
  companyName: string;
  website: string | null;
  instagram: string;
  tiktok: string | null;
  linkedin: string | null;
  address: string | null;
  otherSocialMedia: string | null;
  wellnessAlignment: string;
  businessCategory: string | null;
  partnershipInterests: string[] | null;
  geographicScope: PartnerGeographicScope | null;
  deliveryTypes: string[] | null;
  offeringType: PartnerOfferingType | null;
  expertTopics: string[] | null;
  contentResourceTypes: string[] | null;
  message: string | null;
  userId: string | null;
  user?: {
    id: string;
    email: string | null;
    displayName: string | null;
    userType: string;
    firstName: string | null;
    lastName: string | null;
    professionalRole: string | null;
    specialty: string | null;
    npiNumber: string | null;
    phone: string | null;
    identityPhotoUrl: string | null;
    workCredentialPhotoUrl: string | null;
    applicationStatus: string;
    applicationSubmittedAt: string | null;
  } | null;
  discounts: Array<{
    id: string;
    title: string;
    description?: string | null;
    percentage: number;
    category: string;
    tier?: string | null;
    isPublished: boolean;
    claimLink?: string | null;
    image?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeBrandPartnerApplication(
  raw: BrandPartnerApplication,
): BrandPartnerApplication {
  return {
    ...raw,
    partnershipInterests: parseStringArray(raw.partnershipInterests),
    deliveryTypes: parseStringArray(raw.deliveryTypes),
    expertTopics: parseStringArray(raw.expertTopics),
    contentResourceTypes: parseStringArray(raw.contentResourceTypes),
  };
}

export function parseAdditionalUrls(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

export function serializeAdditionalUrls(urls: string[]): string | undefined {
  const trimmed = urls.map((url) => url.trim()).filter(Boolean);
  return trimmed.length > 0 ? trimmed.join("\n") : undefined;
}

/**
 * Reverse of `toPartnerApplicationPayload` — seeds the form with a previous
 * (typically rejected) application so the applicant can fix and resubmit
 * instead of starting from a blank form. Password fields are left blank;
 * `ensureApplicantSignedIn` skips re-authentication when already signed in
 * as the applicant's email.
 */
export function fromBrandPartnerApplication(
  app: BrandPartnerApplication,
): PartnerApplicationFormData {
  const additionalUrls = parseAdditionalUrls(app.otherSocialMedia);
  const isExpert = app.applicationType === "expert";
  const isAmbassador = app.applicationType === "ambassador";
  const isFoundation = app.applicationType === "foundation";

  return {
    applicant: {
      fullName: isFoundation ? "" : app.fullName,
      email: app.email,
      phone: app.phone ?? "",
      password: "",
      confirmPassword: "",
    },
    business: {
      companyName: isFoundation ? "" : app.companyName,
      website: app.website ?? "",
      instagram: app.instagram ?? "",
      tiktok: app.tiktok ?? "",
      linkedin: app.linkedin ?? "",
      address: app.address ?? "",
      additionalUrls: additionalUrls.length ? additionalUrls : [""],
    },
    applicationType: app.applicationType,
    wellnessAlignment: !isExpert && !isAmbassador ? app.wellnessAlignment ?? "" : "",
    brandPartner: {
      businessCategory: app.businessCategory ?? "",
      partnershipInterests: app.partnershipInterests ?? [],
      geographicScope: app.geographicScope ?? "",
      offeringTypes: app.deliveryTypes ?? [],
    },
    expert: {
      bio: isExpert ? app.wellnessAlignment ?? "" : "",
      expertTopics: app.expertTopics ?? [],
      contentResourceTypes: app.contentResourceTypes ?? [],
    },
    ambassador: {
      bio: isAmbassador ? app.wellnessAlignment ?? "" : "",
    },
    foundation: {
      organizationName: isFoundation ? app.companyName : "",
      representativeName: isFoundation ? app.fullName : "",
      representativeTitle: app.representativeTitle ?? "",
      phone: isFoundation ? app.phone ?? "" : "",
      website: isFoundation ? app.website ?? "" : "",
      instagram: isFoundation ? app.instagram ?? "" : "",
      tiktok: isFoundation ? app.tiktok ?? "" : "",
      linkedin: isFoundation ? app.linkedin ?? "" : "",
      additionalUrls: isFoundation && additionalUrls.length ? additionalUrls : [""],
      topics: isFoundation ? app.expertTopics ?? [] : [],
      contentResourceTypes: isFoundation ? app.contentResourceTypes ?? [] : [],
      additionalInfo: isFoundation ? app.message ?? "" : "",
    },
    professional: {
      firstName: app.user?.firstName ?? "",
      lastName: app.user?.lastName ?? "",
      professionalRole: app.user?.professionalRole ?? "",
      specialty: app.user?.specialty ?? "",
      npiNumber: app.user?.npiNumber ?? "",
      workCredentialPhotoUrl: app.user?.workCredentialPhotoUrl ?? "",
      identityPhotoUrl: app.user?.identityPhotoUrl ?? "",
    },
  };
}

export function toPartnerApplicationPayload(form: PartnerApplicationFormData) {
  const applicationType = form.applicationType as PartnerApplicationType;
  const isBrandPartner = applicationType === "brand_partner";
  const isHealthcareApplicant =
    applicationType === "expert" || applicationType === "ambassador";
  const applicantFullName = isHealthcareApplicant
    ? [form.professional.firstName, form.professional.lastName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ")
    : form.applicant.fullName.trim();

  const payload: Record<string, unknown> = {
    applicant: {
      fullName: applicantFullName,
      email: form.applicant.email.trim().toLowerCase(),
      phone: form.applicant.phone.trim() || undefined,
    },
    business: isBrandPartner
      ? {
          companyName: form.business.companyName.trim(),
          website: form.business.website.trim() || undefined,
          instagram: form.business.instagram.trim(),
          tiktok: form.business.tiktok.trim() || undefined,
          linkedin: form.business.linkedin.trim() || undefined,
          address: form.business.address.trim() || undefined,
          otherSocialMedia: serializeAdditionalUrls(form.business.additionalUrls),
        }
      : {
          companyName: applicantFullName,
          instagram: form.business.instagram.trim(),
          tiktok: form.business.tiktok.trim() || undefined,
          linkedin: form.business.linkedin.trim() || undefined,
          otherSocialMedia: serializeAdditionalUrls(form.business.additionalUrls),
        },
    applicationType,
    wellnessAlignment: isBrandPartner ? form.wellnessAlignment.trim() : "",
  };

  if (applicationType === "brand_partner") {
    payload.brandPartner = {
      businessCategory: form.brandPartner.businessCategory.trim(),
      partnershipInterests: form.brandPartner.partnershipInterests,
      geographicScope: form.brandPartner.geographicScope,
      deliveryTypes: form.brandPartner.offeringTypes,
    };
  }

  if (applicationType === "expert") {
    payload.expert = {
      bio: form.expert.bio.trim(),
      expertTopics: form.expert.expertTopics,
      contentResourceTypes: form.expert.contentResourceTypes,
    };
  }

  if (applicationType === "ambassador") {
    payload.ambassador = {
      bio: form.ambassador.bio.trim(),
    };
  }

  if (applicationType === "foundation") {
    const f = form.foundation;
    payload.applicant = {
      fullName: f.representativeName.trim(),
      email: form.applicant.email.trim().toLowerCase(),
      phone: f.phone.trim() || undefined,
    };
    payload.business = {
      companyName: f.organizationName.trim(),
      website: f.website.trim(),
      instagram: f.instagram.trim() || undefined,
      tiktok: f.tiktok.trim() || undefined,
      linkedin: f.linkedin.trim() || undefined,
      otherSocialMedia: serializeAdditionalUrls(f.additionalUrls),
    };
    payload.foundation = {
      representativeTitle: f.representativeTitle.trim(),
      topics: f.topics,
      contentResourceTypes: f.contentResourceTypes,
      additionalInfo: f.additionalInfo.trim() || undefined,
    };
  }

  return payload;
}
