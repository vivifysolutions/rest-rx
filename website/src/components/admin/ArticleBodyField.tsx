"use client";

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
  return (
    <label>
      <span className="admin-field-label">
        {label}
        {required ? " *" : ""}
      </span>
      {hint ? <span className="admin-field-hint">{hint}</span> : null}
      <textarea
        className="admin-article-body"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
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
