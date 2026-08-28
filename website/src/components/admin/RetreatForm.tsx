"use client";

import { FormEvent } from "react";
import { MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import { ComboInput } from "@/components/admin/ComboInput";
import { FeaturedOrderFields, FeaturedToggle, parseFeaturedOrderInput } from "@/components/admin/FeaturedToggle";
import { MultipleImageUpload } from "@/components/admin/MultipleImageUpload";
import { AdminFormSubmit, SAVE_CHANGES_LABEL } from "@/components/admin/AdminFormActions";
import type { CreateRetreatInput } from "@/lib/types";

export const RETREAT_LOCATIONS = ["Domestic", "International"] as const;
export type RetreatLocation = (typeof RETREAT_LOCATIONS)[number];

const ABOUT_PLACEHOLDER = `What this retreat is about. Markdown is supported:

## Overview
**Bold** highlights and *emphasis*

- Who it's for
- What's included
- Atmosphere or setting

> Optional callout for packing lists or travel notes`;

const JOIN_PLACEHOLDER = `How members join this retreat. Markdown is supported:

1. Tap **Book retreat** to open the booking page
2. Complete your reservation with the partner
3. Mention Rest & Rx if a member rate applies

- Include any deposit, waitlist, or application steps
- Note deadlines or eligibility (e.g. members only)`;

export type RetreatFormValues = {
  title: string;
  description: string;
  joinInstructions: string;
  category: string;
  season: string;
  location: string;
  rating: string;
  images: string[];
  startDate: string;
  endDate: string;
  bookingUrl: string;
  isFeatured: boolean;
  isFeaturedOnHome: boolean;
  featuredOrder: string;
  featuredOnHomeOrder: string;
};

type Props = {
  form: RetreatFormValues;
  onChange: <K extends keyof RetreatFormValues>(key: K, value: RetreatFormValues[K]) => void;
  topics: string[];
  seasons: string[];
  submitLabel?: string;
  onSubmit: (body: CreateRetreatInput) => Promise<void>;
};

export function formValuesToRetreatBody(form: RetreatFormValues): CreateRetreatInput {
  const images = form.images.map((url) => url.trim()).filter(Boolean);
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    joinInstructions: form.joinInstructions.trim() || undefined,
    category: form.category.trim() || undefined,
    season: form.season.trim() || undefined,
    location: form.location.trim() || undefined,
    rating: form.rating ? Number(form.rating) : undefined,
    image: images[0],
    images,
    bookingUrl: form.bookingUrl.trim() || undefined,
    isFeatured: form.isFeatured,
    isFeaturedOnHome: form.isFeaturedOnHome,
    featuredOrder: parseFeaturedOrderInput(form.featuredOrder),
    featuredOnHomeOrder: parseFeaturedOrderInput(form.featuredOnHomeOrder),
    startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
  };
}

export function RetreatForm({
  form,
  onChange,
  topics,
  seasons,
  submitLabel = "Save retreat",
  onSubmit,
}: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(formValuesToRetreatBody(form));
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
        sectionLabel="Retreats"
      />
      <FeaturedOrderFields
        featuredOrder={form.featuredOrder}
        featuredOnHomeOrder={form.featuredOnHomeOrder}
        onChangeFeaturedOrder={(v) => onChange("featuredOrder", v)}
        onChangeFeaturedOnHomeOrder={(v) => onChange("featuredOnHomeOrder", v)}
      />

      <label>
        Title *
        <input value={form.title} onChange={(e) => onChange("title", e.target.value)} required />
      </label>
      <MarkdownBodyField
        label="About this retreat"
        value={form.description}
        onChange={(v) => onChange("description", v)}
        placeholder={ABOUT_PLACEHOLDER}
        hint="Longer retreat copy shown on the detail screen — Markdown formatting renders in the app."
      />

      <MarkdownBodyField
        label="How to join"
        value={form.joinInstructions}
        onChange={(v) => onChange("joinInstructions", v)}
        placeholder={JOIN_PLACEHOLDER}
        hint="Step-by-step instructions shown on the retreat detail screen before Book retreat — Markdown formatting is supported."
      />

      <label>
        Booking URL
        <input
          type="url"
          value={form.bookingUrl}
          onChange={(e) => onChange("bookingUrl", e.target.value)}
          placeholder="https://…"
        />
      </label>

      <div className="admin-form-row">
        <label>
          Category
          <ComboInput
            name="category"
            value={form.category}
            onChange={(v) => onChange("category", v)}
            options={topics}
            placeholder="yoga, spa, meditation…"
          />
        </label>
        <label>
          Season
          <ComboInput
            name="season"
            value={form.season}
            onChange={(v) => onChange("season", v)}
            options={seasons}
            placeholder="spring, summer…"
          />
        </label>
      </div>

      <label>
        Location
        <select
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
        >
          <option value="">Select location…</option>
          {RETREAT_LOCATIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        Rating (0–5)
        <input
          type="number"
          step="0.1"
          min={0}
          max={5}
          value={form.rating}
          onChange={(e) => onChange("rating", e.target.value)}
        />
      </label>

      <fieldset className="admin-form-fieldset">
        <legend>Photos</legend>
        <MultipleImageUpload
          folder="retreats"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Retreat photos"
          maxImages={10}
          guide="retreat"
          hint="Upload multiple images. The first photo is the cover on browse cards; members can swipe through all photos on the detail screen."
        />
      </fieldset>

      <div className="admin-form-row">
        <label>
          Start
          <input type="date" value={form.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
        </label>
        <label>
          End
          <input type="date" value={form.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
        </label>
      </div>

      {submitLabel !== SAVE_CHANGES_LABEL && (
        <AdminFormSubmit label={submitLabel} form={form} />
      )}
    </form>
  );
}
