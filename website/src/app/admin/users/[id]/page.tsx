"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailRow,
  DetailSection,
  DetailVerificationPhoto,
} from "@/components/admin/AdminDetailView";
import { formatApplicationStatus } from "@/lib/admin-labels";
import {
  getUser,
  updateApplicationStatus,
  updateUserType,
} from "@/lib/api";
import type { ApiUser, ApplicationStatus, UserType } from "@/lib/types";
import { USER_TYPE_LABELS } from "@/lib/user-types";

const USER_TYPES: UserType[] = ["member", "admin", "brand_partner", "expert"];
const APPLICATION_STATUSES: ApplicationStatus[] = ["pending", "approved", "rejected"];

function displayName(user: ApiUser): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.displayName ||
    user.email ||
    "Applicant"
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshToken } = usePortalAuth();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      setUser(await getUser(token, id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUserTypeChange(userType: UserType) {
    if (!user) return;
    setSaving(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(await updateUserType(token, user.id, userType));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(applicationStatus: ApplicationStatus) {
    if (!user) return;
    setSaving(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(await updateApplicationStatus(token, user.id, applicationStatus));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error || !user) return <p className="admin-error">{error ?? "Application not found"}</p>;

  const onboardingEntries =
    user.onboardingAnswers && typeof user.onboardingAnswers === "object"
      ? Object.entries(user.onboardingAnswers)
      : [];

  return (
    <AdminDetailLayout
      backHref="/admin/users"
      backLabel="Applications"
      title={displayName(user)}
      actions={
        <>
          <select
            value={user.applicationStatus}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            disabled={saving}
            className="admin-btn"
            style={{ fontSize: "0.85rem" }}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatApplicationStatus(s)}
              </option>
            ))}
          </select>
          <select
            value={user.userType}
            onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
            disabled={saving}
            className="admin-btn"
            style={{ fontSize: "0.85rem" }}
          >
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </>
      }
    >
      <DetailSection title="Application status">
        <DetailRow label="Status" value={formatApplicationStatus(user.applicationStatus)} />
        <DetailRow
          label="Submitted"
          value={
            user.applicationSubmittedAt
              ? new Date(user.applicationSubmittedAt).toLocaleString()
              : "Not submitted"
          }
        />
        <DetailRow label="Role" value={USER_TYPE_LABELS[user.userType]} />
        <DetailRow label="Member since" value={new Date(user.createdAt).toLocaleString()} />
      </DetailSection>

      <DetailSection title="Profile">
        <DetailRow label="Email" value={user.email ?? "—"} />
        <DetailRow label="First name" value={user.firstName ?? "—"} />
        <DetailRow label="Last name" value={user.lastName ?? "—"} />
        <DetailRow label="Display name" value={user.displayName ?? "—"} />
        <DetailRow label="Professional role" value={user.professionalRole ?? "—"} />
        <DetailRow label="Specialty" value={user.specialty ?? "—"} />
        <DetailRow label="NPI number" value={user.npiNumber ?? "—"} />
        <DetailRow label="Phone" value={user.phone ?? "—"} />
      </DetailSection>

      <DetailSection title="Verification photos">
        <DetailRow label="Documents">
          <div className="admin-verification-grid">
            <DetailVerificationPhoto src={user.identityPhotoUrl} label="Identity photo" />
            <DetailVerificationPhoto src={user.workCredentialPhotoUrl} label="Work credential" />
          </div>
        </DetailRow>
      </DetailSection>

      {onboardingEntries.length > 0 && (
        <DetailSection title="Onboarding answers">
          {onboardingEntries.map(([key, value]) => (
            <DetailRow
              key={key}
              label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              value={
                typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "—")
              }
            />
          ))}
          {user.onboardingCompletedAt && (
            <DetailRow
              label="Completed"
              value={new Date(user.onboardingCompletedAt).toLocaleString()}
            />
          )}
        </DetailSection>
      )}

      {user.applicationStatus === "pending" && (
        <div className="admin-callout" style={{ marginTop: "0.5rem" }}>
          Review the profile and verification photos above, then approve or reject this application.
        </div>
      )}
    </AdminDetailLayout>
  );
}
