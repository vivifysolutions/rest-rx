"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  DiscountForm,
  EMPTY_DISCOUNT_FORM,
  type DiscountFormValues,
} from "@/components/discounts/DiscountForm";
import {
  createDiscount,
  getCategories,
  getDiscounts,
  type Category,
} from "@/lib/api";
import { getDiscountBadgeLabel } from "@/lib/discountOffer";
import { formatDiscountTierLabel, DISCOUNT_TIERS_ENABLED } from "@/lib/reference-data";
import type { CreateDiscountInput, Discount } from "@/lib/types";

export default function BrandDiscountsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountFormValues>(EMPTY_DISCOUNT_FORM);

  const update = <K extends keyof DiscountFormValues>(k: K, v: DiscountFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, categoriesList] = await Promise.allSettled([
      getDiscounts(token ?? undefined),
      getCategories("DISCOUNT"),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    if (categoriesList.status === "fulfilled") setCategories(categoriesList.value);
    else {
      setError(
        categoriesList.reason instanceof Error
          ? categoriesList.reason.message
          : "Failed to load categories",
      );
    }
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));

  async function handleCreate(body: CreateDiscountInput) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createDiscount(body, token ?? undefined);
      setSuccess("Discount submitted for review. Our team will publish it in the app once approved.");
      setForm(EMPTY_DISCOUNT_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit discount");
      throw err;
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Partner discounts"
        description="Submit discount offers for Rest & Rx members. Each offer is reviewed before it appears in the mobile app."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Submit a discount</h2>
        <p className="admin-callout" style={{ marginBottom: "0.75rem" }}>
          Use the fields below after your discovery call. New discounts stay pending until the Rest
          &amp; Rx team publishes them.
        </p>
        {categories.length === 0 && !loading ? (
          <p className="admin-error">
            Discount categories could not be loaded. Check the API connection and try again.
          </p>
        ) : (
          <DiscountForm
            form={form}
            onChange={update}
            categoryOptions={categoryOptions}
            submitLabel="Submit for review"
            onSubmit={handleCreate}
          />
        )}
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Your discounts</h2>
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No discounts submitted yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand or business name</th>
                <th>Badge</th>
                <th>Category</th>
                {DISCOUNT_TIERS_ENABLED ? <th>Tier</th> : null}
                <th>Status</th>
                <th>Views</th>
                <th>Saves</th>
                <th>Redemptions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{getDiscountBadgeLabel(d) ?? "—"}</td>
                  <td>{d.category}</td>
                  {DISCOUNT_TIERS_ENABLED ? <td>{formatDiscountTierLabel(d.tier)}</td> : null}
                  <td>{d.isPublished ? "Live in app" : "Pending review"}</td>
                  <td>{d.views ?? 0}</td>
                  <td>{d._count?.saves ?? 0}</td>
                  <td>{d._count?.redemptions ?? 0}</td>
                  <td>
                    <Link href={`/brand/discounts/${d.id}/edit`} className="admin-btn">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Questions about discount setup? Contact the Rest &amp; Rx team — that&apos;s what the
        discovery call is for.
      </p>
    </>
  );
}
