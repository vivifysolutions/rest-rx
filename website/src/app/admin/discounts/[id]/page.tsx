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
import { deleteDiscount, getDiscountById, updateDiscount } from "@/lib/api";
import { formatDiscountTierLabel } from "@/lib/reference-data";
import type { Discount } from "@/lib/types";

export default function AdminDiscountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [item, setItem] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      setItem(await getDiscountById(id, token ?? undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discount");
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
    await updateDiscount(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete() {
    if (!item || !confirm("Delete this discount?")) return;
    const token = await refreshToken();
    await deleteDiscount(item.id, token ?? undefined);
    router.push("/admin/discounts");
  }

  if (loading) return <p>Loading…</p>;
  if (error || !item) return <p className="admin-error">{error ?? "Discount not found"}</p>;

  return (
    <AdminDetailLayout
      backHref="/admin/discounts"
      backLabel="Partnerships"
      title={item.title}
      actions={
        <>
          <button type="button" className="admin-btn" onClick={handleTogglePublish}>
            {item.isPublished ? "Unpublish" : "Publish"}
          </button>
          <Link href={`/admin/discounts/${item.id}/edit`} className="admin-btn admin-btn-primary">
            Edit
          </Link>
          <button type="button" className="admin-btn admin-btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Percentage" value={`${item.percentage}%`} />
        <DetailRow label="Category" value={item.category} />
        <DetailRow label="Tier" value={formatDiscountTierLabel(item.tier)} />
        <DetailRow label="Location" value={item.location ?? "—"} />
        <DetailRow label="Status">
          <PublishedBadge isPublished={item.isPublished ?? true} />
        </DetailRow>
        <DetailRow label="Featured" value={item.isFeatured ? "Yes" : "No"} />
        <DetailRow
          label="Expires"
          value={item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}
        />
      </DetailSection>

      {item.description && (
        <DetailSection title="Description">
          <DetailRow label="Content">
            <div className="admin-detail-markdown">{item.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {item.claimLink && (
        <DetailSection title="Claim link">
          <DetailRow label="URL">
            <a href={item.claimLink} target="_blank" rel="noreferrer">
              Open claim page
            </a>
          </DetailRow>
        </DetailSection>
      )}

      <DetailSection title="Image">
        <DetailRow label="Preview">
          {item.image ? <DetailImage src={item.image} alt={item.title} /> : "—"}
        </DetailRow>
      </DetailSection>
    </AdminDetailLayout>
  );
}
