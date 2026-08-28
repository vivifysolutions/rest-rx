"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { ApplicationProfileForm } from "@/components/admin/ApplicationProfileForm";
import { ActiveBadge, ActiveToggleButton } from "@/components/admin/ActiveBadge";
import { RejectApplicationModal } from "@/components/admin/RejectApplicationModal";
import { formatApplicationStatus } from "@/lib/admin-labels";
import { displayUserName } from "@/lib/admin-user-display";
import {
  ApiError,
  deleteUser,
  getUser,
  updateApplicationStatus,
  updateUserActive,
  updateUserProfile,
  updateUserType,
  type UpdateUserProfilePayload,
} from "@/lib/api";
import type { ApiUser, ApplicationStatus, UserType } from "@/lib/types";
import {
  EXPERT_DIRECTORY_TYPES,
  PARTNER_DIRECTORY_TYPES,
  USER_TYPE_LABELS,
  getApprovedDirectory,
} from "@/lib/user-types";
import { ExpertAttachedContent } from "@/components/admin/ExpertAttachedContent";
import { PartnerAttachedContent } from "@/components/admin/PartnerAttachedContent";

const USER_TYPES: UserType[] = ["member", "admin", "brand_partner", "expert", "ambassador", "foundation"];

type DetailMode = "application" | "member" | "partner" | "expert";

type Props = {
  userId: string;
  mode: DetailMode;
};

function isPartnerType(userType: UserType) {
  return PARTNER_DIRECTORY_TYPES.includes(userType);
}

function isExpertType(userType: UserType) {
  return EXPERT_DIRECTORY_TYPES.includes(userType);
}

function directoryForMode(mode: DetailMode): { href: string; label: string } {
  if (mode === "application") return { href: "/admin/users", label: "Member applications" };
  if (mode === "partner") return { href: "/admin/partners", label: "Partners" };
  if (mode === "expert") return { href: "/admin/experts", label: "Experts" };
  return { href: "/admin/members", label: "Members" };
}

export function AdminUserDetail({ userId, mode }: Props) {
  const router = useRouter();
  const { refreshToken, profile } = usePortalAuth();
  const { href: backHref, label: backLabel } = directoryForMode(mode);

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleActiveChange(isActive: boolean) {
    if (!user) return;
    setSavingMeta(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(await updateUserActive(token, user.id, isActive));
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

  async function handleReject(payload: { reason: string; issue?: string }) {
    if (!user || !payload.issue) return;
    setRejecting(true);
    setRejectError(null);
    try {
      const token = await refreshToken();
      if (!token) return;
      setUser(
        await updateApplicationStatus(
          token,
          user.id,
          "rejected",
          payload.reason,
          payload.issue,
        ),
      );
      setRejectModalOpen(false);
    } catch (e) {
      setRejectError(
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to reject application",
      );
    } finally {
      setRejecting(false);
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

  async function handleDelete() {
    if (!user || profile?.id === user.id) return;
    const name = displayUserName(user);
    if (
      !confirm(
        `Delete ${name}? Their account, sign-in, and personal data will be permanently removed. This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      await deleteUser(token, user.id);
      router.push(backHref);
    } catch (e) {
      setDeleteError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to delete user",
      );
      setDeleting(false);
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
  const isSelf = profile?.id === user.id;
  const metaBusy = savingMeta || deleting;
  const wrongSection =
    (mode === "application" && isApproved) ||
    (mode === "member" &&
      (!isApproved || isPartnerType(user.userType) || isExpertType(user.userType))) ||
    (mode === "partner" && (!isApproved || !isPartnerType(user.userType))) ||
    (mode === "expert" && (!isApproved || !isExpertType(user.userType)));

  const approvedDirectory = getApprovedDirectory(user.userType);
  const approvedDirectoryHref = `${approvedDirectory.href}/${user.id}`;
  const approvedDirectoryLabel = approvedDirectory.label;

  return (
    <>
    <AdminDetailLayout
      backHref={backHref}
      backLabel={backLabel}
      title={displayUserName(user)}
      actions={
        <>
          {mode === "application" && (
            <>
              {user.applicationStatus !== "pending" && (
                <button
                  className="admin-link-muted"
                  onClick={() => handleStatusChange("pending")}
                  disabled={metaBusy}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Reset to pending
                </button>
              )}
              {user.applicationStatus !== "approved" && (
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleStatusChange("approved")}
                  disabled={metaBusy}
                >
                  Approve
                </button>
              )}
              {user.applicationStatus !== "rejected" && (
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={metaBusy}
                >
                  Reject
                </button>
              )}
            </>
          )}
          {(mode === "partner" || mode === "expert") && (
            <>
              <ActiveBadge isActive={user.isActive} />
              <ActiveToggleButton
                isActive={user.isActive}
                onToggle={() => handleActiveChange(!user.isActive)}
                disabled={savingMeta}
              />
            </>
          )}
          <select
            value={user.userType}
            onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
            disabled={metaBusy}
            className="admin-btn"
            style={{ fontSize: "0.85rem" }}
          >
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => void handleDelete()}
            disabled={metaBusy || isSelf}
            title={isSelf ? "You cannot delete your own account" : undefined}
          >
            {deleting ? "Deleting…" : "Delete user"}
          </button>
        </>
      }
    >
      {deleteError && (
        <p className="admin-error" style={{ marginBottom: "1rem" }}>
          {deleteError}
        </p>
      )}
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
              : mode === "expert"
                ? "Expert account"
                : "Membership"
        }
      >
        <DetailRow label="Application" value={formatApplicationStatus(user.applicationStatus)} />
        {(mode === "partner" || mode === "expert") && (
          <DetailRow label="Status" value={user.isActive ? "Active" : "Inactive"} />
        )}
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
        {(mode === "member" || mode === "partner" || mode === "expert") && (
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
          approved experts move to <Link href="/admin/experts">Experts</Link>; approved brand and
          foundation accounts move to <Link href="/admin/partners">Partners</Link>.
        </div>
      )}
    </AdminDetailLayout>
    {mode === "expert" && <ExpertAttachedContent userId={user.id} />}
    {mode === "partner" && <PartnerAttachedContent userId={user.id} />}
    <RejectApplicationModal
      open={rejectModalOpen}
      saving={rejecting}
      error={rejectError}
      includeIssueSelect
      onCancel={() => {
        if (rejecting) return;
        setRejectModalOpen(false);
        setRejectError(null);
      }}
      onSubmit={handleReject}
    />
    </>
  );
}
