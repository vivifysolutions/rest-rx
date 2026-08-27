"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getSuggestions, updateSuggestionStatus } from "@/lib/api";
import {
  formatSuggestionStatus,
  formatSuggestionType,
  SUGGESTION_TYPE_LABELS,
} from "@/lib/admin-labels";
import type { Suggestion } from "@/lib/types";

function submitterLabel(suggestion: Suggestion) {
  const u = suggestion.user;
  if (!u) return "Unknown";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return u.displayName || name || u.email || "Unknown";
}

export default function AdminSuggestionsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getSuggestions(token, {
        type: type || undefined,
        status: status || undefined,
      });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, type, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatus(id: string, next: "pending" | "reviewed") {
    const token = await refreshToken();
    if (!token) return;
    setUpdatingId(id);
    try {
      await updateSuggestionStatus(token, id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update suggestion");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Suggestions"
        description="Free-form suggestions submitted by users — e.g. “submit an event” on an empty Events/Retreats list, or the profile Suggestion Box."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Show
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Needs review</option>
            <option value="reviewed">Reviewed</option>
            <option value="">All suggestions</option>
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {Object.entries(SUGGESTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
          <p style={{ color: "var(--text-muted)" }}>
            {status === "pending" ? "No suggestions waiting for review." : "No suggestions yet."}
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Message</th>
                <th>Submitted by</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="admin-badge admin-badge-muted">{formatSuggestionType(s.type)}</span>
                  </td>
                  <td style={{ maxWidth: 480, whiteSpace: "pre-wrap" }}>{s.message}</td>
                  <td>{submitterLabel(s)}</td>
                  <td>
                    <span className={`admin-badge ${s.status === "pending" ? "admin-badge-muted" : "admin-badge-success"}`}>
                      {formatSuggestionStatus(s.status)}
                    </span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="admin-row-actions">
                      {s.status === "pending" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          disabled={updatingId === s.id}
                          onClick={() => handleStatus(s.id, "reviewed")}
                        >
                          Mark reviewed
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm"
                          disabled={updatingId === s.id}
                          onClick={() => handleStatus(s.id, "pending")}
                        >
                          Reopen
                        </button>
                      )}
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
