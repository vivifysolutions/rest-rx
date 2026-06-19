"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { listUsers } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import { USER_TYPE_LABELS } from "@/lib/user-types";
import { formatApplicationStatus } from "@/lib/admin-labels";

function displayName(u: ApiUser): string {
  return (
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.displayName || "—"
  );
}

function verificationSummary(u: ApiUser): string {
  const hasIdentity = Boolean(u.identityPhotoUrl);
  const hasCredential = Boolean(u.workCredentialPhotoUrl);
  if (hasIdentity && hasCredential) return "Photos submitted";
  if (hasIdentity || hasCredential) return "Partial";
  return "None";
}

export default function AdminUsersPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await listUsers(token, {
        applicationStatus: filterStatus || undefined,
        userType: filterType || undefined,
      });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <ContentPageHeader
        title="Applications"
        description="Review healthcare professional applications, view submitted profiles and verification photos, then approve or reject access."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Application status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All applications</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Role
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All roles</option>
            {(["member", "admin", "brand_partner", "expert"] as const).map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Professional info</th>
                <th>Verification</th>
                <th>Application</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <AdminTitleLink href={`/admin/users/${u.id}`}>
                      {displayName(u)}
                    </AdminTitleLink>
                  </td>
                  <td>{u.email ?? "—"}</td>
                  <td>{USER_TYPE_LABELS[u.userType]}</td>
                  <td>
                    {[u.professionalRole, u.specialty].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>{verificationSummary(u)}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        u.applicationStatus === "approved"
                          ? "admin-badge-success"
                          : u.applicationStatus === "pending"
                            ? "admin-badge-muted"
                            : ""
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
