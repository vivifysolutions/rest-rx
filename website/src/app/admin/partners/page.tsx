"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  PARTNER_DIRECTORY_TYPES,
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

type PartnerSort = "name" | "professional" | "joined" | "type";

const SORT_OPTIONS: { value: PartnerSort; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "professional", label: "Professional title" },
  { value: "type", label: "Partner type" },
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

export default function AdminPartnersPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<ApiUser[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics["counts"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sortByKey, setSortByKey] = useState<PartnerSort>("name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [data, community] = await Promise.all([
        listUsers(token, {
          applicationStatus: "approved",
          userType: filterType || undefined,
          userTypes: filterType ? undefined : [...PARTNER_DIRECTORY_TYPES],
          search: search || undefined,
        }),
        getCommunityMetrics(token).catch(() => null),
      ]);
      setItems(data);
      setMetrics(community?.counts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterType, search]);

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

  async function handleUserTypeChange(userId: string, userType: UserType) {
    setSavingId(userId);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateUserType(token, userId, userType);
      setItems((prev) =>
        prev
          .map((u) => (u.id === userId ? updated : u))
          .filter((u) => PARTNER_DIRECTORY_TYPES.includes(u.userType)),
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
        title="Partners"
        description="Approved brand and foundation accounts. Healthcare members, ambassadors, and experts live under Members."
      />

      {metrics ? (
        <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
          <span className="admin-filter-label">Totals</span>
          <button
            type="button"
            className={`admin-btn ${filterType === "brand_partner" ? "admin-btn-primary" : ""}`}
            onClick={() =>
              setFilterType(filterType === "brand_partner" ? "" : "brand_partner")
            }
          >
            Brand partners <span className="admin-filter-count">{metrics.brandPartners}</span>
          </button>
          <button
            type="button"
            className={`admin-btn ${filterType === "foundation" ? "admin-btn-primary" : ""}`}
            onClick={() =>
              setFilterType(filterType === "foundation" ? "" : "foundation")
            }
          >
            Foundations <span className="admin-filter-count">{metrics.foundations}</span>
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Partners total: <strong>{metrics.partners}</strong>
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
        <label>
          Partner type
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All partners</option>
            {PARTNER_DIRECTORY_TYPES.map((t) => (
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
          <p style={{ color: "var(--text-muted)" }}>No approved partners match this filter.</p>
        ) : (
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
                    <AdminTitleLink href={`/admin/partners/${u.id}`}>
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
                        {ALL_USER_TYPES.map((t) => (
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
        )}
      </div>
    </>
  );
}
