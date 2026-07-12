"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { RetreatForm, type RetreatFormValues } from "@/components/admin/RetreatForm";
import {
  createRetreat,
  deleteRetreat,
  getRetreatSeasons,
  getRetreats,
  getTopics,
  updateRetreat,
} from "@/lib/api";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import type { Retreat } from "@/lib/types";

const EMPTY_FORM: RetreatFormValues = {
  title: "",
  description: "",
  category: "",
  season: "",
  location: "",
  rating: "",
  image: "",
  startDate: "",
  endDate: "",
  isFeatured: false,
};

export default function AdminRetreatsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Retreat[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<RetreatFormValues>(EMPTY_FORM);

  const update = <K extends keyof RetreatFormValues>(k: K, v: RetreatFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
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
                  <td>{r.isFeatured ? "Yes" : "—"}</td>
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
