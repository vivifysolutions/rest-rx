"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function ArticleBodyField({ value, onChange, required }: Props) {
  return (
    <label>
      Article body *
      <textarea
        className="admin-article-body"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={`Write the full article here. Markdown is supported:

## Section heading
**Bold text** and *italic*

- Bullet lists
- Second item

1. Numbered lists
2. Second item

> Blockquote for callouts`}
      />
      <span className="admin-field-hint">
        Supports Markdown — headings, **bold**, lists, and blockquotes render in the app.
      </span>
    </label>
  );
}
