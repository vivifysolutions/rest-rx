"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ComboInput } from "@/components/admin/ComboInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  createResource,
  getResources,
  getResourceSubTopics,
  getResourceTiers,
  getResourceTypes,
  getTopics,
} from "@/lib/api";
import type { CreateResourceInput, Resource } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "",
  duration: "",
  topic: "",
  subTopic: "",
  tier: "",
  image: "",
  isFeatured: false,
};

export default function AdminResourcesPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
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
    const [data, topicsList, typesList, tiersList] = await Promise.allSettled([
      getResources(token ?? undefined),
      getTopics(),
      getResourceTypes(),
      getResourceTiers(),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      console.error("[Portal] getResources failed:", data.reason);
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load resources",
      );
    }
    if (topicsList.status === "fulfilled") {
      setTopics(topicsList.value.map((topic) => topic.name));
    }
    else console.error("[Portal] getTopics failed:", topicsList.reason);
    if (typesList.status === "fulfilled") setTypes(typesList.value);
    else console.error("[Portal] getResourceTypes failed:", typesList.reason);
    if (tiersList.status === "fulfilled") setTiers(tiersList.value);
    else console.error("[Portal] getResourceTiers failed:", tiersList.reason);
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Sub-topic options depend on the chosen topic.
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

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      const body: CreateResourceInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type.trim(),
        duration: form.duration.trim() || undefined,
        topic: form.topic.trim() || undefined,
        subTopic: form.subTopic.trim() || undefined,
        tier: form.tier.trim() || undefined,
        image: form.image.trim() || undefined,
        isFeatured: form.isFeatured,
      };
      await createResource(body, token ?? undefined);
      setSuccess("Resource created.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Resources"
        description="Wellness content (audio, video, articles). Topics come from the Topic table; types/tiers/sub-topics come from existing rows."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add resource</h2>
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
              Type *
              <ComboInput
                name="type"
                value={form.type}
                onChange={(v) => update("type", v)}
                options={types}
                placeholder="audio, video, article…"
                required
              />
            </label>
            <label>
              Duration
              <input
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="15 min"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Topic
              <ComboInput
                name="topic"
                value={form.topic}
                onChange={(v) => update("topic", v)}
                options={topics}
                placeholder="Pick from Topic table"
              />
            </label>
            <label>
              Sub-topic
              <ComboInput
                name="subTopic"
                value={form.subTopic}
                onChange={(v) => update("subTopic", v)}
                options={subTopics}
                placeholder={form.topic ? "Pick or type" : "Choose a topic first"}
                disabled={!form.topic}
              />
            </label>
          </div>

          <label>
            Tier
            <ComboInput
              name="tier"
              value={form.tier}
              onChange={(v) => update("tier", v)}
              options={tiers}
              placeholder="e.g. free, premium"
            />
          </label>

          <ImageUpload
            folder="resources"
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
            Create resource
          </button>
        </form>
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
                <th>Sub-topic</th>
                <th>Duration</th>
                <th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.type}</td>
                  <td>{r.topic ?? "—"}</td>
                  <td>{r.subTopic ?? "—"}</td>
                  <td>{r.duration ?? "—"}</td>
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
