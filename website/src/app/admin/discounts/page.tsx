"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import { FeaturedDiscountLineup, type FeaturedSurface } from "@/components/admin/FeaturedDiscountLineup";
import { featuredPlacementLabel } from "@/components/admin/FeaturedLineup";
import {
  DiscountForm,
  EMPTY_DISCOUNT_FORM,
  type DiscountFormValues,
} from "@/components/discounts/DiscountForm";
import type { BrandPartnerOption } from "@/components/discounts/BrandPartnerPicker";
import {
  createDiscount,
  deleteDiscount,
  getBrandPartnerApplications,
  getCategories,
  getDiscounts,
  updateDiscount,
} from "@/lib/api";
import { compareBoolDesc, compareNullableNumberAsc, compareText, sortBy } from "@/lib/admin-sort";
import { getDiscountBadgeLabel } from "@/lib/discountOffer";
import { toPartnerOwnerOptions } from "@/lib/partner-owner";
import { formatDiscountTierLabel, DISCOUNT_TIERS_ENABLED } from "@/lib/reference-data";
import type { CreateDiscountInput, Discount } from "@/lib/types";
import { labelApplicationTypeShort } from "@/lib/partner-application-options";

type DiscountSort = "name" | "category" | "featured" | "homeOrder" | "discoverOrder" | "status";

const SORT_OPTIONS: { value: DiscountSort; label: string }[] = [
  { value: "name", label: "Brand / business name" },
  { value: "category", label: "Category" },
  { value: "featured", label: "Featured first" },
  { value: "homeOrder", label: "Home order" },
  { value: "discoverOrder", label: "Discover order" },
  { value: "status", label: "Status" },
];

function partnerName(d: Discount): string {
  const app = d.brandPartnerApplication;
  if (!app) return "—";
  const name = app.companyName.trim() || app.fullName.trim() || app.email || "—";
  const type = app.applicationType
    ? ` (${labelApplicationTypeShort(app.applicationType as "brand_partner" | "expert" | "foundation" | "ambassador")})`
    : "";
  return `${name}${type}`;
}

export default function AdminDiscountsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [partners, setPartners] = useState<BrandPartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountFormValues>(EMPTY_DISCOUNT_FORM);
  const [sortByKey, setSortByKey] = useState<DiscountSort>("name");
  const [moving, setMoving] = useState<{ surface: FeaturedSurface; id: string } | null>(null);

  const update = <K extends keyof DiscountFormValues>(k: K, v: DiscountFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "category":
            return compareText(a.category, b.category) || compareText(a.title, b.title);
          case "featured":
            return (
              compareBoolDesc(Boolean(a.isFeaturedOnHome || a.isFeatured), Boolean(b.isFeaturedOnHome || b.isFeatured)) ||
              compareText(a.title, b.title)
            );
          case "homeOrder":
            return (
              compareBoolDesc(a.isFeaturedOnHome, b.isFeaturedOnHome) ||
              compareNullableNumberAsc(a.featuredOnHomeOrder, b.featuredOnHomeOrder) ||
              compareText(a.title, b.title)
            );
          case "discoverOrder":
            return (
              compareBoolDesc(a.isFeatured, b.isFeatured) ||
              compareNullableNumberAsc(a.featuredOrder, b.featuredOrder) ||
              compareText(a.title, b.title)
            );
          case "status": {
            const aPub = a.isPublished ?? true;
            const bPub = b.isPublished ?? true;
            return Number(bPub) - Number(aPub) || compareText(a.title, b.title);
          }
          case "name":
          default:
            return compareText(a.title, b.title);
        }
      }),
    [items, sortByKey],
  );

  const loadPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const token = await refreshToken();
      if (!token) {
        setPartners([]);
        return;
      }
      const apps = await getBrandPartnerApplications(token, { status: "approved" });
      setPartners(toPartnerOwnerOptions(apps));
    } catch {
      setPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  }, [refreshToken]);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
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
    if (!opts?.quiet) setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
    loadPartners();
  }, [load, loadPartners]);

  async function handleCreate(body: CreateDiscountInput) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createDiscount(body, token ?? undefined);
      setSuccess(
        body.brandPartnerApplicationId
          ? "Discount created and linked to brand partner."
          : "Discount created.",
      );
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

  async function handleMoveLineup(
    surface: FeaturedSurface,
    orderedLiveIds: string[],
    fromIndex: number,
    direction: -1 | 1,
  ) {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedLiveIds.length) return;
    const next = [...orderedLiveIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const field = surface === "home" ? "featuredOnHomeOrder" : "featuredOrder";
    setMoving({ surface, id: moved });
    setError(null);
    try {
      const token = await refreshToken();
      await Promise.all(
        next.map((id, index) => updateDiscount(id, { [field]: index + 1 }, token ?? undefined)),
      );
      await load({ quiet: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update featured order");
    } finally {
      setMoving(null);
    }
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
        description="Member discounts and partner offers shown in the mobile app. Link offers to approved brand partners when creating on their behalf."
      />

      <FeaturedDiscountLineup
        discounts={items}
        loading={loading}
        moving={moving}
        onMove={handleMoveLineup}
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add discount</h2>
        <DiscountForm
          form={form}
          onChange={update}
          categoryOptions={categories}
          showFeatured
          showPartnerPicker
          brandPartners={partners}
          brandPartnersLoading={partnersLoading}
          submitLabel="Create discount"
          onSubmit={handleCreate}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>All discounts</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand or business name</th>
                <th>Partner</th>
                <th>Badge</th>
                <th>Category</th>
                {DISCOUNT_TIERS_ENABLED ? <th>Tier</th> : null}
                <th>Status</th>
                <th>Featured</th>
                <th>Discover order</th>
                <th>Home order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id}>
                  <td>
                    <AdminTitleLink href={`/admin/discounts/${d.id}`}>{d.title}</AdminTitleLink>
                  </td>
                  <td>{partnerName(d)}</td>
                  <td>{getDiscountBadgeLabel(d) ?? "—"}</td>
                  <td>{d.category}</td>
                  {DISCOUNT_TIERS_ENABLED ? <td>{formatDiscountTierLabel(d.tier)}</td> : null}
                  <td>
                    <PublishedBadge isPublished={d.isPublished ?? true} />
                  </td>
                  <td>{featuredPlacementLabel(d)}</td>
                  <td>{d.featuredOrder ?? "—"}</td>
                  <td>{d.featuredOnHomeOrder ?? "—"}</td>
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
