"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { listUsers } from "@/lib/api";
import { displayUserName, verificationSummary } from "@/lib/admin-user-display";
import { formatApplicationStatus } from "@/lib/admin-labels";
import type { ApiUser } from "@/lib/types";

export default function AdminApplicationsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await listUsers(token, {
        applicationStatus: filterStatus || undefined,
        excludeApplicationStatus: filterStatus ? undefined : "approved",
      });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <ContentPageHeader
        title="Applications"
        description="Review healthcare professional signups awaiting approval. Approved users appear under Members."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="pending">Pending review</option>
            <option value="rejected">Rejected</option>
            <option value="">All in review (pending + rejected)</option>
          </select>
        </label>
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No applications match this filter.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Professional info</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <AdminTitleLink href={`/admin/users/${u.id}`}>
                      {displayUserName(u)}
                    </AdminTitleLink>
                  </td>
                  <td>{u.email ?? "—"}</td>
                  <td>
                    {[u.professionalRole, u.specialty].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>{verificationSummary(u)}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        u.applicationStatus === "pending" ? "admin-badge-muted" : ""
                      }`}
                      style={
                        u.applicationStatus === "rejected"
                          ? { background: "#fde8e8", color: "#b42318" }
                          : undefined
                      }
                    >
                      {formatApplicationStatus(u.applicationStatus)}
                    </span>
                  </td>
                  <td>
                    {u.applicationSubmittedAt
                      ? new Date(u.applicationSubmittedAt).toLocaleDateString()
                      : "—"}
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
