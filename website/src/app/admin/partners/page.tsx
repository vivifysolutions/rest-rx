"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { ActiveBadge, ActiveToggleButton } from "@/components/admin/ActiveBadge";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { listUsers, updateUserActive, updateUserType } from "@/lib/api";
import {
  displayUserName,
  onboardingSummary,
} from "@/lib/admin-user-display";
import type { ApiUser } from "@/lib/types";
import {
  PARTNER_DIRECTORY_TYPES,
  USER_TYPE_LABELS,
  type UserType,
} from "@/lib/user-types";

const ALL_USER_TYPES: UserType[] = [
  "member",
  "admin",
  "brand_partner",
  "expert",
  "ambassador",
  "foundation",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await listUsers(token, {
        applicationStatus: "approved",
        userType: filterType || undefined,
        userTypes: filterType ? undefined : [...PARTNER_DIRECTORY_TYPES],
        search: search || undefined,
      });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, filterType, search]);

  useEffect(() => {
    load();
  }, [load]);

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
      // Keep the row visible either way — an admin needs to see inactive partners
      // here in order to reactivate them, unlike a type change that leaves the filter.
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
        title="Partners"
        description="Approved brand, expert, and foundation accounts. Healthcare members and ambassadors live under Members."
      />

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
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No approved partners match this filter.</p>
        ) : (
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
              {items.map((u) => (
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
        )}
      </div>
    </>
  );
}
