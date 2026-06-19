"use client";

import { FormEvent } from "react";
import { ComboInput } from "@/components/admin/ComboInput";
import { LocationField } from "@/components/admin/LocationField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { LocationValue } from "@/lib/address";
import type { CreateRetreatInput } from "@/lib/types";

export type RetreatFormValues = {
  title: string;
  description: string;
  category: string;
  season: string;
  location: LocationValue;
  rating: string;
  image: string;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
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
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    category: form.category.trim() || undefined,
    season: form.season.trim() || undefined,
    location: form.location.location.trim() || undefined,
    rating: form.rating ? Number(form.rating) : undefined,
    image: form.image.trim() || undefined,
    isFeatured: form.isFeatured,
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

      <LocationField
        value={form.location}
        onChange={(loc) => onChange("location", loc)}
        placeholder="City, region, or venue"
      />

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

      <ImageUpload
        folder="retreats"
        value={form.image}
        onChange={(url) => onChange("image", url)}
        guide="retreat"
      />

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
