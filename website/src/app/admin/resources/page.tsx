"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  EMPTY_RESOURCE_FORM,
  ResourceForm,
  type ResourceFormValues,
} from "@/components/admin/ResourceForm";
import {
  createResource,
  deleteResource,
  getResources,
  getResourceSubTopics,
  getResourceTopics,
  getResourceTypes,
  updateResource,
} from "@/lib/api";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import type { Resource } from "@/lib/types";

export default function AdminResourcesPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceFormValues>(EMPTY_RESOURCE_FORM);

  const update = <K extends keyof ResourceFormValues>(k: K, v: ResourceFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, topicsList, typesList] = await Promise.allSettled([
      getResources(token ?? undefined),
      getResourceTopics(),
      getResourceTypes(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load resources",
      );
    }
    if (topicsList.status === "fulfilled") {
      setTopics(topicsList.value.map((topic) => topic.name));
    }
    if (typesList.status === "fulfilled") setTypes(typesList.value);
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const topic = form.topic.trim();
    if (!topic) {
      setSubTopics([]);
      return;
    }
    getResourceSubTopics(topic)
      .then((s) => {
        if (!cancelled) setSubTopics(s);
      })
      .catch(() => {
        if (!cancelled) setSubTopics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.topic]);

  async function handleCreate(body: Parameters<typeof createResource>[0]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createResource(body, token ?? undefined);
      setSuccess("Resource created.");
      setForm(EMPTY_RESOURCE_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
      throw err;
    }
  }

  async function handleTogglePublish(item: Resource) {
    const token = await refreshToken();
    await updateResource(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resource?")) return;
    const token = await refreshToken();
    await deleteResource(id, token ?? undefined);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Resources"
        description="Wellness content for the app — audio, video, and articles members can browse in Discover."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add resource</h2>
        <ResourceForm
          form={form}
          onChange={update}
          topics={topics}
          subTopics={subTopics}
          types={types}
          submitLabel="Create resource"
          onSubmit={handleCreate}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card admin-table-wrap">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>All resources</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Topic</th>
                <th>Subcategory</th>
                <th>Duration</th>
                <th>Media</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <AdminTitleLink href={`/admin/resources/${r.id}`}>{r.title}</AdminTitleLink>
                  </td>
                  <td>{r.type}</td>
                  <td>{r.topic ?? "—"}</td>
                  <td>{r.subTopic ?? "—"}</td>
                  <td>{r.duration ?? "—"}</td>
                  <td>{r.mediaUrl ? "Yes" : "—"}</td>
                  <td>
                    <PublishedBadge isPublished={r.isPublished ?? true} />
                  </td>
                  <td>{r.isFeatured ? "Yes" : "—"}</td>
                  <td>
                    <ContentRowActions
                      isPublished={r.isPublished ?? true}
                      onTogglePublish={() => handleTogglePublish(r)}
                      editHref={`/admin/resources/${r.id}/edit`}
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
