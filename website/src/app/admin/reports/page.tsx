"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  deleteComment,
  deletePost,
  deleteThread,
  getReports,
  updateGroupStatus,
  updateReportStatus,
} from "@/lib/api";
import type { ContentReport } from "@/lib/types";
import {
  formatContentType,
  formatReportStatus,
} from "@/lib/admin-labels";
import { compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";

function reporterLabel(report: ContentReport) {
  const r = report.reporter;
  if (r.displayName) return r.displayName;
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ");
  return name || r.email || "Unknown";
}

type ReportSort = "type" | "content" | "reporter" | "status" | "date";

const SORT_OPTIONS: { value: ReportSort; label: string }[] = [
  { value: "date", label: "Date (newest)" },
  { value: "type", label: "Type" },
  { value: "content", label: "Content" },
  { value: "reporter", label: "Reported by" },
  { value: "status", label: "Status" },
];

export default function AdminReportsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [sortByKey, setSortByKey] = useState<ReportSort>("date");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getReports(token, filter || undefined);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "type":
            return (
              compareText(formatContentType(a.contentType), formatContentType(b.contentType)) ||
              compareDateDesc(a.createdAt, b.createdAt)
            );
          case "content":
            return compareText(a.contentPreview, b.contentPreview) || compareDateDesc(a.createdAt, b.createdAt);
          case "reporter":
            return compareText(reporterLabel(a), reporterLabel(b)) || compareDateDesc(a.createdAt, b.createdAt);
          case "status":
            return compareText(a.status, b.status) || compareDateDesc(a.createdAt, b.createdAt);
          case "date":
          default:
            return compareDateDesc(a.createdAt, b.createdAt);
        }
      }),
    [items, sortByKey],
  );

  async function handleStatus(id: string, status: "reviewed" | "dismissed") {
    const token = await refreshToken();
    if (!token) return;
    await updateReportStatus(token, id, status);
    await load();
  }

  async function handleRemoveContent(report: ContentReport) {
    // Groups aren't deleted — they're archived (reversible), so use softer wording.
    const prompt =
      report.contentType === "group"
        ? "Archive this group? Members will no longer see it."
        : `Remove this ${report.contentType}? This cannot be undone.`;
    if (!confirm(prompt)) return;
    const token = await refreshToken();
    if (!token) return;
    if (report.contentType === "thread") {
      await deleteThread(token, report.contentId);
    } else if (report.contentType === "post") {
      await deletePost(token, report.contentId);
    } else if (report.contentType === "comment") {
      await deleteComment(token, report.contentId);
    } else {
      await updateGroupStatus(token, report.contentId, "archived");
    }
    await updateReportStatus(token, report.id, "reviewed");
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Flagged content"
        description="Review user reports from the mobile app. Dismiss false positives or remove violating content."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All reports</option>
            <option value="pending">Needs review</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Content</th>
                <th>Reported by</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td>{formatContentType(r.contentType)}</td>
                  <td>
                    <div>{r.contentPreview ?? "Content unavailable"}</div>
                    {r.reason && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #5a6c7d)", marginTop: "0.25rem" }}>
                        Reason: {r.reason}
                      </div>
                    )}
                  </td>
                  <td>{reporterLabel(r)}</td>
                  <td>
                    <span className="admin-badge">{formatReportStatus(r.status)}</span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-row-actions">
                      {r.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleRemoveContent(r)}
                          >
                            {r.contentType === "group" ? "Archive group" : "Remove content"}
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm"
                            onClick={() => handleStatus(r.id, "dismissed")}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => handleStatus(r.id, "reviewed")}
                          >
                            Mark reviewed
                          </button>
                        </>
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
