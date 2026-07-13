"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import type { BrandPartnerOption } from "@/components/discounts/BrandPartnerPicker";
import {
  getBrandPartnerApplications,
  getCategories,
  getEventById,
  getEventFormats,
  updateEvent,
} from "@/lib/api";
import { locationFromListing } from "@/lib/address";
import { toPartnerOwnerOptions } from "@/lib/partner-owner";
import type { CreateEventInput, Event } from "@/lib/types";

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
    startDate: toDatetimeLocal(item.startDate),
    endDate: toDatetimeLocal(item.endDate),
    isFeatured: item.isFeatured,
    brandPartnerApplicationId: item.brandPartnerApplicationId ?? "",
  };
}

export default function AdminEventEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<EventFormValues | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [partners, setPartners] = useState<BrandPartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPartnersLoading(true);
      setError(null);
      try {
        const token = await refreshToken();
        const [item, cats, fmts, apps] = await Promise.all([
          getEventById(id, token ?? undefined),
          getCategories("EVENT"),
          getEventFormats(),
          token
            ? getBrandPartnerApplications(token, { status: "approved" })
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setForm(eventToForm(item));
        setTopics(cats.map((c) => c.name));
        setFormats(fmts);
        setPartners(toPartnerOwnerOptions(apps));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load event");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPartnersLoading(false);
        }
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

  if (loading || !form) return <p>Loading…</p>;

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
        showPartnerPicker
        brandPartners={partners}
        brandPartnersLoading={partnersLoading}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
  );
}
