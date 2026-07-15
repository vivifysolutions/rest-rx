"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { ApplicationProfileForm } from "@/components/admin/ApplicationProfileForm";
import { formatApplicationStatus } from "@/lib/admin-labels";
import { displayUserName } from "@/lib/admin-user-display";
import {
  getUser,
  updateApplicationStatus,
  updateUserProfile,
  updateUserType,
  type UpdateUserProfilePayload,
} from "@/lib/api";
import type { ApiUser, ApplicationStatus, UserType } from "@/lib/types";
import {
  PARTNER_DIRECTORY_TYPES,
  USER_TYPE_LABELS,
} from "@/lib/user-types";

const USER_TYPES: UserType[] = ["member", "admin", "brand_partner", "expert", "ambassador", "foundation"];
const APPLICATION_STATUSES: ApplicationStatus[] = ["pending", "approved", "rejected"];

type Props = {
  userId: string;
  mode: "application" | "member" | "partner";
};

function isPartnerType(userType: UserType) {
  return PARTNER_DIRECTORY_TYPES.includes(userType);
}

export function AdminUserDetail({ userId, mode }: Props) {
  const { refreshToken } = usePortalAuth();
  const backHref =
    mode === "application"
      ? "/admin/users"
      : mode === "partner"
        ? "/admin/partners"
        : "/admin/members";
  const backLabel =
    mode === "application"
      ? "Member applications"
      : mode === "partner"
        ? "Partners"
        : "Members";

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      setUser(await getUser(token, userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUserTypeChange(userType: UserType) {
    if (!user) return;
    setSavingMeta(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(await updateUserType(token, user.id, userType));
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleStatusChange(applicationStatus: ApplicationStatus) {
    if (!user) return;
    setSavingMeta(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(await updateApplicationStatus(token, user.id, applicationStatus));
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleProfileSave(payload: UpdateUserProfilePayload): Promise<boolean> {
    if (!user) return false;
    setSavingProfile(true);
    setSaveError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      setUser(await updateUserProfile(token, user.id, payload));
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save profile");
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error || !user) {
    return <p className="admin-error">{error ?? "User not found"}</p>;
  }

  const onboardingEntries =
    user.onboardingAnswers && typeof user.onboardingAnswers === "object"
      ? Object.entries(user.onboardingAnswers)
      : [];

  const isApproved = user.applicationStatus === "approved";
  const wrongSection =
    (mode === "application" && isApproved) ||
    (mode === "member" && (!isApproved || isPartnerType(user.userType))) ||
    (mode === "partner" && (!isApproved || !isPartnerType(user.userType)));

  const approvedDirectoryHref = isPartnerType(user.userType)
    ? `/admin/partners/${user.id}`
    : `/admin/members/${user.id}`;
  const approvedDirectoryLabel = isPartnerType(user.userType) ? "Partners" : "Members";

  return (
    <AdminDetailLayout
      backHref={backHref}
      backLabel={backLabel}
      title={displayUserName(user)}
      actions={
        <>
          {mode === "application" && (
            <select
              value={user.applicationStatus}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              disabled={savingMeta}
              className="admin-btn"
              style={{ fontSize: "0.85rem" }}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatApplicationStatus(s)}
                </option>
              ))}
            </select>
          )}
          <select
            value={user.userType}
            onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
            disabled={savingMeta}
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
      {wrongSection && (
        <div className="admin-callout" style={{ marginBottom: "1rem" }}>
          {isApproved ? (
            <>
              This user belongs in the approved {approvedDirectoryLabel.toLowerCase()} list.{" "}
              <Link href={approvedDirectoryHref}>Open in {approvedDirectoryLabel}</Link>
            </>
          ) : (
            <>
              This user is still in the application queue.{" "}
              <Link href={`/admin/users/${user.id}`}>Open in Member applications</Link>
            </>
          )}
        </div>
      )}

      <DetailSection
        title={
          mode === "application"
            ? "Application status"
            : mode === "partner"
              ? "Partner account"
              : "Membership"
        }
      >
        <DetailRow label="Application" value={formatApplicationStatus(user.applicationStatus)} />
        {mode === "application" && (
          <DetailRow
            label="Submitted"
            value={
              user.applicationSubmittedAt
                ? new Date(user.applicationSubmittedAt).toLocaleString()
                : "Not submitted"
            }
          />
        )}
        <DetailRow label="Role" value={USER_TYPE_LABELS[user.userType]} />
        <DetailRow label="Member since" value={new Date(user.createdAt).toLocaleString()} />
        {(mode === "member" || mode === "partner") && (
          <DetailRow
            label="Onboarding"
            value={
              user.onboardingCompletedAt
                ? `Complete (${new Date(user.onboardingCompletedAt).toLocaleDateString()})`
                : "Incomplete"
            }
          />
        )}
      </DetailSection>

      <ApplicationProfileForm
        user={user}
        saving={savingProfile}
        saveError={saveError}
        onSave={handleProfileSave}
      />

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

      {mode === "application" && user.applicationStatus === "pending" && (
        <div className="admin-callout" style={{ marginTop: "0.5rem" }}>
          Review and edit the profile above, then approve or reject this application. Approved
          healthcare members and ambassadors move to <Link href="/admin/members">Members</Link>;
          approved brand, expert, and foundation accounts move to{" "}
          <Link href="/admin/partners">Partners</Link>.
        </div>
      )}
    </AdminDetailLayout>
  );
}
