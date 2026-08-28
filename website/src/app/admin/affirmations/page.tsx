"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import {
  createAffirmation,
  deleteAffirmation,
  getAffirmations,
  getAffirmationTopics,
  updateAffirmation,
} from "@/lib/api";
import { compareText, sortBy } from "@/lib/admin-sort";
import type { Affirmation, AffirmationTopic } from "@/lib/types";

const AFFIRMATION_PLACEHOLDER = `I am grounded, capable, and **at peace**.

*Optional italic emphasis*

For faith-based entries, keep scripture in quotes after the message:
I am held in grace. "The Lord is my shepherd" — Psalm 23:1`;

const EMPTY_FORM = {
  topicSlug: "",
  body: "",
  faithBased: false,
};

type AffirmationSort = "topic" | "preview" | "type";

const SORT_OPTIONS: { value: AffirmationSort; label: string }[] = [
  { value: "topic", label: "Topic" },
  { value: "preview", label: "Preview" },
  { value: "type", label: "Type" },
];

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
  const [sortByKey, setSortByKey] = useState<AffirmationSort>("topic");

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

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "preview":
            return compareText(a.body, b.body) || compareText(a.topicTitle, b.topicTitle);
          case "type":
            return (
              compareText(a.faithBased ? "Faith-based" : "General", b.faithBased ? "Faith-based" : "General") ||
              compareText(a.topicTitle, b.topicTitle)
            );
          case "topic":
          default:
            return compareText(a.topicTitle, b.topicTitle) || compareText(a.body, b.body);
        }
      }),
    [items, sortByKey],
  );

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
          <MarkdownBodyField
            label="Affirmation text"
            value={form.body}
            onChange={(v) => setForm((p) => ({ ...p, body: v }))}
            required
            rows={5}
            placeholder={AFFIRMATION_PLACEHOLDER}
            hint="Markdown (**bold**, *italic*, lists) renders on the affirmation detail and swipe screens. Cards show a plain-text preview."
          />
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

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.85rem" }}>
          Search{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter affirmations…"
            style={{ marginLeft: "0.5rem", padding: "0.4rem 0.6rem" }}
          />
        </label>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
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
              {sorted.map((a) => (
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
