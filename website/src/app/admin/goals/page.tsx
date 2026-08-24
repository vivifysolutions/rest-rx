"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { ReferenceSelect } from "@/components/admin/ReferenceSelect";
import {
  createAdminGuidedGoal,
  deleteAdminGuidedGoal,
  getAdminGuidedGoals,
  getTopics,
  updateAdminGuidedGoal,
} from "@/lib/api";
import type { CreateGuidedGoalInput, GuidedGoal } from "@/lib/types";

const CADENCES: Array<{ value: GuidedGoal["cadence"]; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CADENCE_PERIOD_NOUN: Record<GuidedGoal["cadence"], string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  cadence: "weekly" as GuidedGoal["cadence"],
  targetValue: "",
  unit: "times",
};

function cadenceLabel(value: GuidedGoal["cadence"]): string {
  return CADENCES.find((c) => c.value === value)?.label ?? value;
}

export default function AdminGoalsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<GuidedGoal[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
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
      if (!token) throw new Error("Not signed in");
      const [data, topicList] = await Promise.all([
        getAdminGuidedGoals(token, { search: search || undefined }),
        getTopics(),
      ]);
      setItems(data.items);
      setTopics(topicList.map((t) => t.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.category) {
      setError("Select a category.");
      return;
    }

    const targetValue = Number(form.targetValue);
    if (!Number.isFinite(targetValue) || targetValue < 0.01) {
      setError("Enter a target of at least 1 (or 0.01).");
      return;
    }

    const token = await refreshToken();
    if (!token) return;

    const body: CreateGuidedGoalInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      goalType: "habit",
      category: form.category,
      targetValue,
      unit: form.unit.trim() || undefined,
      cadence: form.cadence,
    };

    try {
      if (editingId) {
        await updateAdminGuidedGoal(token, editingId, body);
        setSuccess("Guided goal updated.");
        setEditingId(null);
      } else {
        await createAdminGuidedGoal(token, body);
        setSuccess("Guided goal created — it will appear in Guided for you.");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal");
    }
  }

  async function handleDelete(item: GuidedGoal) {
    const memberNote =
      item.memberCount > 0
        ? ` ${item.memberCount} member${item.memberCount === 1 ? " has" : "s have"} joined — their progress for this goal will be removed.`
        : "";
    if (!confirm(`Delete “${item.title}”?${memberNote}`)) return;

    const token = await refreshToken();
    if (!token) return;
    try {
      await deleteAdminGuidedGoal(token, item.id);
      if (editingId === item.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      setSuccess("Guided goal deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal");
    }
  }

  function startEdit(item: GuidedGoal) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      cadence: item.cadence,
      targetValue: String(item.targetValue),
      unit: item.unit ?? "times",
    });
    setSuccess(null);
    setError(null);
  }

  const categoryOptions = topics.map((name) => ({ value: name, label: name }));

  return (
    <>
      <ContentPageHeader
        title="Goals"
        description="Rest & Rx curated habits shown under Guided for you. Members can join these from the wellness Goals tab."
      />

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
          {editingId ? "Edit guided goal" : "Add guided goal"}
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Title *
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g. Move my body"
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Short encouragement shown on the goal card"
            />
          </label>
          <div className="admin-form-row">
            <label>
              Category *
              <ReferenceSelect
                name="category"
                value={form.category}
                onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                options={categoryOptions}
                placeholder="Select wellness category"
                required
              />
            </label>
            <label>
              Cadence *
              <select
                value={form.cadence}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    cadence: e.target.value as GuidedGoal["cadence"],
                  }))
                }
                required
              >
                {CADENCES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              Target times per {CADENCE_PERIOD_NOUN[form.cadence]} *
              <input
                type="number"
                min={0.01}
                step={1}
                value={form.targetValue}
                onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
                required
                placeholder={form.cadence === "weekly" ? "e.g. 3" : "e.g. 1"}
              />
            </label>
            <label>
              Unit
              <input
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                maxLength={30}
                placeholder="times"
              />
            </label>
          </div>
          <p className="admin-field-hint" style={{ marginTop: "-0.25rem" }}>
            Habits use target × cadence (e.g. 3× a week). Members check in once per day toward that
            target. Categories come from wellness topics.
          </p>
          <button type="submit" className="admin-btn admin-btn-primary">
            {editingId ? "Save changes" : "Create guided goal"}
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
            placeholder="Filter guided goals…"
            style={{ marginLeft: "0.5rem", padding: "0.4rem 0.6rem" }}
          />
        </label>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No guided goals yet. Create one above.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Target</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id}>
                  <td>
                    <strong>{g.title}</strong>
                    {g.description ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {g.description.slice(0, 80)}
                        {g.description.length > 80 ? "…" : ""}
                      </div>
                    ) : null}
                  </td>
                  <td>{g.category}</td>
                  <td>
                    {g.targetValue}
                    {g.unit ? ` ${g.unit}` : ""} / {cadenceLabel(g.cadence).toLowerCase()}
                  </td>
                  <td>{g.memberCount}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() => startEdit(g)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => void handleDelete(g)}
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
