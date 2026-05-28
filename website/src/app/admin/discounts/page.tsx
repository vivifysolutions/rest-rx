"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ComboInput } from "@/components/admin/ComboInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useReferenceData } from "@/hooks/useReferenceData";
import {
  createDiscount,
  deleteDiscount,
  getDiscountLocations,
  getDiscountTiers,
  getDiscounts,
} from "@/lib/api";
import type { CreateDiscountInput, Discount } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  description: "",
  percentage: "",
  category: "",
  location: "",
  latitude: "",
  longitude: "",
  tier: "",
  claimLink: "",
  image: "",
  isFeatured: false,
  expiryDate: "",
};

export default function AdminDiscountsPage() {
  const { refreshToken } = usePortalAuth();
  const { data: refData } = useReferenceData();
  const [items, setItems] = useState<Discount[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, locs, tiersList] = await Promise.allSettled([
      getDiscounts(token ?? undefined),
      getDiscountLocations(),
      getDiscountTiers(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      console.error("[Portal] getDiscounts failed:", data.reason);
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load discounts",
      );
    }
    if (locs.status === "fulfilled") setLocations(locs.value);
    else console.error("[Portal] getDiscountLocations failed:", locs.reason);
    if (tiersList.status === "fulfilled") setTiers(tiersList.value);
    else console.error("[Portal] getDiscountTiers failed:", tiersList.reason);
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      const body: CreateDiscountInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        percentage: Number(form.percentage),
        category: form.category.trim(),
        location: form.location.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        tier: form.tier.trim() || undefined,
        claimLink: form.claimLink.trim() || undefined,
        image: form.image.trim() || undefined,
        isFeatured: form.isFeatured,
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : undefined,
      };
      await createDiscount(body, token ?? undefined);
      setSuccess("Discount created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discount");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount?")) return;
    setError(null);
    try {
      const token = await refreshToken();
      await deleteDiscount(id, token ?? undefined);
      setSuccess("Discount deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Discounts"
        description="Partner perks shown in the mobile app. Form mirrors the Discount model in Prisma."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add discount</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <label>
            Title *
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>

          <div className="admin-form-row">
            <label>
              Percentage off (0–100) *
              <input
                type="number"
                min={0}
                max={100}
                value={form.percentage}
                onChange={(e) => update("percentage", e.target.value)}
                required
              />
            </label>
            <label>
              Tier
              <ComboInput
                name="tier"
                value={form.tier}
                onChange={(v) => update("tier", v)}
                options={tiers}
                placeholder="e.g. gold, silver"
              />
            </label>
          </div>

          <label>
            Category *
            <ComboInput
              name="category"
              value={form.category}
              onChange={(v) => update("category", v)}
              options={refData.discounts}
              placeholder="Pick or type — e.g. fitness, food, wellness"
              required
            />
          </label>

          <label>
            Location
            <ComboInput
              name="location"
              value={form.location}
              onChange={(v) => update("location", v)}
              options={locations}
              placeholder="City or address"
            />
          </label>

          <div className="admin-form-row">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
              />
            </label>
          </div>

          <label>
            Claim link
            <input
              type="url"
              value={form.claimLink}
              onChange={(e) => update("claimLink", e.target.value)}
              placeholder="https://partner.com/redeem/..."
            />
          </label>

          <ImageUpload
            folder="discounts"
            value={form.image}
            onChange={(url) => update("image", url)}
          />

          <label>
            Expiry date
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => update("expiryDate", e.target.value)}
            />
          </label>

          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
            />
            Featured
          </label>

          <button type="submit" className="admin-btn admin-btn-primary">
            Create discount
          </button>
        </form>
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
                <th>Location</th>
                <th>Tier</th>
                <th>Featured</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.percentage}%</td>
                  <td>{d.category}</td>
                  <td>{d.location ?? "—"}</td>
                  <td>{d.tier ?? "—"}</td>
                  <td>{d.isFeatured ? "Yes" : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDelete(d.id)}
                    >
                      Delete
                    </button>
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
