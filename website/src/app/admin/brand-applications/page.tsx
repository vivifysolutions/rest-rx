"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { RejectApplicationModal } from "@/components/admin/RejectApplicationModal";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  ApiError,
  approveBrandPartnerApplication,
  getBrandPartnerApplications,
  rejectBrandPartnerApplication,
} from "@/lib/api";
import type { BrandPartnerApplication } from "@/lib/brand-partner-application";
import {
  labelApplicationType,
  labelApplicationTypeShort,
  PARTNER_APPLICATION_TYPE_FILTERS,
  type PartnerApplicationType,
} from "@/lib/partner-application-options";

function statusLabel(status: BrandPartnerApplication["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

function typeBadgeClass(type: PartnerApplicationType): string {
  switch (type) {
    case "expert":
      return "admin-badge admin-badge-type-expert";
    case "ambassador":
      return "admin-badge admin-badge-type-ambassador";
    case "foundation":
      return "admin-badge admin-badge-type-foundation";
    default:
      return "admin-badge admin-badge-type-brand";
  }
}

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type TypeFilter = PartnerApplicationType | "all";

export default function AdminBrandApplicationsPage() {
  const { refreshToken } = usePortalAuth();
  const [items, setItems] = useState<BrandPartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getBrandPartnerApplications(token, {
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(typeFilter === "all" ? {} : { applicationType: typeFilter }),
      });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of items) {
      counts[app.applicationType] = (counts[app.applicationType] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      const token = await refreshToken();
      if (!token) return;
      await approveBrandPartnerApplication(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTargetId) return;
    setRejecting(true);
    setRejectError(null);
    try {
      const token = await refreshToken();
      if (!token) return;
      await rejectBrandPartnerApplication(token, rejectTargetId, reason);
      setRejectTargetId(null);
      await load();
    } catch (e) {
      setRejectError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to reject application",
      );
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      <ContentPageHeader
        title="Partner applications"
        description="Review by partner type: brand partners, expert contributors, ambassadors, and non-profits. Approve after review; access stays locked until approved."
      />

      <div
        className="admin-card admin-filter-bar"
        style={{ marginBottom: "0.75rem" }}
      >
        <span className="admin-filter-label">Status</span>
        {(["pending", "approved", "rejected", "all"] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={`admin-btn ${statusFilter === status ? "admin-btn-primary" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : statusLabel(status)}
          </button>
        ))}
      </div>

      <div
        className="admin-card admin-filter-bar"
        style={{ marginBottom: "1rem" }}
      >
        <span className="admin-filter-label">Type</span>
        <button
          type="button"
          className={`admin-btn ${typeFilter === "all" ? "admin-btn-primary" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          All types
        </button>
        {PARTNER_APPLICATION_TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            className={`admin-btn ${typeFilter === type ? "admin-btn-primary" : ""}`}
            onClick={() => setTypeFilter(type)}
            title={labelApplicationType(type)}
          >
            {labelApplicationTypeShort(type)}
            {typeFilter === "all" && countsByType[type] ? (
              <span className="admin-filter-count">{countsByType[type]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No applications match this filter.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company / org</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Account type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link
                      href={`/admin/brand-applications/${app.id}`}
                      className="admin-title-link"
                    >
                      {app.companyName}
                    </Link>
                  </td>
                  <td>
                    {app.fullName}
                    <br />
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {app.email}
                    </span>
                  </td>
                  <td>
                    <span
                      className={typeBadgeClass(app.applicationType)}
                      title={labelApplicationType(app.applicationType)}
                    >
                      {labelApplicationTypeShort(app.applicationType)}
                    </span>
                  </td>
                  <td>
                    {app.user?.userType ? (
                      <span className="admin-badge admin-badge-muted">
                        {app.user.userType.replace(/_/g, " ")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{statusLabel(app.status)}</td>
                  <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td>
                    {app.status === "pending" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.35rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          disabled={busyId === app.id}
                          onClick={() => handleApprove(app.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-btn"
                          disabled={busyId === app.id}
                          onClick={() => setRejectTargetId(app.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RejectApplicationModal
        open={rejectTargetId !== null}
        saving={rejecting}
        error={rejectError}
        onCancel={() => setRejectTargetId(null)}
        onSubmit={handleReject}
      />
    </>
  );
}
