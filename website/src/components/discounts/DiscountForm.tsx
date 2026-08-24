"use client";

import { FormEvent } from "react";
import { MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import { FeaturedToggle } from "@/components/admin/FeaturedToggle";
import { LocationField } from "@/components/admin/LocationField";
import { MultipleImageUpload } from "@/components/admin/MultipleImageUpload";
import { ReferenceSelect } from "@/components/admin/ReferenceSelect";
import {
  BrandPartnerPicker,
  type BrandPartnerOption,
} from "@/components/discounts/BrandPartnerPicker";
import { DISCOUNT_TIER_OPTIONS, DISCOUNT_TIERS_ENABLED } from "@/lib/reference-data";
import {
  getDiscountBadgeLabel,
  OFFER_HIGHLIGHT_MAX_LENGTH,
  OFFER_SUMMARY_MAX_LENGTH,
} from "@/lib/discountOffer";
import type { LocationValue } from "@/lib/address";
import { EMPTY_LOCATION, locationToApiPayload, parseLocationString } from "@/lib/address";
import { normalizeInstagramHandle } from "@/lib/social";
import type { CreateDiscountInput } from "@/lib/types";

import { DEFAULT_DISCOUNT_TERMS } from "@/lib/discountTerms";

const OFFER_DETAILS_PLACEHOLDER = `Share background on the partner and what's included. Markdown is supported:

## What's included
**Bold text** and *italic*

- First benefit
- Second benefit

> Tip or important note for members`;

const REDEEM_PLACEHOLDER = `How members redeem. Markdown is supported:

1. Tap **Claim discount** (or **Show member card** for in-person offers)
2. Create an account with your work email
3. Enter code \`RESTRX\` at checkout

- For in-person: leave Redemption link blank — members show a live Rest & Rx membership card
- Mention Rest & Rx at the desk`;

const TERMS_PLACEHOLDER = `Leave blank to use the default terms, or customize:

${DEFAULT_DISCOUNT_TERMS}`;

export type DiscountFormValues = {
  title: string;
  description: string;
  offerSummary: string;
  offerHighlight: string;
  percentage: string;
  redemptionInstructions: string;
  terms: string;
  category: string;
  location: LocationValue;
  tier: string;
  claimLink: string;
  website: string;
  instagram: string;
  phone: string;
  images: string[];
  isFeatured: boolean;
  isFeaturedOnHome: boolean;
  expiryDate: string;
  brandPartnerApplicationId: string;
};

export const EMPTY_DISCOUNT_FORM: DiscountFormValues = {
  title: "",
  description: "",
  offerSummary: "",
  offerHighlight: "",
  percentage: "",
  redemptionInstructions: "",
  terms: "",
  category: "",
  location: { ...EMPTY_LOCATION },

  tier: "",
  claimLink: "",
  website: "",
  instagram: "",
  phone: "",
  images: [],
  isFeatured: false,
  isFeaturedOnHome: false,
  expiryDate: "",
  brandPartnerApplicationId: "",
};

type Props = {
  form: DiscountFormValues;
  onChange: <K extends keyof DiscountFormValues>(key: K, value: DiscountFormValues[K]) => void;
  categoryOptions: { value: string; label: string }[];
  showFeatured?: boolean;
  /** Admin: search and link an approved brand partner. */
  showPartnerPicker?: boolean;
  brandPartners?: BrandPartnerOption[];
  brandPartnersLoading?: boolean;
  submitLabel?: string;
  hideSubmit?: boolean;
  onSubmit: (body: CreateDiscountInput) => Promise<void>;
};

export function DiscountForm({
  form,
  onChange,
  categoryOptions,
  showFeatured = false,
  showPartnerPicker = false,
  brandPartners = [],
  brandPartnersLoading = false,
  submitLabel = "Create discount",
  hideSubmit = false,
  onSubmit,
}: Props) {
  const highlightLen = form.offerHighlight.length;
  const summaryLen = form.offerSummary.length;
  const badgePreview = getDiscountBadgeLabel({
    offerHighlight: form.offerHighlight.trim() || null,
    percentage: form.percentage.trim() ? Number(form.percentage) : null,
  });

  function handlePartnerChange(id: string) {
    onChange("brandPartnerApplicationId", id);
    const partner = brandPartners.find((p) => p.id === id);
    if (!partner) return;

    // Prefill empty contact fields from the linked partner application.
    if (!form.website.trim() && partner.website?.trim()) {
      onChange("website", partner.website.trim());
    }
    if (!form.instagram.trim() && partner.instagram?.trim()) {
      onChange("instagram", partner.instagram.trim());
    }
    if (!form.phone.trim() && partner.phone?.trim()) {
      onChange("phone", partner.phone.trim());
    }
    if (!form.location.line1.trim() && partner.address?.trim()) {
      onChange("location", parseLocationString(partner.address.trim()));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const highlight = form.offerHighlight.trim();
    const pctRaw = form.percentage.trim();
    const percentage = pctRaw === "" ? undefined : Number(pctRaw);

    if (!highlight && percentage === undefined) {
      window.alert("Add a badge highlight and/or a percentage off.");
      return;
    }

    const images = form.images.map((url) => url.trim()).filter(Boolean);
    const locationPayload = locationToApiPayload(form.location);

    const body: CreateDiscountInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      offerSummary: form.offerSummary.trim() || undefined,
      offerHighlight: highlight || undefined,
      percentage,
      redemptionInstructions: form.redemptionInstructions.trim() || undefined,
      terms: form.terms.trim() || DEFAULT_DISCOUNT_TERMS,
      category: form.category.trim(),
      ...locationPayload,
      tier: DISCOUNT_TIERS_ENABLED ? form.tier.trim() || undefined : undefined,
      claimLink: form.claimLink.trim() || undefined,
      website: form.website.trim() || undefined,
      instagram: normalizeInstagramHandle(form.instagram),
      phone: form.phone.trim() || undefined,
      image: images[0],
      images,
      isFeatured: showFeatured ? form.isFeatured : undefined,
      isFeaturedOnHome: showFeatured ? form.isFeaturedOnHome : undefined,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    };

    if (showPartnerPicker) {
      // Empty string clears an existing partner link on update.
      body.brandPartnerApplicationId = form.brandPartnerApplicationId.trim();
    }

    await onSubmit(body);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {showFeatured && (
        <FeaturedToggle
          isFeatured={form.isFeatured}
          isFeaturedOnHome={form.isFeaturedOnHome}
          onChangeFeatured={(next) => onChange("isFeatured", next)}
          onChangeFeaturedOnHome={(next) => onChange("isFeaturedOnHome", next)}
          sectionLabel="Discounts"
        />
      )}

      {showPartnerPicker && (
        <label>
          <span className="admin-field-label">Owner (partner account)</span>
          <span className="admin-field-hint">
            Optional — link to an approved brand partner, expert, or foundation so the offer
            appears under their application / portal account. Selecting a partner prefills empty
            business contact fields when available.
          </span>
          <BrandPartnerPicker
            value={form.brandPartnerApplicationId}
            partners={brandPartners}
            loading={brandPartnersLoading}
            onChange={handlePartnerChange}
          />
        </label>
      )}

      <fieldset className="admin-form-fieldset">
        <legend>Offer</legend>

        <label>
          <span className="admin-field-label">Brand or business name *</span>
          <span className="admin-field-hint">
            Brand or business name shown at the top of the offer in the app.
          </span>
          <input
            value={form.title}
            onChange={(e) => onChange("title", e.target.value.replace(/\n/g, " "))}
            required
            maxLength={80}
            placeholder="Brand or business name"
          />
        </label>

        <label>
          <span className="admin-field-label">Offer</span>
          <span className="admin-field-hint">
            The deal members see under Offer details — promo code, % off, or freebie. Example:
            &quot;Use code RESTRX for 15% off&quot; or &quot;First class free for healthcare workers&quot;.
          </span>
          <input
            value={form.offerSummary}
            onChange={(e) =>
              onChange("offerSummary", e.target.value.slice(0, OFFER_SUMMARY_MAX_LENGTH))
            }
            maxLength={OFFER_SUMMARY_MAX_LENGTH}
            placeholder="Use code RESTRX for 15% off"
          />
          <span className="admin-char-count">
            {summaryLen}/{OFFER_SUMMARY_MAX_LENGTH}
          </span>
        </label>

        <MarkdownBodyField
          label="About this offer"
          value={form.description}
          onChange={(v) => onChange("description", v)}
          placeholder={OFFER_DETAILS_PLACEHOLDER}
          hint="Longer background and what's included — Markdown formatting renders on the offer screen. Separate from the Offer line above."
        />

        <MarkdownBodyField
          label="How to redeem"
          value={form.redemptionInstructions}
          onChange={(v) => onChange("redemptionInstructions", v)}
          placeholder={REDEEM_PLACEHOLDER}
          hint="Step-by-step instructions shown before Claim / Show member card — Markdown formatting is supported."
        />

        <MarkdownBodyField
          label="Terms"
          value={form.terms}
          onChange={(v) => onChange("terms", v)}
          placeholder={TERMS_PLACEHOLDER}
          hint="Fine print on the offer detail screen. Leave blank to use the default mobile copy."
        />

        <label>
          <span className="admin-field-label">Badge highlight</span>
          <span className="admin-field-hint">
            Short label for cards and the featured carousel ({OFFER_HIGHLIGHT_MAX_LENGTH} characters
            max). Example: &quot;15% off&quot; or &quot;1st class free&quot;.
          </span>
          <input
            value={form.offerHighlight}
            onChange={(e) =>
              onChange("offerHighlight", e.target.value.slice(0, OFFER_HIGHLIGHT_MAX_LENGTH))
            }
            maxLength={OFFER_HIGHLIGHT_MAX_LENGTH}
            placeholder="15% off"
          />
          <span className="admin-char-count">
            {highlightLen}/{OFFER_HIGHLIGHT_MAX_LENGTH}
          </span>
        </label>

        {DISCOUNT_TIERS_ENABLED ? (
          <div className="admin-form-row">
            <label>
              <span className="admin-field-label">Percentage off (0–100)</span>
              <span className="admin-field-hint">Optional — use for classic % off offers.</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.percentage}
                onChange={(e) => onChange("percentage", e.target.value)}
              />
            </label>
            <label>
              <span className="admin-field-label">Tier</span>
              <ReferenceSelect
                name="tier"
                value={form.tier}
                onChange={(v) => onChange("tier", v)}
                options={DISCOUNT_TIER_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                placeholder="Select tier"
              />
            </label>
          </div>
        ) : (
          <label>
            <span className="admin-field-label">Percentage off (0–100)</span>
            <span className="admin-field-hint">Optional — use for classic % off offers.</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.percentage}
              onChange={(e) => onChange("percentage", e.target.value)}
            />
          </label>
        )}

        {badgePreview ? (
          <p className="admin-field-hint">
            Badge preview: <strong>{badgePreview}</strong>
            {form.offerHighlight.trim() ? " (uses highlight)" : " (uses percentage)"}
          </p>
        ) : null}

        <label>
          <span className="admin-field-label">Category *</span>
          <ReferenceSelect
            name="category"
            value={form.category}
            onChange={(v) => onChange("category", v)}
            options={categoryOptions}
            placeholder="Select category"
            required
          />
        </label>

        <label>
          <span className="admin-field-label">Expiry date</span>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => onChange("expiryDate", e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className="admin-form-fieldset">
        <legend>Redeem &amp; business</legend>

        <label>
          <span className="admin-field-label">Redemption link</span>
          <span className="admin-field-hint">
            URL opened when members tap Claim discount (booking page, promo link, or partner
            checkout). Leave blank for in-person redemption — members will show a live Rest &amp; Rx
            membership card instead (screenshots blocked).
          </span>
          <input
            type="url"
            value={form.claimLink}
            onChange={(e) => onChange("claimLink", e.target.value)}
            placeholder="https://partner.com/redeem/..."
          />
        </label>

        <label>
          <span className="admin-field-label">Business website</span>
          <span className="admin-field-hint">Domain or full URL — opens in the app when tapped.</span>
          <input
            value={form.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="partner.com"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>

        <label>
          <span className="admin-field-label">Instagram username</span>
          <span className="admin-field-hint">
            Username only (e.g. partner). The app builds the Instagram link for members.
          </span>
          <input
            value={form.instagram}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="partner"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label>
          <span className="admin-field-label">Phone number</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </label>

        <LocationField
          value={form.location}
          onChange={(loc) => onChange("location", loc)}
          label="Business address"
          placeholder="123 Main St"
          hint="Choose Online for virtual businesses (no city/state needed), or enter a street address for in-person locations. Physical addresses are converted to map coordinates for nearby offers in the app."
        />
      </fieldset>

      <fieldset className="admin-form-fieldset">
        <legend>Photos</legend>
        <MultipleImageUpload
          folder="discounts"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Discount photos"
          maxImages={10}
          guide="discount"
          hint="Upload multiple images. The first photo is the cover on browse cards; members can swipe through all photos on the detail screen."
        />
      </fieldset>

      {!hideSubmit && (
        <button type="submit" className="admin-btn admin-btn-primary">
          {submitLabel}
        </button>
      )}
    </form>
  );
}
