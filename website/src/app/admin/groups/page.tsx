"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getGroups, updateGroupStatus } from "@/lib/api";
import type { Group } from "@/lib/types";
import { formatGroupStatus } from "@/lib/admin-labels";

export default function AdminGroupsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroups({ limit: 100 });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(
    id: string,
    status: "active" | "inactive" | "archived",
  ) {
    const token = await refreshToken();
    if (!token) return;
    await updateGroupStatus(token, id, status);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Groups"
        description="Community groups created by members. Archive or deactivate groups that violate guidelines."
      />

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Topic</th>
                <th>Location</th>
                <th>Members</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.topic ?? "—"}</td>
                  <td>
                    {[g.city, g.state, g.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td>{g.memberCount}</td>
                  <td>
                    <span className="admin-badge">{formatGroupStatus(g.status)}</span>
                  </td>
                  <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={g.status}
                      onChange={(e) =>
                        handleStatusChange(
                          g.id,
                          e.target.value as "active" | "inactive" | "archived",
                        )
                      }
                      style={{ fontSize: "0.8rem" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Hidden from members</option>
                      <option value="archived">Archived</option>
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
