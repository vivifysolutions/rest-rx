"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { RetreatForm, type RetreatFormValues } from "@/components/admin/RetreatForm";
import { FeaturedLineup, featuredPlacementLabel, type FeaturedSurface } from "@/components/admin/FeaturedLineup";
import {
  createRetreat,
  deleteRetreat,
  getRetreatSeasons,
  getRetreats,
  getTopics,
  updateRetreat,
} from "@/lib/api";
import { compareBoolDesc, compareDateAsc, compareText, sortBy } from "@/lib/admin-sort";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import type { Retreat } from "@/lib/types";

const EMPTY_FORM: RetreatFormValues = {
  title: "",
  description: "",
  joinInstructions: "",
  category: "",
  season: "",
  location: "",
  rating: "",
  images: [],
  startDate: "",
  endDate: "",
  bookingUrl: "",
  isFeatured: false,
  isFeaturedOnHome: false,
  featuredOrder: "",
  featuredOnHomeOrder: "",
};

type RetreatSort = "title" | "category" | "season" | "start" | "status" | "featured";

const SORT_OPTIONS: { value: RetreatSort; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "season", label: "Season" },
  { value: "start", label: "Start date" },
  { value: "featured", label: "Featured first" },
  { value: "status", label: "Status" },
];

export default function AdminRetreatsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Retreat[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<RetreatFormValues>(EMPTY_FORM);
  const [sortByKey, setSortByKey] = useState<RetreatSort>("title");
  const [moving, setMoving] = useState<{ surface: FeaturedSurface; id: string } | null>(null);

  const update = <K extends keyof RetreatFormValues>(k: K, v: RetreatFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "category":
            return compareText(a.category, b.category) || compareText(a.title, b.title);
          case "season":
            return compareText(a.season, b.season) || compareText(a.title, b.title);
          case "start":
            return compareDateAsc(a.startDate, b.startDate) || compareText(a.title, b.title);
          case "status": {
            const aPub = a.isPublished ?? true;
            const bPub = b.isPublished ?? true;
            return Number(bPub) - Number(aPub) || compareText(a.title, b.title);
          }
          case "featured":
            return (
              compareBoolDesc(
                Boolean(a.isFeaturedOnHome || a.isFeatured),
                Boolean(b.isFeaturedOnHome || b.isFeatured),
              ) || compareText(a.title, b.title)
            );
          case "title":
          default:
            return compareText(a.title, b.title);
        }
      }),
    [items, sortByKey],
  );

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, topicsList, sns] = await Promise.allSettled([
      getRetreats(token ?? undefined),
      getTopics(),
      getRetreatSeasons(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load retreats",
      );
    }
    if (topicsList.status === "fulfilled") {
      setTopics(topicsList.value.map((topic) => topic.name));
    }
    if (sns.status === "fulfilled") setSeasons(sns.value);
    if (!opts?.quiet) setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(body: Parameters<typeof createRetreat>[0]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createRetreat(body, token ?? undefined);
      setSuccess("Retreat created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create retreat");
      throw err;
    }
  }

  async function handleTogglePublish(item: Retreat) {
    const token = await refreshToken();
    await updateRetreat(item.id, { isPublished: !item.isPublished }, token ?? undefined);
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
        next.map((id, index) => updateRetreat(id, { [field]: index + 1 }, token ?? undefined)),
      );
      await load({ quiet: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update featured order");
    } finally {
      setMoving(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this retreat?")) return;
    const token = await refreshToken();
    await deleteRetreat(id, token ?? undefined);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Retreats"
        description="Retreat listings for Discover. Create and publish retreats for the app."
      />

      <FeaturedLineup
        items={items}
        loading={loading}
        moving={moving}
        onMove={handleMoveLineup}
        sectionLabel="Retreats"
        detailHref={(r) => `/admin/retreats/${r.id}`}
        editHref={(r) => `/admin/retreats/${r.id}/edit`}
        getMeta={(r) => [r.category, r.location].filter(Boolean).join(" · ") || null}
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add retreat</h2>
        <RetreatForm
          form={form}
          onChange={update}
          topics={topics}
          seasons={seasons}
          submitLabel="Create retreat"
          onSubmit={handleCreate}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
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
                <th>Status</th>
                <th>Featured</th>
                <th>Discover order</th>
                <th>Home order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td>
                    <AdminTitleLink href={`/admin/retreats/${r.id}`}>{r.title}</AdminTitleLink>
                  </td>
                  <td>{r.category ?? "—"}</td>
                  <td>{r.season ?? "—"}</td>
                  <td>{r.location ?? "—"}</td>
                  <td>
                    {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td>{r.rating ?? "—"}</td>
                  <td>
                    <PublishedBadge isPublished={r.isPublished ?? true} />
                  </td>
                  <td>{featuredPlacementLabel(r)}</td>
                  <td>{r.featuredOrder ?? "—"}</td>
                  <td>{r.featuredOnHomeOrder ?? "—"}</td>
                  <td>
                    <ContentRowActions
                      isPublished={r.isPublished ?? true}
                      onTogglePublish={() => handleTogglePublish(r)}
                      editHref={`/admin/retreats/${r.id}/edit`}
                      onDelete={() => handleDelete(r.id)}
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
