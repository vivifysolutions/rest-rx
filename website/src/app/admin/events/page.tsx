"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ComboInput } from "@/components/admin/ComboInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useReferenceData } from "@/hooks/useReferenceData";
import {
  createEvent,
  getEventFormats,
  getEventLocations,
  getEvents,
} from "@/lib/api";
import type { CreateEventInput, Event } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  format: "",
  location: "",
  latitude: "",
  longitude: "",
  price: "",
  registrationUrl: "",
  image: "",
  startDate: "",
  endDate: "",
  isFeatured: false,
};

export default function AdminEventsPage() {
  const { refreshToken } = usePortalAuth();
  const { data: refData } = useReferenceData();
  const [items, setItems] = useState<Event[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
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
    const [data, locs, fmts] = await Promise.allSettled([
      getEvents(token ?? undefined),
      getEventLocations(),
      getEventFormats(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      console.error("[Portal] getEvents failed:", data.reason);
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load events",
      );
    }
    if (locs.status === "fulfilled") setLocations(locs.value);
    else console.error("[Portal] getEventLocations failed:", locs.reason);
    if (fmts.status === "fulfilled") setFormats(fmts.value);
    else console.error("[Portal] getEventFormats failed:", fmts.reason);
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
      const body: CreateEventInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        format: form.format.trim() || undefined,
        location: form.location.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        price: form.price ? Number(form.price) : undefined,
        registrationUrl: form.registrationUrl.trim() || undefined,
        image: form.image.trim() || undefined,
        isFeatured: form.isFeatured,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };
      await createEvent(body, token ?? undefined);
      setSuccess("Event created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Events"
        description="Workshops, webinars, and gatherings shown in the app. Form mirrors the Event model."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add event</h2>
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
                options={refData.events}
                placeholder="workshop, webinar, panel…"
              />
            </label>
            <label>
              Format
              <ComboInput
                name="format"
                value={form.format}
                onChange={(v) => update("format", v)}
                options={formats}
                placeholder="in-person, virtual…"
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
              placeholder="City, venue, or 'Online'"
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

          <div className="admin-form-row">
            <label>
              Price (USD)
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0 for free"
              />
            </label>
            <label>
              Registration URL
              <input
                type="url"
                value={form.registrationUrl}
                onChange={(e) => update("registrationUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Start
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </label>
          </div>

          <ImageUpload
            folder="events"
            value={form.image}
            onChange={(url) => update("image", url)}
          />

          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
            />
            Featured
          </label>

          <button type="submit" className="admin-btn admin-btn-primary">
            Create event
          </button>
        </form>
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>All events</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Format</th>
                <th>Location</th>
                <th>Start</th>
                <th>Price</th>
                <th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{ev.category ?? "—"}</td>
                  <td>{ev.format ?? "—"}</td>
                  <td>{ev.location ?? "—"}</td>
                  <td>
                    {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td>{ev.price == null ? "—" : `$${ev.price}`}</td>
                  <td>{ev.isFeatured ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
