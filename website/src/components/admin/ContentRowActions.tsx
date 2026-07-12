"use client";

import Link from "next/link";

type ContentRowActionsProps = {
  isPublished: boolean;
  onTogglePublish: () => void;
  editHref?: string;
  onEdit?: () => void;
  onDelete: () => void;
  publishLabel?: string;
};

export function ContentRowActions({
  isPublished,
  onTogglePublish,
  editHref,
  onEdit,
  onDelete,
}: ContentRowActionsProps) {
  return (
    <div className="admin-row-actions">
      <button
        type="button"
        className={`admin-btn admin-btn-sm ${isPublished ? "" : "admin-btn-primary"}`}
        onClick={onTogglePublish}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      {editHref ? (
        <Link href={editHref} className="admin-btn admin-btn-sm">
          Edit
        </Link>
      ) : (
        <button type="button" className="admin-btn admin-btn-sm" onClick={onEdit}>
          Edit
        </button>
      )}
      <button
        type="button"
        className="admin-btn admin-btn-sm admin-btn-danger"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

export function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span className={`admin-badge ${isPublished ? "admin-badge-success" : "admin-badge-muted"}`}>
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}
