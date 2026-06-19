"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { uploadImage } from "@/lib/uploadImage";
import type { ImageUploadGuideKey } from "@/components/admin/imageUploadGuides";
import { UploadGuidePanel } from "@/components/admin/UploadGuidePanel";

type Props = {
  folder: string;
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
  guide?: ImageUploadGuideKey;
};

export function MultipleImageUpload({
  folder,
  values,
  onChange,
  label = "Images",
  maxImages = 20,
  guide,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const remaining = maxImages - values.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed.`);
      e.target.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const toUpload = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const file of toUpload) {
        uploaded.push(await uploadImage(file, folder));
      }
      onChange([...values, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  const atLimit = values.length >= maxImages;

  return (
    <div className="admin-upload-field">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: 0 }}>
      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--downriver)" }}>
        {label}
      </span>
      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
        Upload multiple images ({values.length}/{maxImages}). Add slides in the order members should swipe.
      </p>

      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              style={{
                position: "relative",
                width: 120,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #d0dae4",
              }}
            >
              <Image
                src={url}
                alt={`Slide ${index + 1}`}
                fill
                sizes="120px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={uploading}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.65)",
                  color: "white",
                  fontSize: "0.75rem",
                  lineHeight: 1,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "1px 5px",
                  borderRadius: 4,
                }}
              >
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <label
          className="admin-btn admin-btn-primary"
          style={{
            cursor: atLimit || uploading ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: atLimit || uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Uploading…" : "Add images"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFiles}
            disabled={uploading || atLimit}
            style={{ display: "none" }}
          />
        </label>
        {values.length > 0 && (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => onChange([])}
            disabled={uploading}
          >
            Remove all
          </button>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}
      </div>

      {guide ? <UploadGuidePanel guide={guide} /> : null}
    </div>
  );
}

export function isQuickRxType(type: string): boolean {
  const normalized = type.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return normalized === "quickrx";
}

// Prefer importing from `@/components/admin/resourceTypes` in new code.
