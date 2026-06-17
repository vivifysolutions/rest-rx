"use client";

import { FormEvent } from "react";
import { ComboInput } from "@/components/admin/ComboInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ReferenceSelect } from "@/components/admin/ReferenceSelect";
import { DISCOUNT_TIER_OPTIONS } from "@/lib/reference-data";
import type { CreateDiscountInput } from "@/lib/types";

export type DiscountFormValues = {
  title: string;
  description: string;
  percentage: string;
  category: string;
  location: string;
  latitude: string;
  longitude: string;
  tier: string;
  claimLink: string;
  image: string;
  isFeatured: boolean;
  expiryDate: string;
};

export const EMPTY_DISCOUNT_FORM: DiscountFormValues = {
  title: "",
  description: "",
  percentage: "",
  category: "",
  location: "",
  latitude: "",
  longitude: "",
  tier: "",
  claimLink: "",
  image: "",
  isFeatured: false,
  expiryDate: "",
};

type Props = {
  form: DiscountFormValues;
  onChange: <K extends keyof DiscountFormValues>(key: K, value: DiscountFormValues[K]) => void;
  categoryOptions: { value: string; label: string }[];
  locationSuggestions: string[];
  showFeatured?: boolean;
  submitLabel?: string;
  onSubmit: (body: CreateDiscountInput) => Promise<void>;
};

export function DiscountForm({
  form,
  onChange,
  categoryOptions,
  locationSuggestions,
  showFeatured = false,
  submitLabel = "Create discount",
  onSubmit,
}: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body: CreateDiscountInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      percentage: Number(form.percentage),
      category: form.category.trim(),
      location: form.location.trim() || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      tier: form.tier.trim() || undefined,
      claimLink: form.claimLink.trim() || undefined,
      image: form.image.trim() || undefined,
      isFeatured: showFeatured ? form.isFeatured : undefined,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    };
    await onSubmit(body);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label>
        Title *
        <input
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>

      <div className="admin-form-row">
        <label>
          Percentage off (0–100) *
          <input
            type="number"
            min={0}
            max={100}
            value={form.percentage}
            onChange={(e) => onChange("percentage", e.target.value)}
            required
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

      <label>
        Location
        <ComboInput
          name="location"
          value={form.location}
          onChange={(v) => onChange("location", v)}
          options={locationSuggestions}
          placeholder="City, State (e.g. Chicago, IL)"
        />
      </label>

      <div className="admin-form-row">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={form.latitude}
            onChange={(e) => onChange("latitude", e.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={form.longitude}
            onChange={(e) => onChange("longitude", e.target.value)}
          />
        </label>
      </div>

      <label>
        Claim link
        <input
          type="url"
          value={form.claimLink}
          onChange={(e) => onChange("claimLink", e.target.value)}
          placeholder="https://partner.com/redeem/..."
        />
      </label>

      <ImageUpload folder="discounts" value={form.image} onChange={(url) => onChange("image", url)} />

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
          Featured
        </label>
      )}

      <button type="submit" className="admin-btn admin-btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
