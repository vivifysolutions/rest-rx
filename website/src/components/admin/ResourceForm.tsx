"use client";

import { FormEvent } from "react";
import { ComboInput } from "@/components/admin/ComboInput";
import { ArticleBodyField, MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import {
  ExpertUserPicker,
  type ExpertOwnerOption,
} from "@/components/admin/ExpertUserPicker";
import { FeaturedOrderFields, FeaturedToggle, parseFeaturedOrderInput } from "@/components/admin/FeaturedToggle";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MultipleImageUpload } from "@/components/admin/MultipleImageUpload";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { AdminFormSubmit, SAVE_CHANGES_LABEL } from "@/components/admin/AdminFormActions";
import {
  isArticleType,
  isAudioType,
  isMicroRxType,
  isQuickRxType,
  isVideoType,
} from "@/components/admin/resourceTypes";
import type { CreateResourceInput } from "@/lib/types";

const CAPTION_PLACEHOLDER = `Optional caption under the media. Markdown is supported:

**Bold** or *italic* emphasis
- Short bullet if needed`;

const TRANSCRIPT_PLACEHOLDER = `Optional transcript shown when members tap Transcribe. Markdown is supported:

## Intro
Spoken words with **emphasis** where helpful.

- Speaker notes or section breaks`;

const MICRO_RX_PLACEHOLDER = `Full Micro RX prompt shown in the app. Markdown is supported:

Take **three slow breaths**.

1. Notice how you feel
2. Soften your shoulders
3. Name one thing you're grateful for

> Keep it short enough to finish in a break.`;

const CITATIONS_PLACEHOLDER = `Source citations shown under the caption. Markdown is supported:

- Author, *Title*, Year
- Or a numbered list
1. First source
2. Second source`;

export type ResourceFormValues = {
  title: string;
  description: string;
  caption: string;
  citations: string;
  type: string;
  duration: string;
  topic: string;
  subTopic: string;
  image: string;
  images: string[];
  mediaUrl: string;
  isFeatured: boolean;
  isFeaturedOnHome: boolean;
  featuredOrder: string;
  featuredOnHomeOrder: string;
  updatedById: string;
};

export const EMPTY_RESOURCE_FORM: ResourceFormValues = {
  title: "",
  description: "",
  caption: "",
  citations: "",
  type: "",
  duration: "",
  topic: "",
  subTopic: "",
  image: "",
  images: [],
  mediaUrl: "",
  isFeatured: false,
  isFeaturedOnHome: false,
  featuredOrder: "",
  featuredOnHomeOrder: "",
  updatedById: "",
};

type Props = {
  form: ResourceFormValues;
  onChange: <K extends keyof ResourceFormValues>(key: K, value: ResourceFormValues[K]) => void;
  topics: string[];
  subTopics: string[];
  types: string[];
  experts?: ExpertOwnerOption[];
  expertsLoading?: boolean;
  showExpertPicker?: boolean;
  submitLabel?: string;
  onSubmit: (body: CreateResourceInput) => Promise<void>;
};

export function formValuesToResourceBody(
  form: ResourceFormValues,
  options?: { includeExpert?: boolean },
): CreateResourceInput {
  const quickRx = isQuickRxType(form.type);
  const images = quickRx ? form.images.map((url) => url.trim()).filter(Boolean) : [];
  const body: CreateResourceInput = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    caption: form.caption.trim() || undefined,
    citations: quickRx ? form.citations.trim() || undefined : undefined,
    type: form.type.trim(),
    duration: form.duration.trim() || undefined,
    topic: form.topic.trim() || undefined,
    subTopic: form.subTopic.trim() || undefined,
    image: quickRx ? images[0] : form.image.trim() || undefined,
    images: quickRx ? images : [],
    mediaUrl: form.mediaUrl.trim() || undefined,
    isFeatured: form.isFeatured,
    isFeaturedOnHome: form.isFeaturedOnHome,
    featuredOrder: parseFeaturedOrderInput(form.featuredOrder),
    featuredOnHomeOrder: parseFeaturedOrderInput(form.featuredOnHomeOrder),
  };
  if (options?.includeExpert) {
    // Empty string clears on update; omit on create so API can default to admin.
    body.updatedById = form.updatedById.trim();
  }
  return body;
}

export function ResourceForm({
  form,
  onChange,
  topics,
  subTopics,
  types,
  experts = [],
  expertsLoading = false,
  showExpertPicker = false,
  submitLabel = "Save resource",
  onSubmit,
}: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(
      formValuesToResourceBody(form, { includeExpert: showExpertPicker }),
    );
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
        sectionLabel="Resources"
      />
      <FeaturedOrderFields
        featuredOrder={form.featuredOrder}
        featuredOnHomeOrder={form.featuredOnHomeOrder}
        onChangeFeaturedOrder={(v) => onChange("featuredOrder", v)}
        onChangeFeaturedOnHomeOrder={(v) => onChange("featuredOnHomeOrder", v)}
      />

      {showExpertPicker && (
        <label>
          Shared by (expert)
          <span className="admin-field-hint">
            Optional — assign an approved expert so their profile shows on this
            resource in the app.
          </span>
          <ExpertUserPicker
            value={form.updatedById}
            experts={experts}
            loading={expertsLoading}
            onChange={(id) => onChange("updatedById", id)}
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

      <MarkdownBodyField
        label="Caption"
        value={form.caption}
        onChange={(v) => onChange("caption", v)}
        rows={3}
        placeholder={CAPTION_PLACEHOLDER}
        hint="Short text under the media or hero — Markdown formatting renders in the app. Available for every resource type."
      />

      {isQuickRxType(form.type) && (
        <MarkdownBodyField
          label="Citations"
          value={form.citations}
          onChange={(v) => onChange("citations", v)}
          rows={4}
          placeholder={CITATIONS_PLACEHOLDER}
          hint="Sources under the caption — lists and emphasis render in the app."
        />
      )}

      {isAudioType(form.type) && (
        <MarkdownBodyField
          label="Transcript"
          value={form.description}
          onChange={(v) => onChange("description", v)}
          placeholder={TRANSCRIPT_PLACEHOLDER}
          hint="Shown when members tap Transcribe — Markdown formatting is supported."
        />
      )}

      {isMicroRxType(form.type) && (
        <MarkdownBodyField
          label="Prompt"
          value={form.description}
          onChange={(v) => onChange("description", v)}
          required
          rows={6}
          placeholder={MICRO_RX_PLACEHOLDER}
          hint="Full Micro RX prompt — Markdown formatting renders in the app."
        />
      )}

      <div className="admin-form-row">
        <label>
          Type *
          <ComboInput
            name="type"
            value={form.type}
            onChange={(v) => onChange("type", v)}
            options={types}
            placeholder="Audio, Video, Article, Quick Rx, Micro Rx…"
            required
          />
        </label>
        <label>
          Duration
          <input
            value={form.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            placeholder="15 min"
          />
        </label>
      </div>

      <div className="admin-form-row">
        <label>
          Topic
          <ComboInput
            name="topic"
            value={form.topic}
            onChange={(v) => onChange("topic", v)}
            options={topics}
            placeholder="Pick from Topic table"
          />
        </label>
        <label>
          Subcategory
          <ComboInput
            name="subTopic"
            value={form.subTopic}
            onChange={(v) => onChange("subTopic", v)}
            options={subTopics}
            placeholder={
              isMicroRxType(form.type)
                ? "Sort order (e.g. 0001)"
                : form.topic
                  ? "Pick or type"
                  : "Choose a topic first"
            }
            disabled={!form.topic && !isMicroRxType(form.type)}
          />
        </label>
      </div>

      {isQuickRxType(form.type) ? (
        <MultipleImageUpload
          folder="resources"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Quick Rx images"
          hint="Add slides in the order members should swipe."
          guide="quick-rx-slide"
        />
      ) : isMicroRxType(form.type) ? null : (
        <ImageUpload
          folder="resources"
          value={form.image}
          onChange={(url) => onChange("image", url)}
          label="Cover image"
          guide="resource-cover"
        />
      )}

      {isArticleType(form.type) && (
        <ArticleBodyField
          value={form.description}
          onChange={(v) => onChange("description", v)}
          required
        />
      )}

      {isVideoType(form.type) && (
        <MediaUpload
          kind="video"
          value={form.mediaUrl}
          onChange={(url) => onChange("mediaUrl", url)}
        />
      )}

      {isAudioType(form.type) && (
        <MediaUpload
          kind="audio"
          value={form.mediaUrl}
          onChange={(url) => onChange("mediaUrl", url)}
        />
      )}

      {submitLabel !== SAVE_CHANGES_LABEL && (
        <AdminFormSubmit label={submitLabel} form={form} />
      )}
    </form>
  );
}
