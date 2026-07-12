"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import {
  ApiError,
  getCategories,
  getMe,
  getTopics,
  markApplicationSubmitted,
  patchMe,
  submitBrandPartnerApplication,
} from "@/lib/api";
import {
  APP_DISCOUNT_TIER_DETAILS,
  APP_PARTNERSHIP_PRICING_NOTE,
  CUSTOM_PARTNERSHIP_OPTION,
  EXPERT_CONTENT_RESOURCE_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  OFFERING_OPTIONS,
  PARTNERSHIP_PATHWAYS,
  PARTNER_DISCOVERY_CALL_URL,
  PRODUCT_PARTNERSHIP_OPTIONS,
  buildPartnershipInterests,
  getAppDiscountTier,
  getProductPartnerships,
  hasCustomPartnership,
  labelApplicationType,
  labelGeographicScope,
  labelOfferingOption,
  labelPartnershipInterest,
  type PartnerApplicationType,
} from "@/lib/partner-application-options";
import {
  EMPTY_PARTNER_APPLICATION_FORM,
  toPartnerApplicationPayload,
  type PartnerApplicationFormData,
} from "@/lib/brand-partner-application";
import {
  professionalCredentialsToProfilePayload,
  validateProfessionalCredentials,
} from "@/lib/partner-credentials-validation";
import { PartnerProfessionalCredentialsFields } from "@/components/partner/PartnerProfessionalCredentialsFields";

const STEP_DESCRIPTIONS: Record<string, string> = {
  "Partnership type":
    "Choose whether you're offering member discounts, contributing as a wellness expert, joining as an ambassador, or representing a foundation or nonprofit.",
  "Your account":
    "Create your login. Brand partners, experts, and non-profit organizations use the web portal after approval; ambassadors use the mobile app.",
  "Organization & contact":
    "Tell us about your non-profit organization or foundation and who we should connect with.",
  "Business basics": "Tell us about your company so we can prepare for your discovery call.",
  "Professional credentials":
    "Verify your healthcare role the same way members do in the mobile app — role, NPI when applicable, and photo uploads.",
  Details: "A few more questions based on how you'd like to partner.",
  Review: "Double-check everything before you submit.",
};

function isFoundationType(applicationType: PartnerApplicationType | ""): boolean {
  return applicationType === "foundation";
}

function needsProfessionalCredentials(applicationType: PartnerApplicationType | ""): boolean {
  return applicationType === "expert" || applicationType === "ambassador";
}

function getSteps(applicationType: PartnerApplicationType | ""): string[] {
  if (isFoundationType(applicationType)) {
    return [
      "Partnership type",
      "Organization & contact",
      "Your account",
      "Details",
      "Review",
    ];
  }

  const steps = ["Partnership type", "Your account"];
  if (applicationType === "brand_partner") {
    steps.push("Business basics");
  }
  if (needsProfessionalCredentials(applicationType)) {
    steps.push("Professional credentials");
  }
  steps.push("Details", "Review");
  return steps;
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckboxGroup({
  legend,
  name,
  required,
  options,
  values,
  onChange,
  cardStyle = false,
}: {
  legend: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string; description?: string }[];
  values: string[];
  onChange: (next: string[]) => void;
  cardStyle?: boolean;
}) {
  return (
    <fieldset className="admin-form-fieldset">
      <legend className="admin-form-legend">
        {legend}
        {required ? " *" : ""}
      </legend>
      <div className={`admin-form-choice-list${cardStyle ? " admin-form-choice-list--cards" : ""}`}>
        {options.map((option) => (
          <label key={option.value} className={`admin-form-choice${cardStyle ? " partner-choice-card" : ""}`}>
            <input
              type="checkbox"
              name={name}
              checked={values.includes(option.value)}
              onChange={() => onChange(toggleInList(values, option.value))}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description ? (
                <span className="admin-form-choice-desc">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RadioGroup({
  legend,
  name,
  required,
  options,
  value,
  onChange,
  cardStyle = false,
}: {
  legend: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (next: string) => void;
  cardStyle?: boolean;
}) {
  return (
    <fieldset className="admin-form-fieldset">
      <legend className="admin-form-legend">
        {legend}
        {required ? " *" : ""}
      </legend>
      <div className={`admin-form-choice-list${cardStyle ? " admin-form-choice-list--cards" : ""}`}>
        {options.map((option) => (
          <label key={option.value} className={`admin-form-choice${cardStyle ? " partner-choice-card" : ""}`}>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description ? (
                <span className="admin-form-choice-desc">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PartnershipPathwaysOverview() {
  return (
    <details className="partner-pathways-overview">
      <summary>Learn about our partnership pathways</summary>
      <div className="partner-pathways-overview-body">
        <p className="partner-pathways-overview-lead">
          Currently, we offer three primary partnership pathways:
        </p>
        <ul className="partner-pathways-list">
          {PARTNERSHIP_PATHWAYS.map((pathway) => (
            <li key={pathway.title}>
              <strong>{pathway.title}</strong>
              <p>{pathway.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function AppDiscountTierSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (tier: string) => void;
}) {
  return (
    <fieldset className="admin-form-fieldset">
      <legend className="admin-form-legend">Which app partnership tier interests you? *</legend>
      <p className="partner-form-hint">{APP_PARTNERSHIP_PRICING_NOTE}</p>
      <div className="admin-form-choice-list admin-form-choice-list--cards partner-tier-list">
        {APP_DISCOUNT_TIER_DETAILS.map((tier) => (
          <div
            key={tier.value}
            className={`partner-tier-card${value === tier.value ? " partner-tier-card--selected" : ""}`}
          >
            <label className="admin-form-choice partner-choice-card partner-tier-select">
              <input
                type="radio"
                name="appDiscountTier"
                checked={value === tier.value}
                onChange={() => onChange(tier.value)}
              />
              <span>
                <strong>{tier.label}</strong>
                <span className="admin-form-choice-desc">{tier.summary}</span>
              </span>
            </label>
            <details
              className="partner-tier-details"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <summary>View tier details</summary>
              <div className="partner-tier-details-body">
                <p>{tier.intro}</p>
                <p className="partner-tier-includes-heading">Includes:</p>
                <ul>
                  {tier.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {tier.note ? <p className="partner-tier-note">{tier.note}</p> : null}
              </div>
            </details>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function SocialProfileFields({
  instagram,
  tiktok,
  linkedin,
  additionalUrls,
  onUpdate,
  onUpdateAdditionalUrl,
  onAddAdditionalUrl,
  onRemoveAdditionalUrl,
  linkedinPlaceholder = "https://linkedin.com/in/your-profile",
  requireInstagram = true,
}: {
  instagram: string;
  tiktok: string;
  linkedin: string;
  additionalUrls: string[];
  onUpdate: (patch: Partial<PartnerApplicationFormData["business"]>) => void;
  onUpdateAdditionalUrl: (index: number, value: string) => void;
  onAddAdditionalUrl: () => void;
  onRemoveAdditionalUrl: (index: number) => void;
  linkedinPlaceholder?: string;
  requireInstagram?: boolean;
}) {
  return (
    <>
      <label>
        Instagram{requireInstagram ? " *" : ""}
        <input
          type="url"
          value={instagram}
          onChange={(e) => onUpdate({ instagram: e.target.value })}
          placeholder="https://instagram.com/username"
          required={requireInstagram}
        />
      </label>
      <label>
        TikTok
        <input
          type="url"
          value={tiktok}
          onChange={(e) => onUpdate({ tiktok: e.target.value })}
          placeholder="https://tiktok.com/@username"
        />
      </label>
      <label>
        LinkedIn
        <input
          type="url"
          value={linkedin}
          onChange={(e) => onUpdate({ linkedin: e.target.value })}
          placeholder={linkedinPlaceholder}
        />
      </label>
      <fieldset className="admin-form-fieldset">
        <legend className="admin-form-legend">Other URLs</legend>
        <p className="partner-form-hint" style={{ marginTop: 0 }}>
          Add any other links you&apos;d like us to know about (YouTube, Facebook, etc.).
        </p>
        {additionalUrls.map((url, index) => (
          <div key={index} className="partner-url-row">
            <input
              type="url"
              value={url}
              onChange={(e) => onUpdateAdditionalUrl(index, e.target.value)}
              placeholder="https://"
            />
            {additionalUrls.length > 1 && (
              <button
                type="button"
                className="admin-btn"
                onClick={() => onRemoveAdditionalUrl(index)}
                aria-label="Remove URL"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="admin-btn" onClick={onAddAdditionalUrl}>
          Add another URL
        </button>
      </fieldset>
    </>
  );
}

export default function BrandPartnerApplicationForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<PartnerApplicationFormData>(EMPTY_PARTNER_APPLICATION_FORM);
  const [discountCategories, setDiscountCategories] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [forumTopics, setForumTopics] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [interestedInAppDiscounts, setInterestedInAppDiscounts] = useState(false);

  const steps = getSteps(form.applicationType);
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    if (step !== "Details") return;

    if (form.applicationType === "brand_partner") {
      getCategories("DISCOUNT")
        .then((categories) => {
          setDiscountCategories(categories.map((c) => ({ value: c.name, label: c.name })));
        })
        .catch(() => {
          setDiscountCategories([]);
        });
    }

    if (form.applicationType === "expert") {
      getTopics()
        .then((topics) => {
          setForumTopics(
            topics.map((topic) => ({
              value: topic.name,
              label: topic.name,
              description: topic.description ?? undefined,
            })),
          );
        })
        .catch(() => {
          setForumTopics([]);
        });
    }

    if (form.applicationType === "foundation") {
      getTopics()
        .then((topics) => {
          setForumTopics(
            topics.map((topic) => ({
              value: topic.name,
              label: topic.name,
              description: topic.description ?? undefined,
            })),
          );
        })
        .catch(() => {
          setForumTopics([]);
        });
    }
  }, [step, form.applicationType]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

  function updateApplicant(patch: Partial<PartnerApplicationFormData["applicant"]>) {
    setForm((prev) => {
      const applicant = { ...prev.applicant, ...patch };
      const credentialsChanged =
        ("email" in patch && patch.email !== prev.applicant.email) ||
        ("password" in patch && patch.password !== prev.applicant.password);

      if (!credentialsChanged) {
        return { ...prev, applicant };
      }

      return {
        ...prev,
        applicant,
        professional: {
          ...prev.professional,
          workCredentialPhotoUrl: "",
          identityPhotoUrl: "",
        },
      };
    });
  }

  async function ensureApplicantSignedIn(): Promise<string> {
    const email = form.applicant.email.trim().toLowerCase();
    const password = form.applicant.password;

    if (auth.currentUser?.email?.toLowerCase() === email) {
      const token = await auth.currentUser.getIdToken();
      await getMe(token);
      return token;
    }

    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (createErr) {
      const code =
        createErr && typeof createErr === "object" && "code" in createErr
          ? String((createErr as { code: string }).code)
          : "";
      if (code === "auth/email-already-in-use") {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        throw createErr;
      }
    }

    const token = await credential.user.getIdToken();
    await getMe(token);
    return token;
  }

  function updateBusiness(patch: Partial<PartnerApplicationFormData["business"]>) {
    setForm((prev) => ({ ...prev, business: { ...prev.business, ...patch } }));
  }

  function updateBrandPartner(patch: Partial<PartnerApplicationFormData["brandPartner"]>) {
    setForm((prev) => ({ ...prev, brandPartner: { ...prev.brandPartner, ...patch } }));
  }

  function updatePartnershipInterests(
    appTier: string,
    productPartnerships: string[],
    customPartnership: boolean,
  ) {
    updateBrandPartner({
      partnershipInterests: buildPartnershipInterests(
        appTier,
        productPartnerships,
        customPartnership,
      ),
    });
  }

  function setAppDiscountTier(tier: string) {
    const interests = form.brandPartner.partnershipInterests;
    updatePartnershipInterests(
      tier,
      getProductPartnerships(interests),
      hasCustomPartnership(interests),
    );
  }

  function handleAppDiscountInterestChange(interested: boolean) {
    setInterestedInAppDiscounts(interested);
    const interests = form.brandPartner.partnershipInterests;
    if (!interested) {
      updatePartnershipInterests(
        "",
        getProductPartnerships(interests),
        hasCustomPartnership(interests),
      );
    }
  }

  function setProductPartnerships(products: string[]) {
    const interests = form.brandPartner.partnershipInterests;
    updatePartnershipInterests(
      getAppDiscountTier(interests),
      products,
      hasCustomPartnership(interests),
    );
  }

  function setCustomPartnership(checked: boolean) {
    const interests = form.brandPartner.partnershipInterests;
    updatePartnershipInterests(
      getAppDiscountTier(interests),
      getProductPartnerships(interests),
      checked,
    );
  }

  function updateExpert(patch: Partial<PartnerApplicationFormData["expert"]>) {
    setForm((prev) => ({ ...prev, expert: { ...prev.expert, ...patch } }));
  }

  function updateAmbassador(patch: Partial<PartnerApplicationFormData["ambassador"]>) {
    setForm((prev) => ({ ...prev, ambassador: { ...prev.ambassador, ...patch } }));
  }

  function updateFoundation(patch: Partial<PartnerApplicationFormData["foundation"]>) {
    setForm((prev) => ({ ...prev, foundation: { ...prev.foundation, ...patch } }));
  }

  function updateFoundationAdditionalUrl(index: number, value: string) {
    setForm((prev) => {
      const additionalUrls = [...prev.foundation.additionalUrls];
      additionalUrls[index] = value;
      return { ...prev, foundation: { ...prev.foundation, additionalUrls } };
    });
  }

  function addFoundationAdditionalUrl() {
    setForm((prev) => ({
      ...prev,
      foundation: {
        ...prev.foundation,
        additionalUrls: [...prev.foundation.additionalUrls, ""],
      },
    }));
  }

  function removeFoundationAdditionalUrl(index: number) {
    setForm((prev) => {
      const additionalUrls = prev.foundation.additionalUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        foundation: {
          ...prev.foundation,
          additionalUrls: additionalUrls.length > 0 ? additionalUrls : [""],
        },
      };
    });
  }

  function updateProfessional(patch: Partial<PartnerApplicationFormData["professional"]>) {
    setForm((prev) => ({ ...prev, professional: { ...prev.professional, ...patch } }));
  }

  function validateAccountStep(): string | null {
    if (!form.applicant.email.trim()) return "Enter your email.";
    if (needsProfessionalCredentials(form.applicationType)) {
      const phoneDigits = form.applicant.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) return "Enter a 10-digit phone number.";
    }
    if (form.applicant.password.length < 6) return "Password must be at least 6 characters.";
    if (form.applicant.password !== form.applicant.confirmPassword) {
      return "Passwords do not match.";
    }
    if (!needsProfessionalCredentials(form.applicationType) &&
      !isFoundationType(form.applicationType) &&
      !form.applicant.fullName.trim()) {
      return "Enter your full name.";
    }
    return null;
  }

  function validateStep(): string | null {
    if (step === "Partnership type") {
      if (!form.applicationType) return "Select how you would like to partner with Rest & Rx.";
      return null;
    }

    if (step === "Your account") {
      return validateAccountStep();
    }

    if (step === "Business basics") {
      if (form.applicationType !== "brand_partner") return null;
      if (!form.business.companyName.trim()) return "Enter your company or business name.";
      if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
      return null;
    }

    if (step === "Organization & contact") {
      if (!isFoundationType(form.applicationType)) return null;
      const f = form.foundation;
      if (!f.organizationName.trim()) return "Enter your organization name.";
      if (!f.representativeName.trim()) return "Enter the representative name.";
      if (!f.representativeTitle.trim()) return "Enter the representative title.";
      if (!f.website.trim()) return "Enter your organization website.";
      return null;
    }

    if (step === "Professional credentials") {
      return validateProfessionalCredentials(form.professional);
    }

    if (step === "Details") {
      if (form.applicationType === "brand_partner") {
        const bp = form.brandPartner;
        if (!bp.businessCategory.trim()) return "Select your business category.";
        if (
          interestedInAppDiscounts &&
          !getAppDiscountTier(bp.partnershipInterests)
        ) {
          return "Select an app discount partnership tier.";
        }
        if (!bp.partnershipInterests.length) {
          return "Select at least one partnership option you are interested in.";
        }
        if (!bp.geographicScope) return "Select your geographic reach.";
        if (!bp.offeringTypes.length) return "Select at least one offering.";
      }
      if (form.applicationType === "expert") {
        if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
        if (!form.expert.bio.trim()) return "Enter your expert bio.";
        if (!form.expert.expertTopics.length) return "Select at least one forum topic.";
        if (!form.expert.contentResourceTypes.length) {
          return "Select at least one content/resource type you can contribute.";
        }
      }
      if (form.applicationType === "ambassador") {
        if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
        if (!form.ambassador.bio.trim()) return "Tell us why you'd like to be an ambassador.";
      }
      if (form.applicationType === "foundation") {
        if (!form.foundation.topics.length) return "Select at least one topic.";
        if (!form.foundation.contentResourceTypes.length) {
          return "Select at least one resource type.";
        }
      }
      const wellnessError = validateWellnessAlignment();
      if (wellnessError) return wellnessError;
      return null;
    }

    return null;
  }

  function validateWellnessAlignment(): string | null {
    if (form.applicationType === "brand_partner" && !form.wellnessAlignment.trim()) {
      return "Tell us why your brand aligns with healthcare worker wellness.";
    }
    return null;
  }

  function validateAll(): string | null {
    for (const stepName of steps.slice(0, -1)) {
      if (stepName === "Partnership type") {
        if (!form.applicationType) return "Select how you would like to partner with Rest & Rx.";
        continue;
      }
      if (stepName === "Your account") {
        const accountError = validateAccountStep();
        if (accountError) return accountError;
        continue;
      }
      if (stepName === "Organization & contact") {
        if (!isFoundationType(form.applicationType)) continue;
        const f = form.foundation;
        if (!f.organizationName.trim()) return "Enter your organization name.";
        if (!f.representativeName.trim()) return "Enter the representative name.";
        if (!f.representativeTitle.trim()) return "Enter the representative title.";
        if (!f.website.trim()) return "Enter your organization website.";
        continue;
      }
      if (stepName === "Business basics") {
        if (form.applicationType !== "brand_partner") continue;
        if (!form.business.companyName.trim()) return "Enter your company or business name.";
        if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
        continue;
      }
      if (stepName === "Professional credentials") {
        const credentialsError = validateProfessionalCredentials(form.professional);
        if (credentialsError) return credentialsError;
        continue;
      }
      if (stepName === "Details") {
        if (form.applicationType === "brand_partner") {
          const bp = form.brandPartner;
          if (!bp.businessCategory.trim()) return "Select your business category.";
          if (
            interestedInAppDiscounts &&
            !getAppDiscountTier(bp.partnershipInterests)
          ) {
            return "Select an app discount partnership tier.";
          }
          if (!bp.partnershipInterests.length) {
            return "Select at least one partnership option you are interested in.";
          }
          if (!bp.geographicScope) return "Select your geographic reach.";
          if (!bp.offeringTypes.length) return "Select at least one offering.";
        }
        if (form.applicationType === "expert") {
          if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
          if (!form.expert.bio.trim()) return "Enter your expert bio.";
          if (!form.expert.expertTopics.length) return "Select at least one forum topic.";
          if (!form.expert.contentResourceTypes.length) {
            return "Select at least one content/resource type you can contribute.";
          }
        }
        if (form.applicationType === "ambassador") {
          if (!form.business.instagram.trim()) return "Enter your Instagram URL.";
          if (!form.ambassador.bio.trim()) return "Tell us why you'd like to be an ambassador.";
        }
        if (form.applicationType === "foundation") {
          if (!form.foundation.topics.length) return "Select at least one topic.";
          if (!form.foundation.contentResourceTypes.length) {
            return "Select at least one resource type.";
          }
        }
        const wellnessError = validateWellnessAlignment();
        if (wellnessError) return wellnessError;
      }
    }
    return null;
  }

  function updateAdditionalUrl(index: number, value: string) {
    setForm((prev) => {
      const additionalUrls = [...prev.business.additionalUrls];
      additionalUrls[index] = value;
      return { ...prev, business: { ...prev.business, additionalUrls } };
    });
  }

  function addAdditionalUrl() {
    setForm((prev) => ({
      ...prev,
      business: { ...prev.business, additionalUrls: [...prev.business.additionalUrls, ""] },
    }));
  }

  function removeAdditionalUrl(index: number) {
    setForm((prev) => {
      const additionalUrls = prev.business.additionalUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        business: {
          ...prev.business,
          additionalUrls: additionalUrls.length > 0 ? additionalUrls : [""],
        },
      };
    });
  }

  async function handleSubmit() {
    const validationError = validateAll();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let token: string;

      if (needsProfessionalCredentials(form.applicationType)) {
        token = await ensureApplicantSignedIn();
        await patchMe(token, {
          ...professionalCredentialsToProfilePayload(form.professional),
          phone: form.applicant.phone.trim() || undefined,
        });
        await markApplicationSubmitted(token);
      } else {
        token = await ensureApplicantSignedIn();
      }

      await submitBrandPartnerApplication(token, toPartnerApplicationPayload(form));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (step === "Your account" && needsProfessionalCredentials(form.applicationType)) {
      setStepLoading(true);
      try {
        await ensureApplicantSignedIn();
        setStepIndex((i) => i + 1);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : getFirebaseAuthErrorMessage(err));
      } finally {
        setStepLoading(false);
      }
      return;
    }

    setStepIndex((i) => i + 1);
  }

  if (submitted) {
    const isAmbassador = form.applicationType === "ambassador";
    const isFoundation = isFoundationType(form.applicationType);

    return (
      <div className="partner-success-layout">
        <div className="admin-card partner-success-card">
          <div className="partner-success-icon" aria-hidden>
            ✓
          </div>
          <h2 className="font-subheading">Application submitted</h2>
          {isFoundation ? (
            <>
              <p>
                Thanks for applying. Your portal account has been created. Once approved, sign in
                at the <Link href="/portal/login">portal</Link> to upload and manage your
                organization&apos;s content.
              </p>
              <p>
                Our team will review your application and email you when a decision is made. You
                can optionally book a discovery call below.
              </p>
            </>
          ) : isAmbassador ? (
            <>
              <p>
                Thanks for applying to be a Rest &amp; Rx ambassador. Our team will review your
                application and email you when a decision is made.
              </p>
              <p>
                Once approved, download the Rest &amp; Rx mobile app and sign in with the email and
                password you just created.
              </p>
            </>
          ) : (
            <>
              <p>
                Thanks for applying. Your portal account has been created. Book your discovery call
                below — our team will review your application afterward.
              </p>
              <p>
                Once approved, sign in at the{" "}
                <Link href="/portal/login">portal</Link>. You&apos;ll be taken to the right workspace
                for your account type.
              </p>
            </>
          )}
        </div>

        {!isAmbassador && (
          <div className="admin-card partner-booking-card">
            <h3 className="partner-booking-title">
              {isFoundation ? "Optional: book a discovery call" : "Book your discovery call"}
            </h3>
            <p className="partner-form-hint">
              {isFoundation ? (
                <>
                  If you&apos;d like to talk with our team, pick a time below. This step is
                  optional — or{" "}
                </>
              ) : (
                <>Pick a time that works for you. If the scheduler doesn&apos;t load, </>
              )}
              <a href={PARTNER_DISCOVERY_CALL_URL} target="_blank" rel="noopener noreferrer">
                open the booking page
              </a>
              .
            </p>
            <iframe
              src={PARTNER_DISCOVERY_CALL_URL}
              title="Book a Rest & Rx discovery call"
              className="partner-booking-embed"
              loading="lazy"
            />
          </div>
        )}
      </div>
    );
  }

  function renderStepContent() {
    if (step === "Partnership type") {
      return (
        <div className="partner-application-form admin-form">
          <p className="partner-form-hint">
            Are you offering business discounts to members, contributing as a wellness expert,
            joining as a community ambassador, or representing a foundation or nonprofit?
          </p>
          <RadioGroup
            legend="How would you like to partner?"
            name="applicationType"
            required
            cardStyle
            value={form.applicationType}
            onChange={(value) => {
              const nextType = value as PartnerApplicationType;
              setForm((prev) => ({
                ...prev,
                applicationType: nextType,
              }));
              if (stepIndex >= getSteps(nextType).length) {
                setStepIndex(Math.max(0, getSteps(nextType).length - 1));
              }
            }}
            options={[
              {
                value: "brand_partner",
                label: "Brand partner — offer discounts to healthcare professionals",
              },
              {
                value: "expert",
                label: "Expert contributor — share expertise, forum topics, and resources",
              },
              {
                value: "ambassador",
                label: "Ambassador — represent Rest & Rx in the community",
              },
              {
                value: "foundation",
                label:
                  "Non-profit Organization / foundation — share mission-aligned resources and content",
              },
            ]}
          />
        </div>
      );
    }

    if (step === "Your account") {
      const healthcareApplicant = needsProfessionalCredentials(form.applicationType);
      const foundationApplicant = isFoundationType(form.applicationType);
      return (
        <div className="partner-application-form admin-form">
          {!healthcareApplicant && !foundationApplicant && (
            <label>
              Your full name *
              <input
                value={form.applicant.fullName}
                onChange={(e) => updateApplicant({ fullName: e.target.value })}
                required
              />
            </label>
          )}
          {foundationApplicant && (
            <p className="partner-form-hint" style={{ marginTop: 0 }}>
              Create your portal login. After approval, use this account to upload and manage your
              organization&apos;s content.
            </p>
          )}
          <label>
            Email *
            <input
              type="email"
              value={form.applicant.email}
              onChange={(e) => updateApplicant({ email: e.target.value })}
              required
            />
          </label>
          <label>
            Phone{healthcareApplicant ? " *" : ""}
            <input
              type="tel"
              value={form.applicant.phone}
              onChange={(e) => updateApplicant({ phone: e.target.value })}
              required={healthcareApplicant}
              placeholder={healthcareApplicant ? "10-digit mobile number" : undefined}
            />
          </label>
          <label>
            {healthcareApplicant || foundationApplicant ? "Create password *" : "Create portal password *"}
            <input
              type="password"
              value={form.applicant.password}
              onChange={(e) => updateApplicant({ password: e.target.value })}
              minLength={6}
              required
            />
          </label>
          <label>
            Confirm password *
            <input
              type="password"
              value={form.applicant.confirmPassword}
              onChange={(e) => updateApplicant({ confirmPassword: e.target.value })}
              minLength={6}
              required
            />
          </label>
        </div>
      );
    }

    if (step === "Professional credentials") {
      if (!needsProfessionalCredentials(form.applicationType)) {
        return null;
      }
      return (
        <PartnerProfessionalCredentialsFields
          value={form.professional}
          onChange={updateProfessional}
        />
      );
    }

    if (step === "Organization & contact") {
      if (!isFoundationType(form.applicationType)) {
        return null;
      }
      const f = form.foundation;
      return (
        <div className="partner-application-form admin-form">
          <label>
            Organization name *
            <input
              value={f.organizationName}
              onChange={(e) => updateFoundation({ organizationName: e.target.value })}
              placeholder="Your foundation or nonprofit"
              required
            />
          </label>
          <div className="admin-form-row">
            <label>
              Representative name *
              <input
                value={f.representativeName}
                onChange={(e) => updateFoundation({ representativeName: e.target.value })}
                placeholder="Full name"
                required
              />
            </label>
            <label>
              Representative title *
              <input
                value={f.representativeTitle}
                onChange={(e) => updateFoundation({ representativeTitle: e.target.value })}
                placeholder="Director of Partnerships"
                required
              />
            </label>
          </div>
          <label>
            Phone
            <input
              type="tel"
              value={f.phone}
              onChange={(e) => updateFoundation({ phone: e.target.value })}
              placeholder="Optional"
            />
          </label>
          <label>
            Website *
            <input
              type="url"
              value={f.website}
              onChange={(e) => updateFoundation({ website: e.target.value })}
              placeholder="https://www.yourorganization.org"
              required
            />
          </label>
          <fieldset className="admin-form-fieldset">
            <legend className="admin-form-legend">Social profiles (optional)</legend>
            <SocialProfileFields
              instagram={f.instagram}
              tiktok={f.tiktok}
              linkedin={f.linkedin}
              additionalUrls={f.additionalUrls}
              requireInstagram={false}
              linkedinPlaceholder="https://linkedin.com/company/your-org"
              onUpdate={(patch) =>
                updateFoundation({
                  instagram: patch.instagram ?? f.instagram,
                  tiktok: patch.tiktok ?? f.tiktok,
                  linkedin: patch.linkedin ?? f.linkedin,
                })
              }
              onUpdateAdditionalUrl={updateFoundationAdditionalUrl}
              onAddAdditionalUrl={addFoundationAdditionalUrl}
              onRemoveAdditionalUrl={removeFoundationAdditionalUrl}
            />
          </fieldset>
        </div>
      );
    }

    if (step === "Business basics") {
      if (form.applicationType !== "brand_partner") {
        return null;
      }
      return (
        <div className="partner-application-form admin-form">
          <label>
            Company / business name *
            <input
              value={form.business.companyName}
              onChange={(e) => updateBusiness({ companyName: e.target.value })}
              placeholder="Enter your business name"
              required
            />
          </label>
          <label>
            Business website URL
            <input
              type="url"
              value={form.business.website}
              onChange={(e) => updateBusiness({ website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </label>
          <SocialProfileFields
            instagram={form.business.instagram}
            tiktok={form.business.tiktok}
            linkedin={form.business.linkedin}
            additionalUrls={form.business.additionalUrls}
            onUpdate={updateBusiness}
            onUpdateAdditionalUrl={updateAdditionalUrl}
            onAddAdditionalUrl={addAdditionalUrl}
            onRemoveAdditionalUrl={removeAdditionalUrl}
            linkedinPlaceholder="https://linkedin.com/company/your-brand"
          />
          <label>
            Address
            <input
              value={form.business.address}
              onChange={(e) => updateBusiness({ address: e.target.value })}
              placeholder="742 Evergreen Terrace, Springfield"
            />
          </label>
        </div>
      );
    }

    if (step === "Details" && form.applicationType === "brand_partner") {
      return (
        <div className="partner-application-form admin-form">
          <label>
            Business category *
            <select
              value={form.brandPartner.businessCategory}
              onChange={(e) => updateBrandPartner({ businessCategory: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {discountCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <PartnershipPathwaysOverview />

          <CheckboxGroup
            legend="Interested in offering discounts on the app?"
            name="interestedInAppDiscounts"
            cardStyle
            options={[
              {
                value: "app_discounts",
                label: "Yes, I'd like to offer discounts on the app",
              },
            ]}
            values={
              interestedInAppDiscounts ||
              Boolean(getAppDiscountTier(form.brandPartner.partnershipInterests))
                ? ["app_discounts"]
                : []
            }
            onChange={(values) =>
              handleAppDiscountInterestChange(values.includes("app_discounts"))
            }
          />

          {(interestedInAppDiscounts ||
            Boolean(getAppDiscountTier(form.brandPartner.partnershipInterests))) && (
            <AppDiscountTierSelect
              value={getAppDiscountTier(form.brandPartner.partnershipInterests)}
              onChange={setAppDiscountTier}
            />
          )}

          <CheckboxGroup
            legend="Interested in providing product (gifting or sponsoring) for:"
            name="productPartnerships"
            cardStyle
            options={PRODUCT_PARTNERSHIP_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              description: o.description,
            }))}
            values={getProductPartnerships(form.brandPartner.partnershipInterests)}
            onChange={setProductPartnerships}
          />

          <CheckboxGroup
            legend="Other partnership options"
            name="customPartnership"
            cardStyle
            options={[
              {
                value: CUSTOM_PARTNERSHIP_OPTION.value,
                label: CUSTOM_PARTNERSHIP_OPTION.label,
                description: CUSTOM_PARTNERSHIP_OPTION.description,
              },
            ]}
            values={
              hasCustomPartnership(form.brandPartner.partnershipInterests)
                ? [CUSTOM_PARTNERSHIP_OPTION.value]
                : []
            }
            onChange={(values) =>
              setCustomPartnership(values.includes(CUSTOM_PARTNERSHIP_OPTION.value))
            }
          />

          <RadioGroup
            legend="Are you:"
            name="geographicScope"
            required
            cardStyle
            value={form.brandPartner.geographicScope}
            onChange={(geographicScope) =>
              updateBrandPartner({
                geographicScope:
                  geographicScope as PartnerApplicationFormData["brandPartner"]["geographicScope"],
              })
            }
            options={GEOGRAPHIC_SCOPE_OPTIONS}
          />

          <CheckboxGroup
            legend="What are your offerings?"
            name="offeringTypes"
            required
            cardStyle
            options={OFFERING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            values={form.brandPartner.offeringTypes}
            onChange={(offeringTypes) => updateBrandPartner({ offeringTypes })}
          />

          <label>
            Why do you believe your brand aligns with healthcare worker wellness? *
            <textarea
              value={form.wellnessAlignment}
              onChange={(e) => setForm((prev) => ({ ...prev, wellnessAlignment: e.target.value }))}
              rows={4}
              required
            />
          </label>
        </div>
      );
    }

    if (step === "Details" && form.applicationType === "expert") {
      return (
        <div className="partner-application-form admin-form">
          <fieldset className="admin-form-fieldset">
            <legend className="admin-form-legend">Social profiles *</legend>
            <p className="partner-form-hint" style={{ marginTop: 0 }}>
              Share where members can find you and your work.
            </p>
            <SocialProfileFields
              instagram={form.business.instagram}
              tiktok={form.business.tiktok}
              linkedin={form.business.linkedin}
              additionalUrls={form.business.additionalUrls}
              onUpdate={updateBusiness}
              onUpdateAdditionalUrl={updateAdditionalUrl}
              onAddAdditionalUrl={addAdditionalUrl}
              onRemoveAdditionalUrl={removeAdditionalUrl}
            />
          </fieldset>

          <label>
            Your bio *
            <span className="partner-form-hint">
              Include who you are, what you do, and why you&apos;re qualified to speak on the forum
              topics you selected.
            </span>
            <textarea
              value={form.expert.bio}
              onChange={(e) => updateExpert({ bio: e.target.value })}
              rows={5}
              placeholder="Who you are, your professional background, and why members should trust your perspective on these topics…"
              required
            />
          </label>

          <CheckboxGroup
            legend="Forum topics you can speak to"
            name="expertTopics"
            required
            cardStyle
            options={forumTopics}
            values={form.expert.expertTopics}
            onChange={(expertTopics) => updateExpert({ expertTopics })}
          />

          <CheckboxGroup
            legend="Types of resources or content you can upload"
            name="contentResourceTypes"
            required
            cardStyle
            options={EXPERT_CONTENT_RESOURCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              description: option.description,
            }))}
            values={form.expert.contentResourceTypes}
            onChange={(contentResourceTypes) => updateExpert({ contentResourceTypes })}
          />
        </div>
      );
    }

    if (step === "Details" && form.applicationType === "foundation") {
      return (
        <div className="partner-application-form admin-form">
          <CheckboxGroup
            legend="Topics you'd like to contribute to"
            name="foundationTopics"
            required
            cardStyle
            options={forumTopics}
            values={form.foundation.topics}
            onChange={(topics) => updateFoundation({ topics })}
          />

          <CheckboxGroup
            legend="Types of resources you can provide"
            name="foundationResourceTypes"
            required
            cardStyle
            options={EXPERT_CONTENT_RESOURCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              description: option.description,
            }))}
            values={form.foundation.contentResourceTypes}
            onChange={(contentResourceTypes) => updateFoundation({ contentResourceTypes })}
          />

          <label>
            Additional information
            <span className="partner-form-hint">
              Share anything else that would help us understand your mission, audience, or
              partnership goals.
            </span>
            <textarea
              value={form.foundation.additionalInfo}
              onChange={(e) => updateFoundation({ additionalInfo: e.target.value })}
              rows={5}
              placeholder="Optional — mission, programs, audience, timeline, etc."
            />
          </label>
        </div>
      );
    }

    if (step === "Details" && form.applicationType === "ambassador") {
      return (
        <div className="partner-application-form admin-form">
          <fieldset className="admin-form-fieldset">
            <legend className="admin-form-legend">Social profiles *</legend>
            <p className="partner-form-hint" style={{ marginTop: 0 }}>
              Share where we can learn more about you and your community presence.
            </p>
            <SocialProfileFields
              instagram={form.business.instagram}
              tiktok={form.business.tiktok}
              linkedin={form.business.linkedin}
              additionalUrls={form.business.additionalUrls}
              onUpdate={updateBusiness}
              onUpdateAdditionalUrl={updateAdditionalUrl}
              onAddAdditionalUrl={addAdditionalUrl}
              onRemoveAdditionalUrl={removeAdditionalUrl}
            />
          </fieldset>

          <label>
            Why do you want to be a Rest &amp; Rx ambassador? *
            <span className="partner-form-hint">
              Tell us who you are, how you connect with healthcare workers, and how you&apos;d
              represent Rest &amp; Rx in your community.
            </span>
            <textarea
              value={form.ambassador.bio}
              onChange={(e) => updateAmbassador({ bio: e.target.value })}
              rows={5}
              required
              placeholder="Who you are, your background, and how you'd champion Rest & Rx…"
            />
          </label>
        </div>
      );
    }

    if (step === "Details" && !form.applicationType) {
      return (
        <p className="partner-form-hint">Go back and select a partnership type.</p>
      );
    }

    if (step === "Review") {
      const healthcareApplicant = needsProfessionalCredentials(form.applicationType);
      const isFoundation = isFoundationType(form.applicationType);
      const displayName = healthcareApplicant
        ? [form.professional.firstName, form.professional.lastName]
            .map((part) => part.trim())
            .filter(Boolean)
            .join(" ")
        : isFoundation
          ? form.foundation.organizationName.trim() || form.foundation.representativeName
          : form.applicationType === "brand_partner" && form.business.companyName.trim()
            ? form.business.companyName
            : form.applicant.fullName;
      const reviewEmail = form.applicant.email;

      return (
        <div>
          <p style={{ marginBottom: "1rem" }}>
            <strong style={{ fontSize: "1.05rem", color: "var(--downriver)" }}>
              {displayName}
            </strong>
            <br />
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {reviewEmail}
            </span>
          </p>
          <ul className="partner-review-list">
            <li>
              <strong>Type</strong>
              {form.applicationType ? labelApplicationType(form.applicationType) : "—"}
            </li>
            {healthcareApplicant && (
              <>
                <li>
                  <strong>Professional role</strong>
                  {form.professional.professionalRole}
                </li>
                {form.professional.specialty && (
                  <li>
                    <strong>Specialty</strong>
                    {form.professional.specialty}
                  </li>
                )}
                {form.professional.npiNumber && (
                  <li>
                    <strong>NPI</strong>
                    {form.professional.npiNumber}
                  </li>
                )}
                <li>
                  <strong>Phone</strong>
                  {form.applicant.phone || "—"}
                </li>
                <li>
                  <strong>Verification photos</strong>
                  {form.professional.workCredentialPhotoUrl && form.professional.identityPhotoUrl
                    ? "Work credential and identity uploaded"
                    : "—"}
                </li>
              </>
            )}
            {form.applicationType === "brand_partner" && (
              <>
                <li>
                  <strong>Website</strong>
                  {form.business.website || "—"}
                </li>
                <li>
                  <strong>Instagram</strong>
                  {form.business.instagram}
                </li>
                {form.business.tiktok && (
                  <li>
                    <strong>TikTok</strong>
                    {form.business.tiktok}
                  </li>
                )}
                {form.business.linkedin && (
                  <li>
                    <strong>LinkedIn</strong>
                    {form.business.linkedin}
                  </li>
                )}
                {form.business.additionalUrls.some((url) => url.trim()) && (
                  <li>
                    <strong>Other URLs</strong>
                    {form.business.additionalUrls
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                )}
                {form.business.address && (
                  <li>
                    <strong>Address</strong>
                    {form.business.address}
                  </li>
                )}
              </>
            )}
            {form.applicationType === "brand_partner" && (
              <>
                <li>
                  <strong>Category</strong>
                  {form.brandPartner.businessCategory}
                </li>
                {getAppDiscountTier(form.brandPartner.partnershipInterests) ? (
                  <li>
                    <strong>App discount tier</strong>
                    {labelPartnershipInterest(
                      getAppDiscountTier(form.brandPartner.partnershipInterests),
                    )}
                  </li>
                ) : null}
                {getProductPartnerships(form.brandPartner.partnershipInterests).length > 0 ? (
                  <li>
                    <strong>Product partnerships</strong>
                    {getProductPartnerships(form.brandPartner.partnershipInterests)
                      .map(labelPartnershipInterest)
                      .join(", ")}
                  </li>
                ) : null}
                {hasCustomPartnership(form.brandPartner.partnershipInterests) ? (
                  <li>
                    <strong>Custom partnership</strong>
                    Yes
                  </li>
                ) : null}
                <li>
                  <strong>Reach</strong>
                  {form.brandPartner.geographicScope
                    ? labelGeographicScope(form.brandPartner.geographicScope)
                    : "—"}
                </li>
                <li>
                  <strong>Offerings</strong>
                  {form.brandPartner.offeringTypes.map(labelOfferingOption).join(", ")}
                </li>
              </>
            )}
            {form.applicationType === "expert" && (
              <>
                <li>
                  <strong>Instagram</strong>
                  {form.business.instagram}
                </li>
                {form.business.tiktok && (
                  <li>
                    <strong>TikTok</strong>
                    {form.business.tiktok}
                  </li>
                )}
                {form.business.linkedin && (
                  <li>
                    <strong>LinkedIn</strong>
                    {form.business.linkedin}
                  </li>
                )}
                {form.business.additionalUrls.some((url) => url.trim()) && (
                  <li>
                    <strong>Other URLs</strong>
                    {form.business.additionalUrls
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                )}
                <li>
                  <strong>Forum topics</strong>
                  {form.expert.expertTopics.join(", ")}
                </li>
                <li>
                  <strong>Content types</strong>
                  {form.expert.contentResourceTypes.join(", ")}
                </li>
              </>
            )}
            {form.applicationType === "ambassador" && (
              <>
                <li>
                  <strong>Instagram</strong>
                  {form.business.instagram}
                </li>
                {form.business.tiktok && (
                  <li>
                    <strong>TikTok</strong>
                    {form.business.tiktok}
                  </li>
                )}
                {form.business.linkedin && (
                  <li>
                    <strong>LinkedIn</strong>
                    {form.business.linkedin}
                  </li>
                )}
                {form.business.additionalUrls.some((url) => url.trim()) && (
                  <li>
                    <strong>Other URLs</strong>
                    {form.business.additionalUrls
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                )}
              </>
            )}
            {form.applicationType === "foundation" && (
              <>
                <li>
                  <strong>Representative</strong>
                  {form.foundation.representativeName}
                  {form.foundation.representativeTitle
                    ? ` — ${form.foundation.representativeTitle}`
                    : ""}
                </li>
                <li>
                  <strong>Website</strong>
                  {form.foundation.website}
                </li>
                {form.foundation.phone && (
                  <li>
                    <strong>Phone</strong>
                    {form.foundation.phone}
                  </li>
                )}
                {form.foundation.instagram && (
                  <li>
                    <strong>Instagram</strong>
                    {form.foundation.instagram}
                  </li>
                )}
                {form.foundation.tiktok && (
                  <li>
                    <strong>TikTok</strong>
                    {form.foundation.tiktok}
                  </li>
                )}
                {form.foundation.linkedin && (
                  <li>
                    <strong>LinkedIn</strong>
                    {form.foundation.linkedin}
                  </li>
                )}
                {form.foundation.additionalUrls.some((url) => url.trim()) && (
                  <li>
                    <strong>Other URLs</strong>
                    {form.foundation.additionalUrls
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                )}
                <li>
                  <strong>Topics</strong>
                  {form.foundation.topics.join(", ")}
                </li>
                <li>
                  <strong>Resource types</strong>
                  {form.foundation.contentResourceTypes.join(", ")}
                </li>
              </>
            )}
          </ul>
          {form.applicationType === "brand_partner" && form.wellnessAlignment && (
            <blockquote className="partner-review-quote">{form.wellnessAlignment}</blockquote>
          )}
          {form.applicationType === "expert" && form.expert.bio && (
            <>
              <p style={{ marginTop: "1rem", marginBottom: "0.35rem", fontWeight: 600, color: "var(--downriver)" }}>
                Bio
              </p>
              <blockquote className="partner-review-quote">{form.expert.bio}</blockquote>
            </>
          )}
          {form.applicationType === "ambassador" && form.ambassador.bio && (
            <>
              <p style={{ marginTop: "1rem", marginBottom: "0.35rem", fontWeight: 600, color: "var(--downriver)" }}>
                Ambassador statement
              </p>
              <blockquote className="partner-review-quote">{form.ambassador.bio}</blockquote>
            </>
          )}
          {form.applicationType === "foundation" && form.foundation.additionalInfo && (
            <>
              <p style={{ marginTop: "1rem", marginBottom: "0.35rem", fontWeight: 600, color: "var(--downriver)" }}>
                Additional information
              </p>
              <blockquote className="partner-review-quote">{form.foundation.additionalInfo}</blockquote>
            </>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="partner-application-wizard">
      {stepIndex === 0 && (
        <div className="partner-application-intro">
          Choose how you&apos;d like to partner, then share your details. Brand partners, experts,
          and non-profit organizations use the web portal after approval to manage content;
          ambassadors use the mobile app.
        </div>
      )}

      <ol className="partner-stepper" aria-label="Application progress">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`partner-stepper-item${i < stepIndex ? " done" : ""}${i === stepIndex ? " active" : ""}`}
            aria-current={i === stepIndex ? "step" : undefined}
          >
            <span className="partner-stepper-dot" aria-hidden>
              {i < stepIndex ? "✓" : i + 1}
            </span>
            <span className="partner-stepper-label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="partner-application-panel">
        <header className="partner-step-header">
          <p className="partner-step-eyebrow">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <h2 className="partner-step-title font-subheading">{step}</h2>
          <p className="partner-step-desc">{STEP_DESCRIPTIONS[step]}</p>
        </header>

        {renderStepContent()}

        {error && <p className="admin-error" style={{ marginTop: "1rem" }}>{error}</p>}

        <footer className="partner-application-actions">
          {stepIndex > 0 && (
            <button
              type="button"
              className="admin-btn"
              disabled={loading}
              onClick={() => {
                setError(null);
                setStepIndex((i) => i - 1);
              }}
            >
              Back
            </button>
          )}
          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={stepLoading}
              onClick={() => {
                void handleContinue();
              }}
            >
              {stepLoading ? "Continuing…" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting…" : "Submit application"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
