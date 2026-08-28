"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getCommunityMetrics, listUsers, updateUserType, type CommunityMetrics } from "@/lib/api";
import { subscribeAdminMetricsChanged } from "@/lib/admin-metrics-events";
import {
  displayUserName,
  onboardingSummary,
} from "@/lib/admin-user-display";
import { compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";
import type { ApiUser } from "@/lib/types";
import {
  MEMBER_DIRECTORY_TYPES,
  USER_TYPE_LABELS,
  getApprovedDirectory,
  type UserType,
} from "@/lib/user-types";

const USER_TYPES: UserType[] = [
  "member",
  "admin",
  "brand_partner",
  "expert",
  "ambassador",
  "foundation",
];

const ALL_APPROVED_TYPES: UserType[] = [
  "member",
  "ambassador",
  "expert",
  "brand_partner",
  "foundation",
  "admin",
];

type MemberSort = "name" | "professional" | "joined" | "type";
type ViewMode = "directory" | "all";

const SORT_OPTIONS: { value: MemberSort; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "professional", label: "Professional title" },
  { value: "type", label: "Account type" },
  { value: "joined", label: "Joined (newest)" },
];

function roleBadgeClass(userType: UserType): string {
  switch (userType) {
    case "brand_partner":
      return "admin-badge admin-badge-type-brand";
    case "expert":
      return "admin-badge admin-badge-type-expert";
    case "ambassador":
      return "admin-badge admin-badge-type-ambassador";
    case "foundation":
      return "admin-badge admin-badge-type-foundation";
    case "admin":
      return "admin-badge admin-badge-success";
    default:
      return "admin-badge admin-badge-type-member";
  }
}

export default function AdminMembersPage() {
  const { refreshToken } = usePortalAuth();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics["counts"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    searchParams.get("view") === "all" ? "all" : "directory",
  );
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sortByKey, setSortByKey] = useState<MemberSort>("name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");

      const directoryTypes =
        viewMode === "all" ? ALL_APPROVED_TYPES : [...MEMBER_DIRECTORY_TYPES];
      const typeOptions = viewMode === "all" ? ALL_APPROVED_TYPES : MEMBER_DIRECTORY_TYPES;

      const [data, community] = await Promise.all([
        listUsers(token, {
          applicationStatus: "approved",
          userType: filterType || undefined,
          userTypes: filterType ? undefined : directoryTypes,
          search: search || undefined,
        }),
        getCommunityMetrics(token).catch(() => null),
      ]);

      setItems(
        filterType && !typeOptions.includes(filterType as UserType)
          ? []
          : data,
      );
      setMetrics(community?.counts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterType, search, viewMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeAdminMetricsChanged(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    setFilterType("");
  }, [viewMode]);

  const sorted = useMemo(
    () =>
      sortBy(items, (a, b) => {
        switch (sortByKey) {
          case "professional":
            return (
              compareText(a.professionalRole, b.professionalRole) ||
              compareText(displayUserName(a), displayUserName(b))
            );
          case "type":
            return (
              compareText(USER_TYPE_LABELS[a.userType], USER_TYPE_LABELS[b.userType]) ||
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

  const typeFilterOptions =
    viewMode === "all" ? ALL_APPROVED_TYPES : MEMBER_DIRECTORY_TYPES;

  const directoryTotal = metrics ? metrics.members + metrics.ambassadors : null;

  async function handleUserTypeChange(userId: string, userType: UserType) {
    setSavingId(userId);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateUserType(token, userId, userType);
      const keepTypes = viewMode === "all" ? ALL_APPROVED_TYPES : MEMBER_DIRECTORY_TYPES;
      setItems((prev) =>
        prev
          .map((u) => (u.id === userId ? updated : u))
          .filter((u) => keepTypes.includes(u.userType)),
      );
      const community = await getCommunityMetrics(token);
      setMetrics(community.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <ContentPageHeader
        title={viewMode === "all" ? "All app users" : "Members"}
        description={
          viewMode === "all"
            ? "Every approved account on Rest & Rx — members, partners, and admins."
            : "Approved healthcare members and ambassadors. Experts have their own section; brand and foundation accounts live under Partners."
        }
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "0.75rem" }}>
        <span className="admin-filter-label">View</span>
        <button
          type="button"
          className={`admin-btn ${viewMode === "directory" ? "admin-btn-primary" : ""}`}
          onClick={() => setViewMode("directory")}
        >
          Members directory
          {directoryTotal != null ? (
            <span className="admin-filter-count">{directoryTotal}</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`admin-btn ${viewMode === "all" ? "admin-btn-primary" : ""}`}
          onClick={() => setViewMode("all")}
        >
          View all users
          {metrics ? (
            <span className="admin-filter-count">{metrics.totalApproved}</span>
          ) : null}
        </button>
      </div>

      {metrics && viewMode === "directory" ? (
        <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
          <span className="admin-filter-label">Totals</span>
          <button
            type="button"
            className={`admin-btn ${filterType === "member" ? "admin-btn-primary" : ""}`}
            onClick={() => setFilterType(filterType === "member" ? "" : "member")}
          >
            Members <span className="admin-filter-count">{metrics.members}</span>
          </button>
          <button
            type="button"
            className={`admin-btn ${filterType === "ambassador" ? "admin-btn-primary" : ""}`}
            onClick={() => setFilterType(filterType === "ambassador" ? "" : "ambassador")}
          >
            Ambassadors <span className="admin-filter-count">{metrics.ambassadors}</span>
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Directory total: <strong>{directoryTotal}</strong>
            {" · "}
            App total: <strong>{metrics.totalApproved}</strong>
          </span>
        </div>
      ) : metrics && viewMode === "all" ? (
        <div className="admin-card" style={{ marginBottom: "1rem", padding: "0.85rem 1rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Total approved users on the app:{" "}
            <strong style={{ color: "var(--downriver)" }}>{metrics.totalApproved}</strong>
            {" · "}
            Members {metrics.members} · Ambassadors {metrics.ambassadors} · Experts{" "}
            {metrics.experts} · Brand partners {metrics.brandPartners} · Foundations{" "}
            {metrics.foundations}
          </p>
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
        <label>
          Account type
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">{viewMode === "all" ? "All types" : "All members"}</option>
            {typeFilterOptions.map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
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
          <p style={{ color: "var(--text-muted)" }}>No approved users found.</p>
        ) : (
          <>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {sorted.length}
              {metrics
                ? ` of ${
                    viewMode === "all"
                      ? metrics.totalApproved
                      : filterType === "member"
                        ? metrics.members
                      : filterType === "ambassador"
                        ? metrics.ambassadors
                        : directoryTotal
                  }`
                : ""}{" "}
              users
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account type</th>
                  <th>Professional info</th>
                  <th>Onboarding</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <AdminTitleLink href={`${getApprovedDirectory(u.userType).href}/${u.id}`}>
                        {displayUserName(u)}
                      </AdminTitleLink>
                    </td>
                    <td>{u.email ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <span className={roleBadgeClass(u.userType)}>
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
                          {USER_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {USER_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
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
