"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import { getCategories, getEventById, getEventFormats, updateEvent } from "@/lib/api";
import { EMPTY_LOCATION, locationFromListing } from "@/lib/address";
import type { CreateEventInput, Event } from "@/lib/types";

function eventToForm(item: Event): EventFormValues {
  return {
    title: item.title,
    description: item.description ?? "",
    category: item.category ?? "",
    format: item.format ?? "",
    location: locationFromListing(item),
    price: item.price != null ? String(item.price) : "",
    registrationUrl: item.registrationUrl ?? "",
    image: item.image ?? "",
    startDate: item.startDate ? item.startDate.slice(0, 16) : "",
    endDate: item.endDate ? item.endDate.slice(0, 16) : "",
    isFeatured: item.isFeatured,
  };
}

export default function AdminEventEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<EventFormValues>({
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
  });
  const [topics, setTopics] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await refreshToken();
        const [item, categoriesList, fmts] = await Promise.all([
          getEventById(id, token ?? undefined),
          getCategories("EVENT"),
          getEventFormats(),
        ]);
        if (cancelled) return;
        setForm(eventToForm(item));
        setTopics(categoriesList.map((c) => c.name));
        setFormats(fmts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load event");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, refreshToken]);

  async function handleSubmit(body: CreateEventInput) {
    setError(null);
    const token = await refreshToken();
    await updateEvent(id, body, token ?? undefined);
    router.push(`/admin/events/${id}`);
  }

  if (loading) return <p>Loading…</p>;

  return (
    <AdminDetailLayout
      backHref={`/admin/events/${id}`}
      backLabel="Event details"
      title="Edit event"
      actions={
        <Link href={`/admin/events/${id}`} className="admin-btn">
          Cancel
        </Link>
      }
    >
      <EventForm
        form={form}
        onChange={update}
        topics={topics}
        formats={formats}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
  );
}
