"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import {
  DiscountForm,
  EMPTY_DISCOUNT_FORM,
  type DiscountFormValues,
} from "@/components/discounts/DiscountForm";
import {
  createDiscount,
  deleteDiscount,
  getCategories,
  getDiscounts,
  updateDiscount,
} from "@/lib/api";
import { formatDiscountTierLabel } from "@/lib/reference-data";
import type { CreateDiscountInput, Discount } from "@/lib/types";

export default function AdminDiscountsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
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
    else {
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load discounts",
      );
    }
    if (categoriesList.status === "fulfilled") {
      setCategories(categoriesList.value.map((c) => ({ value: c.name, label: c.name })));
    }
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(body: CreateDiscountInput) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createDiscount(body, token ?? undefined);
      setSuccess("Discount created.");
      setForm(EMPTY_DISCOUNT_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discount");
      throw err;
    }
  }

  async function handleTogglePublish(item: Discount) {
    const token = await refreshToken();
    await updateDiscount(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount?")) return;
    const token = await refreshToken();
    await deleteDiscount(id, token ?? undefined);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Discounts"
        description="Partner perks and brand partnerships shown in the mobile app."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add discount</h2>
        <DiscountForm
          form={form}
          onChange={update}
          categoryOptions={categories}
          showFeatured
          submitLabel="Create discount"
          onSubmit={handleCreate}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>All discounts</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>%</th>
                <th>Category</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>
                    <AdminTitleLink href={`/admin/discounts/${d.id}`}>{d.title}</AdminTitleLink>
                  </td>
                  <td>{d.percentage}%</td>
                  <td>{d.category}</td>
                  <td>{formatDiscountTierLabel(d.tier)}</td>
                  <td>
                    <PublishedBadge isPublished={d.isPublished ?? true} />
                  </td>
                  <td>{d.isFeatured ? "Yes" : "—"}</td>
                  <td>
                    <ContentRowActions
                      isPublished={d.isPublished ?? true}
                      onTogglePublish={() => handleTogglePublish(d)}
                      editHref={`/admin/discounts/${d.id}/edit`}
                      onDelete={() => handleDelete(d.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
