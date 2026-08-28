"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailImageGrid,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { deleteEvent, getEventById, updateEvent } from "@/lib/api";
import type { Event } from "@/lib/types";

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [item, setItem] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      setItem(await getEventById(id, token ?? undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load event");
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
    await updateEvent(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete() {
    if (!item || !confirm("Delete this event?")) return;
    const token = await refreshToken();
    await deleteEvent(item.id, token ?? undefined);
    router.push("/admin/events");
  }

  if (loading) return <p>Loading…</p>;
  if (error || !item) return <p className="admin-error">{error ?? "Event not found"}</p>;

  return (
    <AdminDetailLayout
      backHref="/admin/events"
      backLabel="Events"
      title={item.title}
      actions={
        <>
          <button type="button" className="admin-btn" onClick={handleTogglePublish}>
            {item.isPublished ? "Unpublish" : "Publish"}
          </button>
          <Link href={`/admin/events/${item.id}/edit`} className="admin-btn admin-btn-primary">
            Edit
          </Link>
          <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </>
      }
    >
      <DetailSection title="Overview">
        <DetailRow
          label="Owner"
          value={
            item.brandPartnerApplication
              ? item.brandPartnerApplication.companyName ||
                item.brandPartnerApplication.fullName ||
                item.brandPartnerApplication.email
              : "—"
          }
        />
        {item.brandPartnerApplicationId ? (
          <DetailRow label="Application">
            <Link href={`/admin/brand-applications/${item.brandPartnerApplicationId}`}>
              View partner application
            </Link>
          </DetailRow>
        ) : null}
        <DetailRow label="Category" value={item.category ?? "—"} />
        <DetailRow label="Format" value={item.format ?? "—"} />
        <DetailRow label="Location" value={item.location ?? "—"} />
        <DetailRow label="Price" value={item.price == null ? "—" : `$${item.price}`} />
        <DetailRow label="Status">
          <PublishedBadge isPublished={item.isPublished ?? true} />
        </DetailRow>
        <DetailRow
          label="Home"
          value={
            item.isFeaturedOnHome
              ? `Featured · order ${item.featuredOnHomeOrder ?? "unranked"}`
              : "Not featured"
          }
        />
        <DetailRow
          label="Discover"
          value={
            item.isFeatured
              ? `Featured · order ${item.featuredOrder ?? "unranked"}`
              : "Not featured"
          }
        />
        <DetailRow
          label="Start"
          value={item.startDate ? new Date(item.startDate).toLocaleString() : "—"}
        />
        <DetailRow
          label="End"
          value={item.endDate ? new Date(item.endDate).toLocaleString() : "—"}
        />
      </DetailSection>

      {item.description && (
        <DetailSection title="Description">
          <DetailRow label="Content">
            <div className="admin-detail-markdown">{item.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {item.registrationUrl && (
        <DetailSection title="Registration">
          <DetailRow label="Link">
            <a href={item.registrationUrl} target="_blank" rel="noreferrer">
              Open registration page
            </a>
          </DetailRow>
        </DetailSection>
      )}

      <DetailSection title="Photos">
        <DetailRow label="Gallery">
          {item.images?.length || item.image ? (
            <DetailImageGrid
              urls={item.images?.length ? item.images : item.image ? [item.image] : []}
              label="Event photos"
            />
          ) : (
            "—"
          )}
        </DetailRow>
      </DetailSection>
    </AdminDetailLayout>
  );
}
