"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { getGroups, updateGroupStatus } from "@/lib/api";
import type { Group } from "@/lib/types";
import { formatGroupStatus } from "@/lib/admin-labels";
import { compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";

type GroupSort = "name" | "topic" | "location" | "members" | "status" | "created";

const SORT_OPTIONS: { value: GroupSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "topic", label: "Topic" },
  { value: "location", label: "Location" },
  { value: "members", label: "Members (most first)" },
  { value: "status", label: "Status" },
  { value: "created", label: "Created (newest)" },
];

function groupLocation(g: Group) {
  return [g.city, g.state, g.country].filter(Boolean).join(", ");
}

export default function AdminGroupsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortByKey, setSortByKey] = useState<GroupSort>("name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroups({ limit: 100, status: "all" });
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

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "topic":
            return compareText(a.topic, b.topic) || compareText(a.name, b.name);
          case "location":
            return compareText(groupLocation(a), groupLocation(b)) || compareText(a.name, b.name);
          case "members":
            return (b.memberCount ?? 0) - (a.memberCount ?? 0) || compareText(a.name, b.name);
          case "status":
            return compareText(formatGroupStatus(a.status), formatGroupStatus(b.status)) || compareText(a.name, b.name);
          case "created":
            return compareDateDesc(a.createdAt, b.createdAt) || compareText(a.name, b.name);
          case "name":
          default:
            return compareText(a.name, b.name);
        }
      }),
    [items, sortByKey],
  );

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
        description="Community groups created by members. Click a name to review posts and comments."
      />

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
      </div>

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
              {sorted.map((g) => (
                <tr key={g.id}>
                  <td>
                    <AdminTitleLink href={`/admin/groups/${g.id}`}>
                      {g.name}
                    </AdminTitleLink>
                  </td>
                  <td>{g.topic ?? "—"}</td>
                  <td>
                    {groupLocation(g) || "—"}
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
