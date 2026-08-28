"use client";

import { FormEvent } from "react";
import { MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import { ComboInput } from "@/components/admin/ComboInput";
import { FeaturedOrderFields, FeaturedToggle, parseFeaturedOrderInput } from "@/components/admin/FeaturedToggle";
import { LocationField } from "@/components/admin/LocationField";
import { MultipleImageUpload } from "@/components/admin/MultipleImageUpload";
import { AdminFormSubmit, SAVE_CHANGES_LABEL } from "@/components/admin/AdminFormActions";
import {
  BrandPartnerPicker,
  type BrandPartnerOption,
} from "@/components/discounts/BrandPartnerPicker";
import type { LocationValue } from "@/lib/address";
import {
  EMPTY_LOCATION,
  isOnlineFormat,
  isVirtualLocation,
  locationToApiPayload,
} from "@/lib/address";
import type { CreateEventInput } from "@/lib/types";

const EVENT_ABOUT_PLACEHOLDER = `What this event is about. Markdown is supported:

## What to expect
**Bold** details and *emphasis*

- Who it's for
- What members will walk away with

> Optional callout for dress code, materials, or notes`;

export type EventFormValues = {
  title: string;
  description: string;
  category: string;
  format: string;
  location: LocationValue;
  price: string;
  registrationUrl: string;
  images: string[];
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  isFeaturedOnHome: boolean;
  featuredOrder: string;
  featuredOnHomeOrder: string;
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
  const images = form.images.map((url) => url.trim()).filter(Boolean);
  const body: CreateEventInput = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    category: form.category.trim() || undefined,
    format: form.format.trim() || undefined,
    ...locationPayload,
    price: form.price ? Number(form.price) : undefined,
    registrationUrl: form.registrationUrl.trim() || undefined,
    image: images[0],
    images,
    isFeatured: form.isFeatured,
    isFeaturedOnHome: form.isFeaturedOnHome,
    featuredOrder: parseFeaturedOrderInput(form.featuredOrder),
    featuredOnHomeOrder: parseFeaturedOrderInput(form.featuredOnHomeOrder),
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
      {submitLabel === SAVE_CHANGES_LABEL && (
        <AdminFormSubmit label={submitLabel} form={form} />
      )}
      <FeaturedToggle
        isFeatured={form.isFeatured}
        isFeaturedOnHome={form.isFeaturedOnHome}
        onChangeFeatured={(next) => onChange("isFeatured", next)}
        onChangeFeaturedOnHome={(next) => onChange("isFeaturedOnHome", next)}
        sectionLabel="Events"
      />
      <FeaturedOrderFields
        featuredOrder={form.featuredOrder}
        featuredOnHomeOrder={form.featuredOnHomeOrder}
        onChangeFeaturedOrder={(v) => onChange("featuredOrder", v)}
        onChangeFeaturedOnHomeOrder={(v) => onChange("featuredOnHomeOrder", v)}
      />

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
      <MarkdownBodyField
        label="About"
        value={form.description}
        onChange={(v) => onChange("description", v)}
        placeholder={EVENT_ABOUT_PLACEHOLDER}
        hint="Longer event copy shown on the detail screen — Markdown formatting renders in the app."
      />

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
            onChange={(v) => {
              onChange("format", v);
              if (isOnlineFormat(v)) {
                onChange("location", { ...EMPTY_LOCATION, line1: "Online" });
              } else if (isVirtualLocation(form.location.line1)) {
                onChange("location", { ...EMPTY_LOCATION });
              }
            }}
            options={formats}
            placeholder="in-person, virtual…"
          />
        </label>
      </div>

      <LocationField
        value={form.location}
        onChange={(loc) => onChange("location", loc)}
        placeholder="123 Main St"
        hint={
          isOnlineFormat(form.format)
            ? "Online/virtual format selected — city and state are not required."
            : "For in-person events, enter street, city, state, and ZIP. Choose Online if there is no physical venue."
        }
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

      <fieldset className="admin-form-fieldset">
        <legend>Photos</legend>
        <MultipleImageUpload
          folder="events"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Event photos"
          maxImages={10}
          guide="event"
          hint="Upload multiple images. The first photo is the cover on browse cards; members can swipe through all photos on the detail screen."
        />
      </fieldset>

      {submitLabel !== SAVE_CHANGES_LABEL && (
        <AdminFormSubmit label={submitLabel} form={form} />
      )}
    </form>
  );
}
