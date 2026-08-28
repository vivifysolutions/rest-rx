"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import type { BrandPartnerOption } from "@/components/discounts/BrandPartnerPicker";
import {
  createEvent,
  deleteEvent,
  getBrandPartnerApplications,
  getCategories,
  getEventFormats,
  getEvents,
  updateEvent,
} from "@/lib/api";
import { EMPTY_LOCATION } from "@/lib/address";
import {
  compareBoolDesc,
  compareDateAsc,
  compareNullableNumberAsc,
  compareText,
  sortBy,
} from "@/lib/admin-sort";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import { FeaturedLineup, featuredPlacementLabel, type FeaturedSurface } from "@/components/admin/FeaturedLineup";
import { labelApplicationTypeShort } from "@/lib/partner-application-options";
import { partnerOwnerDisplayName, toPartnerOwnerOptions } from "@/lib/partner-owner";
import type { Event } from "@/lib/types";

type EventSort = "title" | "category" | "format" | "start" | "status" | "featured" | "homeOrder" | "discoverOrder";

const SORT_OPTIONS: { value: EventSort; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "format", label: "Format" },
  { value: "start", label: "Start date" },
  { value: "status", label: "Status" },
  { value: "featured", label: "Featured first" },
  { value: "homeOrder", label: "Home order" },
  { value: "discoverOrder", label: "Discover order" },
];

const EMPTY_FORM: EventFormValues = {
  title: "",
  description: "",
  category: "",
  format: "",
  location: { ...EMPTY_LOCATION },
  price: "",
  registrationUrl: "",
  images: [],
  startDate: "",
  endDate: "",
  isFeatured: false,
  isFeaturedOnHome: false,
  featuredOrder: "",
  featuredOnHomeOrder: "",
  brandPartnerApplicationId: "",
};

function ownerLabel(ev: Event): string {
  const app = ev.brandPartnerApplication;
  if (!app) return "—";
  const name = partnerOwnerDisplayName(app);
  const type = app.applicationType
    ? ` (${labelApplicationTypeShort(app.applicationType as "brand_partner" | "expert" | "foundation" | "ambassador")})`
    : "";
  return `${name}${type}`;
}

export default function AdminEventsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [partners, setPartners] = useState<BrandPartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormValues>(EMPTY_FORM);
  const [sortByKey, setSortByKey] = useState<EventSort>("start");
  const [moving, setMoving] = useState<{ surface: FeaturedSurface; id: string } | null>(null);

  const update = <K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "category":
            return compareText(a.category, b.category) || compareText(a.title, b.title);
          case "format":
            return compareText(a.format, b.format) || compareText(a.title, b.title);
          case "start":
            return compareDateAsc(a.startDate, b.startDate) || compareText(a.title, b.title);
          case "status": {
            const aPub = a.isPublished ?? true;
            const bPub = b.isPublished ?? true;
            return Number(bPub) - Number(aPub) || compareText(a.title, b.title);
          }
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
          case "title":
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
    if (!opts?.quiet) setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
    loadPartners();
  }, [load, loadPartners]);

  async function handleCreate(body: Parameters<typeof createEvent>[0]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createEvent(body, token ?? undefined);
      setSuccess(
        body.brandPartnerApplicationId
          ? "Event created and linked to partner."
          : "Event created.",
      );
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
        next.map((id, index) => updateEvent(id, { [field]: index + 1 }, token ?? undefined)),
      );
      await load({ quiet: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update featured order");
    } finally {
      setMoving(null);
    }
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
        description="Workshops, webinars, and gatherings. Optionally assign ownership to an approved brand partner, expert, or foundation."
      />

      <FeaturedLineup
        items={items}
        loading={loading}
        moving={moving}
        onMove={handleMoveLineup}
        sectionLabel="Events"
        detailHref={(ev) => `/admin/events/${ev.id}`}
        editHref={(ev) => `/admin/events/${ev.id}/edit`}
        getMeta={(ev) => [ev.category, ev.format].filter(Boolean).join(" · ") || null}
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add event</h2>
        <EventForm
          form={form}
          onChange={update}
          topics={topics}
          formats={formats}
          showPartnerPicker
          brandPartners={partners}
          brandPartnersLoading={partnersLoading}
          submitLabel="Create event"
          onSubmit={handleCreate}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
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
                <th>Owner</th>
                <th>Category</th>
                <th>Format</th>
                <th>Location</th>
                <th>Start</th>
                <th>Price</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Discover order</th>
                <th>Home order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <AdminTitleLink href={`/admin/events/${ev.id}`}>{ev.title}</AdminTitleLink>
                  </td>
                  <td>{ownerLabel(ev)}</td>
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
                  <td>{featuredPlacementLabel(ev)}</td>
                  <td>{ev.featuredOrder ?? "—"}</td>
                  <td>{ev.featuredOnHomeOrder ?? "—"}</td>
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
