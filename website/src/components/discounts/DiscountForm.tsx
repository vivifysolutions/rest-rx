"use client";

import { FormEvent } from "react";
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
} from "@/lib/discountOffer";
import type { LocationValue } from "@/lib/address";
import { EMPTY_LOCATION } from "@/lib/address";
import type { CreateDiscountInput } from "@/lib/types";

export type DiscountFormValues = {
  title: string;
  description: string;
  offerHighlight: string;
  percentage: string;
  category: string;
  location: LocationValue;
  tier: string;
  claimLink: string;
  images: string[];
  isFeatured: boolean;
  expiryDate: string;
  brandPartnerApplicationId: string;
};

export const EMPTY_DISCOUNT_FORM: DiscountFormValues = {
  title: "",
  description: "",
  offerHighlight: "",
  percentage: "",
  category: "",
  location: EMPTY_LOCATION,
  tier: "",
  claimLink: "",
  images: [],
  isFeatured: false,
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
  const badgePreview = getDiscountBadgeLabel({
    offerHighlight: form.offerHighlight.trim() || null,
    percentage: form.percentage.trim() ? Number(form.percentage) : null,
  });

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

    const body: CreateDiscountInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      offerHighlight: highlight || undefined,
      percentage,
      category: form.category.trim(),
      location: form.location.location.trim() || undefined,
      tier: DISCOUNT_TIERS_ENABLED ? form.tier.trim() || undefined : undefined,
      claimLink: form.claimLink.trim() || undefined,
      image: images[0],
      images,
      isFeatured: showFeatured ? form.isFeatured : undefined,
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
      {showPartnerPicker && (
        <label>
          Owner (partner account)
          <span className="admin-field-hint">
            Optional — link to an approved brand partner, expert, or foundation so the offer
            appears under their application / portal account.
          </span>
          <BrandPartnerPicker
            value={form.brandPartnerApplicationId}
            partners={brandPartners}
            loading={brandPartnersLoading}
            onChange={(id) => onChange("brandPartnerApplicationId", id)}
          />
        </label>
      )}

      <label>
        Title *
        <input
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          required
        />
      </label>

      <label>
        Full offer details
        <span className="admin-field-hint">
          Complete terms members see on the detail screen — e.g. &quot;First class free, then
          $5.99/month.&quot;
        </span>
        <textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={4}
        />
      </label>

      <label>
        Badge highlight
        <span className="admin-field-hint">
          Short label for cards and the featured carousel ({OFFER_HIGHLIGHT_MAX_LENGTH} characters
          max). Example: &quot;1st class free&quot; or &quot;Free trial&quot;.
        </span>
        <input
          value={form.offerHighlight}
          onChange={(e) => onChange("offerHighlight", e.target.value.slice(0, OFFER_HIGHLIGHT_MAX_LENGTH))}
          maxLength={OFFER_HIGHLIGHT_MAX_LENGTH}
          placeholder="1st class free"
        />
        <span className="admin-char-count">
          {highlightLen}/{OFFER_HIGHLIGHT_MAX_LENGTH}
        </span>
      </label>

      {DISCOUNT_TIERS_ENABLED ? (
        <div className="admin-form-row">
          <label>
            Percentage off (0–100)
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
            Tier
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
          Percentage off (0–100)
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
        <p className="admin-field-hint" style={{ marginTop: "-0.25rem" }}>
          Badge preview: <strong>{badgePreview}</strong>
          {form.offerHighlight.trim() ? " (uses highlight)" : " (uses percentage)"}
        </p>
      ) : null}

      <label>
        Category *
        <ReferenceSelect
          name="category"
          value={form.category}
          onChange={(v) => onChange("category", v)}
          options={categoryOptions}
          placeholder="Select category"
          required
        />
      </label>

      <LocationField
        value={form.location}
        onChange={(loc) => onChange("location", loc)}
        placeholder="City, state, or street address"
      />

      <label>
        Partner redemption link
        <input
          type="url"
          value={form.claimLink}
          onChange={(e) => onChange("claimLink", e.target.value)}
          placeholder="https://partner.com/redeem/..."
        />
      </label>

      <MultipleImageUpload
        folder="discounts"
        values={form.images}
        onChange={(urls) => onChange("images", urls)}
        label="Discount photos"
        maxImages={10}
        guide="discount"
        hint="Upload multiple images. The first photo is the cover on browse cards; members can swipe through all photos on the detail screen."
      />

      <label>
        Expiry date
        <input
          type="date"
          value={form.expiryDate}
          onChange={(e) => onChange("expiryDate", e.target.value)}
        />
      </label>

      {showFeatured && (
        <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => onChange("isFeatured", e.target.checked)}
          />
          Featured on Discover home
        </label>
      )}

      {!hideSubmit && (
        <button type="submit" className="admin-btn admin-btn-primary">
          {submitLabel}
        </button>
      )}
    </form>
  );
}
