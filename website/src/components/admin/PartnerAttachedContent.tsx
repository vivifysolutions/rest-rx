"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { getBrandPartnerApplications, getDiscounts } from "@/lib/api";
import { getDiscountBadgeLabel } from "@/lib/discountOffer";
import type { Discount } from "@/lib/types";

function belongsToPartner(
  item: { ownerId?: string | null; brandPartnerApplicationId?: string | null },
  userId: string,
  applicationIds: Set<string>,
) {
  if (item.ownerId === userId) return true;
  return Boolean(
    item.brandPartnerApplicationId && applicationIds.has(item.brandPartnerApplicationId),
  );
}

export function PartnerAttachedContent({ userId }: { userId: string }) {
  const { refreshToken } = usePortalAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [discountData, applications] = await Promise.all([
        getDiscounts(token),
        getBrandPartnerApplications(token, { status: "approved" }).catch(() => []),
      ]);
      const applicationIds = new Set(
        applications.filter((app) => app.userId === userId).map((app) => app.id),
      );
      setDiscounts(
        (Array.isArray(discountData) ? discountData : []).filter((item) =>
          belongsToPartner(item, userId, applicationIds),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load partner discounts");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="admin-card" style={{ marginTop: "1rem" }}>
      <h2 className="admin-detail-section-title">
        Discounts {loading ? "" : `(${discounts.length})`}
      </h2>
      {error ? (
        <p className="admin-error">{error}</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : discounts.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          No discounts are linked to this partner yet.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand / business name</th>
                <th>Offer</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((item) => (
                <tr key={item.id}>
                  <td>
                    <AdminTitleLink href={`/admin/discounts/${item.id}`}>
                      {item.title}
                    </AdminTitleLink>
                  </td>
                  <td>{getDiscountBadgeLabel(item) ?? "—"}</td>
                  <td>{item.category || "—"}</td>
                  <td>
                    <PublishedBadge isPublished={item.isPublished} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
