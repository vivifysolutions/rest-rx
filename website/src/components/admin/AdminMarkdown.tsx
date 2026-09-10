"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content?: string | null;
  className?: string;
};

export function AdminMarkdown({ content, className }: Props) {
  const trimmed = content?.trim();
  if (!trimmed) return null;

  return (
    <div className={className ? `admin-detail-markdown ${className}` : "admin-detail-markdown"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
    </div>
  );
}
