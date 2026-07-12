"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailImage,
  DetailImageGrid,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import {
  isArticleType,
  isAudioType,
  isMicroRxType,
  isQuickRxType,
  isVideoType,
} from "@/components/admin/resourceTypes";
import { deleteResource, getResourceById, updateResource } from "@/lib/api";
import type { Resource } from "@/lib/types";

export default function AdminResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [item, setItem] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      const data = await getResourceById(id, token ?? undefined);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resource");
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
    await updateResource(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete() {
    if (!item || !confirm("Delete this resource?")) return;
    const token = await refreshToken();
    await deleteResource(item.id, token ?? undefined);
    router.push("/admin/resources");
  }

  if (loading) return <p>Loading…</p>;
  if (error || !item) return <p className="admin-error">{error ?? "Resource not found"}</p>;

  const quickRx = isQuickRxType(item.type);
  const microRx = isMicroRxType(item.type);
  const images =
    item.images?.length ? item.images : quickRx && item.image ? [item.image] : item.image ? [item.image] : [];

  return (
    <AdminDetailLayout
      backHref={microRx ? "/admin/micro-rx" : "/admin/resources"}
      backLabel={microRx ? "Micro RX" : "Resources"}
      title={item.title}
      actions={
        <>
          <button type="button" className="admin-btn" onClick={handleTogglePublish}>
            {item.isPublished ? "Unpublish" : "Publish"}
          </button>
          <Link href={`/admin/resources/${item.id}/edit`} className="admin-btn admin-btn-primary">
            Edit
          </Link>
          <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Type" value={item.type} />
        <DetailRow label="Status">
          <PublishedBadge isPublished={item.isPublished ?? true} />
        </DetailRow>
        <DetailRow label="Featured" value={item.isFeatured ? "Yes" : "No"} />
        <DetailRow label="Duration" value={item.duration ?? "—"} />
        <DetailRow label="Topic" value={item.topic ?? "—"} />
        <DetailRow
          label={microRx ? "Sort order" : "Subcategory"}
          value={item.subTopic ?? "—"}
        />
        <DetailRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
        <DetailRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
      </DetailSection>

      {(microRx || (!isArticleType(item.type) && item.description)) && (
        <DetailSection title={microRx ? "Prompt" : isAudioType(item.type) ? "Transcript / description" : "Description"}>
          <DetailRow label="Content">
            <div className="admin-detail-markdown">{item.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {isArticleType(item.type) && item.description && (
        <DetailSection title="Article body">
          <DetailRow label="Content">
            <div className="admin-detail-markdown">{item.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {!microRx && (
      <DetailSection title={quickRx ? "Quick Rx images" : "Cover image"}>
        <DetailRow label="Preview">
          {quickRx ? (
            <DetailImageGrid urls={images} label="Quick Rx images" />
          ) : images[0] ? (
            <DetailImage src={images[0]} alt={item.title} />
          ) : (
            "—"
          )}
        </DetailRow>
      </DetailSection>
      )}

      {(isVideoType(item.type) || isAudioType(item.type)) && (
        <DetailSection title="Media">
          <DetailRow
            label={isVideoType(item.type) ? "Video" : "Audio"}
            value={item.mediaUrl ? "File attached" : "—"}
          />
        </DetailSection>
      )}
    </AdminDetailLayout>
  );
}
