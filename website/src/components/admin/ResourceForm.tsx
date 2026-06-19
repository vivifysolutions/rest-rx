"use client";

import { FormEvent } from "react";
import { ComboInput } from "@/components/admin/ComboInput";
import { ArticleBodyField } from "@/components/admin/ArticleBodyField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MultipleImageUpload } from "@/components/admin/MultipleImageUpload";
import { MediaUpload } from "@/components/admin/MediaUpload";
import {
  isArticleType,
  isAudioType,
  isQuickRxType,
  isVideoType,
} from "@/components/admin/resourceTypes";
import type { CreateResourceInput } from "@/lib/types";

export type ResourceFormValues = {
  title: string;
  description: string;
  type: string;
  duration: string;
  topic: string;
  subTopic: string;
  image: string;
  images: string[];
  mediaUrl: string;
  isFeatured: boolean;
};

export const EMPTY_RESOURCE_FORM: ResourceFormValues = {
  title: "",
  description: "",
  type: "",
  duration: "",
  topic: "",
  subTopic: "",
  image: "",
  images: [],
  mediaUrl: "",
  isFeatured: false,
};

type Props = {
  form: ResourceFormValues;
  onChange: <K extends keyof ResourceFormValues>(key: K, value: ResourceFormValues[K]) => void;
  topics: string[];
  subTopics: string[];
  types: string[];
  submitLabel?: string;
  onSubmit: (body: CreateResourceInput) => Promise<void>;
};

export function formValuesToResourceBody(form: ResourceFormValues): CreateResourceInput {
  const quickRx = isQuickRxType(form.type);
  const images = quickRx ? form.images.map((url) => url.trim()).filter(Boolean) : [];
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    type: form.type.trim(),
    duration: form.duration.trim() || undefined,
    topic: form.topic.trim() || undefined,
    subTopic: form.subTopic.trim() || undefined,
    image: quickRx ? images[0] : form.image.trim() || undefined,
    images: quickRx ? images : [],
    mediaUrl: form.mediaUrl.trim() || undefined,
    isFeatured: form.isFeatured,
  };
}

export function ResourceForm({
  form,
  onChange,
  topics,
  subTopics,
  types,
  submitLabel = "Save resource",
  onSubmit,
}: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(formValuesToResourceBody(form));
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

      {!isArticleType(form.type) && (
        <label>
          {isAudioType(form.type) ? "Transcript / description" : "Description"}
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={
              isAudioType(form.type)
                ? "Optional transcript shown when members tap Transcribe"
                : "Optional short summary"
            }
          />
        </label>
      )}

      <div className="admin-form-row">
        <label>
          Type *
          <ComboInput
            name="type"
            value={form.type}
            onChange={(v) => onChange("type", v)}
            options={types}
            placeholder="Audio, Video, Article, Quick Rx…"
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
            placeholder={form.topic ? "Pick or type" : "Choose a topic first"}
            disabled={!form.topic}
          />
        </label>
      </div>

      {isQuickRxType(form.type) ? (
        <MultipleImageUpload
          folder="resources"
          values={form.images}
          onChange={(urls) => onChange("images", urls)}
          label="Quick Rx images"
        />
      ) : (
        <ImageUpload
          folder="resources"
          value={form.image}
          onChange={(url) => onChange("image", url)}
          label="Cover image"
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
