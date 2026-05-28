"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ComboInput } from "@/components/admin/ComboInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useReferenceData } from "@/hooks/useReferenceData";
import {
  createRetreat,
  getRetreatLocations,
  getRetreatSeasons,
  getRetreats,
} from "@/lib/api";
import type { CreateRetreatInput, Retreat } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  season: "",
  location: "",
  latitude: "",
  longitude: "",
  rating: "",
  image: "",
  startDate: "",
  endDate: "",
  isFeatured: false,
};

export default function AdminRetreatsPage() {
  const { refreshToken } = usePortalAuth();
  const { data: refData } = useReferenceData();
  const [items, setItems] = useState<Retreat[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
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
    const [data, locs, sns] = await Promise.allSettled([
      getRetreats(token ?? undefined),
      getRetreatLocations(),
      getRetreatSeasons(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      console.error("[Portal] getRetreats failed:", data.reason);
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load retreats",
      );
    }
    if (locs.status === "fulfilled") setLocations(locs.value);
    else console.error("[Portal] getRetreatLocations failed:", locs.reason);
    if (sns.status === "fulfilled") setSeasons(sns.value);
    else console.error("[Portal] getRetreatSeasons failed:", sns.reason);
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
      const body: CreateRetreatInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        season: form.season.trim() || undefined,
        location: form.location.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        image: form.image.trim() || undefined,
        isFeatured: form.isFeatured,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };
      await createRetreat(body, token ?? undefined);
      setSuccess("Retreat created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create retreat");
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Retreats"
        description="Retreat listings for the Discover experience. Form mirrors the Retreat model."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add retreat</h2>
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
              Category
              <ComboInput
                name="category"
                value={form.category}
                onChange={(v) => update("category", v)}
                options={refData.retreats}
                placeholder="yoga, spa, meditation…"
              />
            </label>
            <label>
              Season
              <ComboInput
                name="season"
                value={form.season}
                onChange={(v) => update("season", v)}
                options={seasons}
                placeholder="spring, summer…"
              />
            </label>
          </div>

          <label>
            Location
            <ComboInput
              name="location"
              value={form.location}
              onChange={(v) => update("location", v)}
              options={locations}
              placeholder="City, region, or venue"
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
            Rating (0–5)
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.rating}
              onChange={(e) => update("rating", e.target.value)}
            />
          </label>

          <ImageUpload
            folder="retreats"
            value={form.image}
            onChange={(url) => update("image", url)}
          />

          <div className="admin-form-row">
            <label>
              Start
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </label>
          </div>

          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
            />
            Featured
          </label>

          <button type="submit" className="admin-btn admin-btn-primary">
            Create retreat
          </button>
        </form>
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>All retreats</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Season</th>
                <th>Location</th>
                <th>Start</th>
                <th>Rating</th>
                <th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.category ?? "—"}</td>
                  <td>{r.season ?? "—"}</td>
                  <td>{r.location ?? "—"}</td>
                  <td>
                    {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td>{r.rating ?? "—"}</td>
                  <td>{r.isFeatured ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
