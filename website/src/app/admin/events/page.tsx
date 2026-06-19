"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import {
  createEvent,
  deleteEvent,
  getCategories,
  getEventFormats,
  getEvents,
  updateEvent,
} from "@/lib/api";
import { EMPTY_LOCATION } from "@/lib/address";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import type { Event } from "@/lib/types";

const EMPTY_FORM: EventFormValues = {
  title: "",
  description: "",
  category: "",
  format: "",
  location: EMPTY_LOCATION,
  price: "",
  registrationUrl: "",
  image: "",
  startDate: "",
  endDate: "",
  isFeatured: false,
};

export default function AdminEventsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormValues>(EMPTY_FORM);

  const update = <K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, categoriesList, fmts] = await Promise.allSettled([
      getEvents(token ?? undefined),
      getCategories("EVENT"),
      getEventFormats(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load events",
      );
    }
    if (categoriesList.status === "fulfilled") {
      setTopics(categoriesList.value.map((category) => category.name));
    }
    if (fmts.status === "fulfilled") setFormats(fmts.value);
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(body: Parameters<typeof createEvent>[0]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createEvent(body, token ?? undefined);
      setSuccess("Event created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      throw err;
    }
  }

  async function handleTogglePublish(item: Event) {
    const token = await refreshToken();
    await updateEvent(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    const token = await refreshToken();
    await deleteEvent(id, token ?? undefined);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Events"
        description="Workshops, webinars, and gatherings. Create and publish events for the app."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add event</h2>
        <EventForm
          form={form}
          onChange={update}
          topics={topics}
          formats={formats}
          submitLabel="Create event"
          onSubmit={handleCreate}
        />
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
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <AdminTitleLink href={`/admin/events/${ev.id}`}>{ev.title}</AdminTitleLink>
                  </td>
                  <td>{ev.category ?? "—"}</td>
                  <td>{ev.format ?? "—"}</td>
                  <td>{ev.location ?? "—"}</td>
                  <td>
                    {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td>{ev.price == null ? "—" : `$${ev.price}`}</td>
                  <td>
                    <PublishedBadge isPublished={ev.isPublished ?? true} />
                  </td>
                  <td>{ev.isFeatured ? "Yes" : "—"}</td>
                  <td>
                    <ContentRowActions
                      isPublished={ev.isPublished ?? true}
                      onTogglePublish={() => handleTogglePublish(ev)}
                      editHref={`/admin/events/${ev.id}/edit`}
                      onDelete={() => handleDelete(ev.id)}
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
