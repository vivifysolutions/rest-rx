"use client";

import { useState } from "react";
import { AdminMarkdown } from "@/components/admin/AdminMarkdown";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
};

const DEFAULT_PLACEHOLDER = `Write the full article here. Markdown is supported:

## Section heading
**Bold text** and *italic*

- Bullet lists
- Second item

1. Numbered lists
2. Second item

> Blockquote for callouts`;

/**
 * Large Markdown textarea used for article bodies and other formatted long-form copy.
 */
export function MarkdownBodyField({
  value,
  onChange,
  label = "Article body",
  hint = "Supports Markdown — headings, **bold**, lists, and blockquotes render in the app.",
  placeholder = DEFAULT_PLACEHOLDER,
  required,
  rows,
}: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className="admin-markdown-field">
      <div className="admin-markdown-field-header">
        <span className="admin-field-label">
          {label}
          {required ? " *" : ""}
        </span>
        <div className="admin-markdown-tabs" role="tablist" aria-label={`${label} editor mode`}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "edit"}
            className={mode === "edit" ? "admin-markdown-tab is-active" : "admin-markdown-tab"}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "preview"}
            className={mode === "preview" ? "admin-markdown-tab is-active" : "admin-markdown-tab"}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>
      {hint ? <span className="admin-field-hint">{hint}</span> : null}
      <textarea
        className="admin-article-body"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        placeholder={placeholder}
        hidden={mode === "preview"}
      />
      {mode === "preview" ? (
        value.trim() ? (
          <AdminMarkdown content={value} />
        ) : (
          <p className="admin-empty-hint">Nothing to preview yet.</p>
        )
      ) : null}
    </div>
  );
}

/** Resource article body — same Markdown field with article defaults. */
export function ArticleBodyField({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <MarkdownBodyField
      value={value}
      onChange={onChange}
      label="Article body"
      required={required}
    />
  );
}
