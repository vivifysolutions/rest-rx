"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  createAffirmation,
  deleteAffirmation,
  getAffirmations,
  getAffirmationTopics,
  updateAffirmation,
} from "@/lib/api";
import type { Affirmation, AffirmationTopic } from "@/lib/types";

const EMPTY_FORM = {
  topicSlug: "",
  body: "",
  faithBased: false,
};

export default function AdminAffirmationsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Affirmation[]>([]);
  const [topics, setTopics] = useState<AffirmationTopic[]>([]);
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
      const [data, topicList] = await Promise.all([
        getAffirmations({ search: search || undefined, limit: 100 }),
        getAffirmationTopics(),
      ]);
      setItems(data.items);
      setTopics(topicList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load affirmations");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = await refreshToken();
    if (!token) return;
    const body = {
      topicSlug: form.topicSlug,
      body: form.body.trim(),
      faithBased: form.faithBased,
    };
    try {
      if (editingId) {
        await updateAffirmation(token, editingId, body);
        setSuccess("Affirmation updated.");
        setEditingId(null);
      } else {
        await createAffirmation(token, body);
        setSuccess("Affirmation created.");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save affirmation");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this affirmation?")) return;
    const token = await refreshToken();
    if (!token) return;
    await deleteAffirmation(token, id);
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    await load();
  }

  function startEdit(item: Affirmation) {
    setEditingId(item.id);
    setForm({
      topicSlug: item.topicSlug,
      body: item.body,
      faithBased: item.faithBased,
    });
  }

  return (
    <>
      <ContentPageHeader
        title="Affirmations"
        description="Wellness affirmations shown in the app. Add, edit, or remove affirmations by topic."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
          {editingId ? "Edit affirmation" : "Add affirmation"}
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Topic *
            <select
              value={form.topicSlug}
              onChange={(e) => setForm((p) => ({ ...p, topicSlug: e.target.value }))}
              required
            >
              <option value="">Select topic</option>
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Affirmation text *
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              required
              rows={4}
            />
          </label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={form.faithBased}
              onChange={(e) => setForm((p) => ({ ...p, faithBased: e.target.checked }))}
            />
            Faith-based affirmation
          </label>
          <button type="submit" className="admin-btn admin-btn-primary">
            {editingId ? "Save changes" : "Create affirmation"}
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
            placeholder="Filter affirmations…"
            style={{ marginLeft: "0.5rem", padding: "0.4rem 0.6rem" }}
          />
        </label>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Preview</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.topicTitle}</td>
                  <td>{a.body.slice(0, 80)}{a.body.length > 80 ? "…" : ""}</td>
                  <td>{a.faithBased ? "Faith-based" : "General"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() => startEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(a.id)}
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
