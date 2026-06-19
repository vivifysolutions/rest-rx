"use client";

import { ChangeEvent, useState } from "react";
import { uploadResourceMedia, type MediaKind } from "@/lib/uploadMedia";

type Props = {
  kind: MediaKind;
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function MediaUpload({ kind, value, onChange, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLabel = kind === "video" ? "Video file" : "Audio file";
  const hint =
    kind === "video"
      ? "MP4, MOV, or WEBM — max 100 MB"
      : "MP3, M4A, WAV, or AAC — max 100 MB";

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadResourceMedia(file, kind);
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
        {label ?? defaultLabel}
      </span>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{hint}</p>

      {value && (
        <p style={{ fontSize: "0.8rem", color: "var(--astral)", margin: 0 }}>
          {kind === "video" ? "Video uploaded" : "Audio uploaded"}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <label
          className="admin-btn admin-btn-primary"
          style={{ cursor: "pointer", fontWeight: 600 }}
        >
          {uploading ? "Uploading…" : value ? "Replace file" : "Upload file"}
          <input
            type="file"
            accept={
              kind === "video"
                ? "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                : "audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,audio/aac,.mp3,.m4a,.wav,.aac"
            }
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

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}
