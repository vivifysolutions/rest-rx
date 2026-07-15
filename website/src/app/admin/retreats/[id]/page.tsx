"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailImage,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { deleteRetreat, getRetreatById, updateRetreat } from "@/lib/api";
import type { Retreat } from "@/lib/types";

export default function AdminRetreatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [item, setItem] = useState<Retreat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      setItem(await getRetreatById(id, token ?? undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load retreat");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTogglePublish() {
    if (!item) return;
    const token = await refreshToken();
    await updateRetreat(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete() {
    if (!item || !confirm("Delete this retreat?")) return;
    const token = await refreshToken();
    await deleteRetreat(item.id, token ?? undefined);
    router.push("/admin/retreats");
  }

  if (loading) return <p>Loading…</p>;
  if (error || !item) return <p className="admin-error">{error ?? "Retreat not found"}</p>;

  return (
    <AdminDetailLayout
      backHref="/admin/retreats"
      backLabel="Retreats"
      title={item.title}
      actions={
        <>
          <button type="button" className="admin-btn" onClick={handleTogglePublish}>
            {item.isPublished ? "Unpublish" : "Publish"}
          </button>
          <Link href={`/admin/retreats/${item.id}/edit`} className="admin-btn admin-btn-primary">
            Edit
          </Link>
          <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Category" value={item.category ?? "—"} />
        <DetailRow label="Season" value={item.season ?? "—"} />
        <DetailRow label="Location" value={item.location ?? "—"} />
        <DetailRow label="Rating" value={item.rating ?? "—"} />
        <DetailRow label="Status">
          <PublishedBadge isPublished={item.isPublished ?? true} />
        </DetailRow>
        <DetailRow label="Featured" value={item.isFeatured ? "Yes" : "No"} />
        <DetailRow
          label="Start"
          value={item.startDate ? new Date(item.startDate).toLocaleDateString() : "—"}
        />
        <DetailRow
          label="End"
          value={item.endDate ? new Date(item.endDate).toLocaleDateString() : "—"}
        />
      </DetailSection>

      {item.description && (
        <DetailSection title="Description">
          <DetailRow label="Content">
            <div className="admin-detail-markdown">{item.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {item.joinInstructions && (
        <DetailSection title="How to join">
          <DetailRow label="Instructions">
            <div className="admin-detail-markdown">{item.joinInstructions}</div>
          </DetailRow>
        </DetailSection>
      )}

      <DetailSection title="Booking">
        <DetailRow label="URL" value={item.bookingUrl ?? "—"} />
      </DetailSection>

      <DetailSection title="Image">
        <DetailRow label="Preview">
          {item.image ? <DetailImage src={item.image} alt={item.title} /> : "—"}
        </DetailRow>
      </DetailSection>
    </AdminDetailLayout>
  );
}
