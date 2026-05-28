"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { uploadImage } from "@/lib/uploadImage";

type Props = {
  /** Storage folder, e.g. "discounts", "events", "resources", "retreats". */
  folder: string;
  /** Current value (download URL). */
  value: string;
  /** Called whenever the URL changes (upload finishes or admin pastes a URL). */
  onChange: (url: string) => void;
  label?: string;
};

/**
 * File-picker that uploads the chosen image to Firebase Storage and stores
 * the resulting download URL. Also accepts a pasted URL for content that
 * lives on a CDN/external site.
 */
export function ImageUpload({ folder, value, onChange, label = "Image" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--downriver)" }}>
        {label}
      </span>

      {value && (
        <div
          style={{
            position: "relative",
            width: 160,
            height: 110,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #d0dae4",
            background: "#f8fafc",
          }}
        >
          <Image
            src={value}
            alt="preview"
            fill
            sizes="160px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <label
          className="admin-btn admin-btn-primary"
          style={{ cursor: "pointer", fontWeight: 600 }}
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        {value && (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => onChange("")}
            disabled={uploading}
          >
            Remove
          </button>
        )}
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        disabled={uploading}
      />

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}
