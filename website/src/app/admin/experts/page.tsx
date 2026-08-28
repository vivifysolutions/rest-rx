"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ActiveBadge, ActiveToggleButton } from "@/components/admin/ActiveBadge";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import {
  getCommunityMetrics,
  listUsers,
  updateUserType,
  updateUserActive,
  type CommunityMetrics,
} from "@/lib/api";
import { subscribeAdminMetricsChanged } from "@/lib/admin-metrics-events";
import { displayUserName, onboardingSummary } from "@/lib/admin-user-display";
import { compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";
import type { ApiUser } from "@/lib/types";
import {
  EXPERT_DIRECTORY_TYPES,
  USER_TYPE_LABELS,
  type UserType,
} from "@/lib/user-types";
import Link from "next/link";

const ALL_USER_TYPES: UserType[] = [
  "member",
  "admin",
  "brand_partner",
  "expert",
  "ambassador",
  "foundation",
];

type ExpertSort = "name" | "professional" | "joined";

const SORT_OPTIONS: { value: ExpertSort; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "professional", label: "Professional title" },
  { value: "joined", label: "Joined (newest)" },
];

export default function AdminExpertsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics["counts"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sortByKey, setSortByKey] = useState<ExpertSort>("name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [data, community] = await Promise.all([
        listUsers(token, {
          applicationStatus: "approved",
          userTypes: [...EXPERT_DIRECTORY_TYPES],
          search: search || undefined,
        }),
        getCommunityMetrics(token).catch(() => null),
      ]);
      setItems(data);
      setMetrics(community?.counts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load experts");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeAdminMetricsChanged(() => {
      void load();
    });
  }, [load]);

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "professional":
            return (
              compareText(a.professionalRole, b.professionalRole) ||
              compareText(displayUserName(a), displayUserName(b))
            );
          case "joined":
            return compareDateDesc(a.createdAt, b.createdAt);
          case "name":
          default:
            return compareText(displayUserName(a), displayUserName(b));
        }
      }),
    [items, sortByKey],
  );

  async function handleUserTypeChange(userId: string, userType: UserType) {
    setSavingId(userId);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateUserType(token, userId, userType);
      setItems((prev) =>
        prev
          .map((u) => (u.id === userId ? updated : u))
          .filter((u) => EXPERT_DIRECTORY_TYPES.includes(u.userType)),
      );
      const community = await getCommunityMetrics(token);
      setMetrics(community.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  async function handleActiveChange(userId: string, isActive: boolean) {
    setSavingId(userId);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateUserActive(token, userId, isActive);
      setItems((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Experts"
        description="Approved expert accounts. Healthcare members and ambassadors live under Members; brand and foundation accounts live under Partners."
      />

      {metrics ? (
        <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
          <span className="admin-filter-label">Totals</span>
          <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Experts: <strong>{metrics.experts}</strong>
            {" · "}
            App total: <strong>{metrics.totalApproved}</strong>
          </span>
          <Link href="/admin/members?view=all" className="admin-btn" style={{ alignSelf: "center" }}>
            View all users
          </Link>
        </div>
      ) : null}

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Search
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchInput.trim());
            }}
            placeholder="Name or email"
          />
        </label>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => setSearch(searchInput.trim())}
        >
          Search
        </button>
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : sorted.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No approved experts match this filter.</p>
        ) : (
          <>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {sorted.length}
              {metrics ? ` of ${metrics.experts}` : ""} experts
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account type</th>
                  <th>Status</th>
                  <th>Professional info</th>
                  <th>Onboarding</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <AdminTitleLink href={`/admin/experts/${u.id}`}>
                        {displayUserName(u)}
                      </AdminTitleLink>
                    </td>
                    <td>{u.email ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <span className="admin-badge admin-badge-type-expert">
                          {USER_TYPE_LABELS[u.userType]}
                        </span>
                        <select
                          value={u.userType}
                          disabled={savingId === u.id}
                          onChange={(e) =>
                            handleUserTypeChange(u.id, e.target.value as UserType)
                          }
                          aria-label={`Change account type for ${displayUserName(u)}`}
                        >
                          {ALL_USER_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {USER_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <ActiveBadge isActive={u.isActive} />
                        <ActiveToggleButton
                          isActive={u.isActive}
                          onToggle={() => handleActiveChange(u.id, !u.isActive)}
                          disabled={savingId === u.id}
                        />
                      </div>
                    </td>
                    <td>
                      {[u.professionalRole, u.specialty].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>{onboardingSummary(u)}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
