"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
} from "@/lib/api";
import type { CreateResourceInput, Resource } from "@/lib/types";

export const MICRO_RX_TYPE = "Micro Rx";
const DEFAULT_TOPIC = "Meditations/Resets";

const EMPTY_FORM = {
  title: "",
  description: "",
  caption: "",
  topic: DEFAULT_TOPIC,
  subTopic: "",
  duration: "1 min",
};

function makeTitleFromPrompt(prompt: string): string {
  const body = prompt.trim();
  if (!body) return "";
  const colonIdx = body.indexOf(":");
  if (colonIdx > 0 && colonIdx <= 48) return body.slice(0, colonIdx).trim();
  const words = body.split(/\s+/);
  if (words.length <= 6) return body;
  return `${words.slice(0, 6).join(" ")}…`;
}

function resourceToForm(item: Resource) {
  return {
    title: item.title,
    description: item.description ?? "",
    caption: item.caption ?? "",
    topic: item.topic ?? DEFAULT_TOPIC,
    subTopic: item.subTopic ?? "",
    duration: item.duration ?? "1 min",
  };
}

function formToBody(form: typeof EMPTY_FORM): CreateResourceInput {
  const description = form.description.trim();
  const title = form.title.trim() || makeTitleFromPrompt(description);
  return {
    title,
    description,
    caption: form.caption.trim() || undefined,
    type: MICRO_RX_TYPE,
    topic: form.topic.trim() || DEFAULT_TOPIC,
    subTopic: form.subTopic.trim() || undefined,
    duration: form.duration.trim() || "1 min",
    isFeatured: false,
    isFeaturedOnHome: false,
  };
}

/** Micro RX create/edit + list — used under Resources subtabs. */
export function MicroRxPanel() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      const data = await getResources(token ?? undefined, { type: MICRO_RX_TYPE });
      setItems(
        [...data].sort((a, b) => (a.subTopic ?? "").localeCompare(b.subTopic ?? "")),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Micro RX");
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${item.caption ?? ""} ${item.topic ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = await refreshToken();
    if (!token) return;
    const body = formToBody(form);
    try {
      if (editingId) {
        await updateResource(editingId, body, token);
        setSuccess("Micro RX updated.");
        setEditingId(null);
      } else {
        await createResource(body, token);
        setSuccess("Micro RX created.");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Micro RX");
    }
  }

  async function handleTogglePublish(item: Resource) {
    const token = await refreshToken();
    if (!token) return;
    await updateResource(item.id, { isPublished: !item.isPublished }, token);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this Micro RX prompt?")) return;
    const token = await refreshToken();
    if (!token) return;
    await deleteResource(id, token);
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    await load();
  }

  function startEdit(item: Resource) {
    setEditingId(item.id);
    setForm(resourceToForm(item));
  }

  return (
    <>
      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
          {editingId ? "Edit Micro RX" : "Add Micro RX"}
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Prompt *
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
              rows={4}
              placeholder="Say out loud 3 things you are grateful for from today's shift…"
            />
          </label>
          <label>
            Caption
            <span className="admin-field-hint">
              Optional short text shown with this Micro RX in the app.
            </span>
            <textarea
              value={form.caption}
              onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
              rows={2}
              placeholder="Optional caption members see with this prompt"
            />
          </label>
          <label>
            Carousel headline
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Optional — auto-generated from the prompt if left blank"
            />
          </label>
          <div className="admin-form-row">
            <label>
              Topic
              <input
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder={DEFAULT_TOPIC}
              />
            </label>
            <label>
              Sort order
              <input
                value={form.subTopic}
                onChange={(e) => setForm((p) => ({ ...p, subTopic: e.target.value }))}
                placeholder="0001"
              />
            </label>
            <label>
              Duration badge
              <input
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder="1 min"
              />
            </label>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            {editingId ? "Save changes" : "Create Micro RX"}
          </button>
          {editingId && (
            <button
              type="button"
              className="admin-btn"
              style={{ background: "#e8eef3", color: "var(--downriver)" }}
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.85rem" }}>
          Search{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter prompts…"
            style={{ marginLeft: "0.5rem", padding: "0.4rem 0.6rem" }}
          />
        </label>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {filtered.length} of {items.length} prompts
        </p>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Headline</th>
                <th>Prompt</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.subTopic ?? "—"}</td>
                  <td>{item.title}</td>
                  <td>
                    {(item.description ?? "").slice(0, 80)}
                    {(item.description?.length ?? 0) > 80 ? "…" : ""}
                  </td>
                  <td>{item.topic ?? "—"}</td>
                  <td>
                    <PublishedBadge isPublished={item.isPublished ?? true} />
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() => handleTogglePublish(item)}
                      >
                        {item.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
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
