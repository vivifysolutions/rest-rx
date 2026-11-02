"use client";

import { FormEvent, useEffect, useRef } from "react";
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
import { RECURRENCE_OPTIONS, browserTimeZone, eventDateError } from "@/lib/event-recurrence";
import type { CreateEventInput, EventRecurrenceFrequency } from "@/lib/types";

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
  recurrenceFrequency: "" | EventRecurrenceFrequency;
  recurrenceEnds: "never" | "on" | "after";
  /** YYYY-MM-DD */
  recurrenceEndsAt: string;
  recurrenceCount: string;
  recurrenceTimeZone: string;
  /** False on a past occurrence: its rule no longer drives the series, so it isn't sent. */
  recurrenceEditable: boolean;
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
  if (form.recurrenceEditable) {
    body.recurrenceFrequency = form.recurrenceFrequency || null;
    if (form.recurrenceFrequency) {
      body.recurrenceTimeZone = form.recurrenceTimeZone || browserTimeZone();
      body.recurrenceEndsAt =
        form.recurrenceEnds === "on" && form.recurrenceEndsAt
          ? new Date(`${form.recurrenceEndsAt}T23:59:59`).toISOString()
          : null;
      body.recurrenceCount =
        form.recurrenceEnds === "after" && form.recurrenceCount
          ? Number(form.recurrenceCount)
          : null;
    }
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
  const endInputRef = useRef<HTMLInputElement>(null);
  const dateError = eventDateError(form.startDate, form.endDate, form.recurrenceFrequency);
  // Blocks the browser submit and shows the message on the End field.
  useEffect(() => {
    endInputRef.current?.setCustomValidity(dateError ?? "");
  }, [dateError]);

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
            required={Boolean(form.recurrenceFrequency)}
          />
        </label>
        <label>
          End
          <input
            ref={endInputRef}
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </label>
      </div>
      {dateError && <p className="admin-error">{dateError}</p>}

      <fieldset className="admin-form-fieldset">
        <legend>Repeats</legend>
        {form.recurrenceEditable ? (
          <>
            <div className="admin-form-row">
              <label>
                Repeats
                <select
                  value={form.recurrenceFrequency}
                  onChange={(e) =>
                    onChange("recurrenceFrequency", e.target.value as EventFormValues["recurrenceFrequency"])
                  }
                >
                  <option value="">Does not repeat</option>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {form.recurrenceFrequency && (
                <label>
                  Ends
                  <select
                    value={form.recurrenceEnds}
                    onChange={(e) =>
                      onChange("recurrenceEnds", e.target.value as EventFormValues["recurrenceEnds"])
                    }
                  >
                    <option value="never">Never</option>
                    <option value="on">On a date</option>
                    <option value="after">After a number of times</option>
                  </select>
                </label>
              )}
            </div>
            {form.recurrenceFrequency && form.recurrenceEnds === "on" && (
              <label>
                Last date
                <input
                  type="date"
                  value={form.recurrenceEndsAt}
                  onChange={(e) => onChange("recurrenceEndsAt", e.target.value)}
                  required
                />
              </label>
            )}
            {form.recurrenceFrequency && form.recurrenceEnds === "after" && (
              <label>
                Number of times (including this one)
                <input
                  type="number"
                  min={2}
                  max={520}
                  value={form.recurrenceCount}
                  onChange={(e) => onChange("recurrenceCount", e.target.value)}
                  required
                />
              </label>
            )}
            {form.recurrenceFrequency && (
              <span className="admin-field-hint">
                The app lists one occurrence at a time. The day after it ends, the next one appears
                with the same details, so members never see a run of copies. Changes saved here apply
                to this and future occurrences. Times repeat in{" "}
                {form.recurrenceTimeZone || browserTimeZone()}.
              </span>
            )}
          </>
        ) : (
          <span className="admin-field-hint">
            This is a past occurrence of a repeating event. Edit the latest occurrence to change how
            the series repeats.
          </span>
        )}
      </fieldset>

      <fieldset className="admin-form-fieldset">
        <legend>Photos</legend>
        <MultipleImageUpload
          folder="events"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Event photos"
          maxImages={10}
          guide="event"
          hint="Upload multiple images. The first photo is the cover on browse cards; use the arrows to change order. Members swipe through all photos on the event detail screen."
        />
      </fieldset>

      {submitLabel !== SAVE_CHANGES_LABEL && (
        <AdminFormSubmit label={submitLabel} form={form} />
      )}
    </form>
  );
}
