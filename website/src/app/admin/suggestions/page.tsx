"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getSuggestions } from "@/lib/api";
import type { Suggestion } from "@/lib/types";

function submitterLabel(suggestion: Suggestion) {
  const u = suggestion.user;
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return u.displayName || name || u.email || "Unknown";
}

function categoryLabel(category: string) {
  return category
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminSuggestionsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getSuggestions(token, category || undefined);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, category]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = Array.from(new Set(items.map((s) => s.category))).sort();

  return (
    <>
      <ContentPageHeader
        title="Suggestions"
        description="Free-form suggestions submitted by users — e.g. “submit an event” on an empty Events/Retreats list, or the profile Suggestion Box."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No suggestions yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Message</th>
                <th>Submitted by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="admin-badge admin-badge-muted">{categoryLabel(s.category)}</span>
                  </td>
                  <td style={{ maxWidth: 480, whiteSpace: "pre-wrap" }}>{s.message}</td>
                  <td>{submitterLabel(s)}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
