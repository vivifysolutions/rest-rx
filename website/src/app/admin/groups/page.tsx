"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { FeaturedLineup, type FeaturedSurface } from "@/components/admin/FeaturedLineup";
import { getGroups, updateGroupFeatured, updateGroupStatus } from "@/lib/api";
import type { Group } from "@/lib/types";
import { formatGroupStatus } from "@/lib/admin-labels";
import { compareBoolDesc, compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";

type GroupSort = "name" | "topic" | "location" | "members" | "status" | "featured" | "created";

const SORT_OPTIONS: { value: GroupSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "topic", label: "Topic" },
  { value: "location", label: "Location" },
  { value: "members", label: "Members (most first)" },
  { value: "featured", label: "Featured on Home first" },
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
  const [moving, setMoving] = useState<{ surface: FeaturedSurface; id: string } | null>(null);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
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

  const lineupItems = useMemo(
    () =>
      items.map((g) => ({
        ...g,
        title: g.name,
        image: g.coverImageUrl,
        isFeatured: false,
        isFeaturedOnHome: Boolean(g.isFeaturedOnHome),
        // Hidden and archived groups aren't shown in the app, like unpublished content.
        isPublished: g.status === "active",
      })),
    [items],
  );

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
          case "featured":
            return (
              compareBoolDesc(Boolean(a.isFeaturedOnHome), Boolean(b.isFeaturedOnHome)) ||
              compareText(a.name, b.name)
            );
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

  async function handleMoveLineup(
    surface: FeaturedSurface,
    orderedLiveIds: string[],
    fromIndex: number,
    direction: -1 | 1,
  ) {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedLiveIds.length) return;
    const next = [...orderedLiveIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setMoving({ surface, id: moved });
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) return;
      await Promise.all(
        next.map((id, index) => updateGroupFeatured(token, id, { featuredOnHomeOrder: index + 1 })),
      );
      await load({ quiet: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update featured order");
    } finally {
      setMoving(null);
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Groups"
        description="Community groups created by members. Click a name to review posts and comments, or to feature the group on the app Home tab."
      />

      <FeaturedLineup
        items={lineupItems}
        loading={loading}
        moving={moving}
        onMove={handleMoveLineup}
        sectionLabel="Groups"
        surfaces={["home"]}
        detailHref={(g) => `/admin/groups/${g.id}`}
        editHref={(g) => `/admin/groups/${g.id}`}
        getMeta={(g) => [g.topic, groupLocation(g)].filter(Boolean).join(" · ") || null}
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
                <th>Home</th>
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
                  <td>{g.isFeaturedOnHome ? `Featured #${g.featuredOnHomeOrder ?? "—"}` : "—"}</td>
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
