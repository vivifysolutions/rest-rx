"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  listUsers,
  updateApplicationStatus,
  updateUserType,
} from "@/lib/api";
import type { ApiUser, ApplicationStatus, UserType } from "@/lib/types";
import { USER_TYPE_LABELS } from "@/lib/user-types";

const USER_TYPES: UserType[] = ["member", "admin", "brand_partner", "expert"];
const APPLICATION_STATUSES: ApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export default function AdminUsersPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
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
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUserTypeChange(userId: string, userType: UserType) {
    const token = await refreshToken();
    if (!token) return;
    await updateUserType(token, userId, userType);
    await load();
  }

  async function handleStatusChange(userId: string, applicationStatus: ApplicationStatus) {
    const token = await refreshToken();
    if (!token) return;
    await updateApplicationStatus(token, userId, applicationStatus);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Users"
        description="Manage platform roles and healthcare application review status."
      />

      <div className="admin-card" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.85rem" }}>
          Application status{" "}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: "0.85rem" }}>
          User type{" "}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All</option>
            {USER_TYPES.map((t) => (
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
                <th>Email</th>
                <th>Name</th>
                <th>User type</th>
                <th>Application</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.email ?? "—"}</td>
                  <td>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                      u.displayName ||
                      "—"}
                  </td>
                  <td>
                    <select
                      value={u.userType}
                      onChange={(e) =>
                        handleUserTypeChange(u.id, e.target.value as UserType)
                      }
                    >
                      {USER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {USER_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={u.applicationStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          u.id,
                          e.target.value as ApplicationStatus,
                        )
                      }
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
