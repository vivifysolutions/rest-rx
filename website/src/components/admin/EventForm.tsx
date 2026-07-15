"use client";

import { FormEvent } from "react";
import { ComboInput } from "@/components/admin/ComboInput";
import { LocationField } from "@/components/admin/LocationField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  BrandPartnerPicker,
  type BrandPartnerOption,
} from "@/components/discounts/BrandPartnerPicker";
import type { LocationValue } from "@/lib/address";
import { locationToApiPayload } from "@/lib/address";
import type { CreateEventInput } from "@/lib/types";

export type EventFormValues = {
  title: string;
  description: string;
  category: string;
  format: string;
  location: LocationValue;
  price: string;
  registrationUrl: string;
  image: string;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  brandPartnerApplicationId: string;
};

type Props = {
  form: EventFormValues;
  onChange: <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => void;
  topics: string[];
  formats: string[];
  showPartnerPicker?: boolean;
  brandPartners?: BrandPartnerOption[];
  brandPartnersLoading?: boolean;
  submitLabel?: string;
  onSubmit: (body: CreateEventInput) => Promise<void>;
};

export function formValuesToEventBody(
  form: EventFormValues,
  options?: { includePartner?: boolean },
): CreateEventInput {
  const locationPayload = locationToApiPayload(form.location);
  const body: CreateEventInput = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    category: form.category.trim() || undefined,
    format: form.format.trim() || undefined,
    ...locationPayload,
    price: form.price ? Number(form.price) : undefined,
    registrationUrl: form.registrationUrl.trim() || undefined,
    image: form.image.trim() || undefined,
    isFeatured: form.isFeatured,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
  };
  if (options?.includePartner) {
    body.brandPartnerApplicationId = form.brandPartnerApplicationId.trim();
  }
  return body;
}

export function EventForm({
  form,
  onChange,
  topics,
  formats,
  showPartnerPicker = false,
  brandPartners = [],
  brandPartnersLoading = false,
  submitLabel = "Save event",
  onSubmit,
}: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(formValuesToEventBody(form, { includePartner: showPartnerPicker }));
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {showPartnerPicker && (
        <label>
          Owner (partner account)
          <span className="admin-field-hint">
            Optional — link to an approved brand partner, expert, or foundation.
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
        <input value={form.title} onChange={(e) => onChange("title", e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={(e) => onChange("description", e.target.value)} />
      </label>

      <div className="admin-form-row">
        <label>
          Category
          <ComboInput
            name="category"
            value={form.category}
            onChange={(v) => onChange("category", v)}
            options={topics}
            placeholder="workshop, webinar, panel…"
          />
        </label>
        <label>
          Format
          <ComboInput
            name="format"
            value={form.format}
            onChange={(v) => onChange("format", v)}
            options={formats}
            placeholder="in-person, virtual…"
          />
        </label>
      </div>

      <LocationField
        value={form.location}
        onChange={(loc) => onChange("location", loc)}
        placeholder="123 Main St (or type Online)"
        hint="For in-person events, use street, city, state, and ZIP. For virtual events, type Online in the street field."
        requireCityState={false}
      />

      <div className="admin-form-row">
        <label>
          Price (USD)
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.price}
            onChange={(e) => onChange("price", e.target.value)}
            placeholder="0 for free"
          />
        </label>
        <label>
          Registration URL
          <input
            type="url"
            value={form.registrationUrl}
            onChange={(e) => onChange("registrationUrl", e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="admin-form-row">
        <label>
          Start
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </label>
      </div>

      <ImageUpload
        folder="events"
        value={form.image}
        onChange={(url) => onChange("image", url)}
        guide="event"
      />

      <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={form.isFeatured}
          onChange={(e) => onChange("isFeatured", e.target.checked)}
        />
        Featured on Discover home
      </label>

      <button type="submit" className="admin-btn admin-btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
