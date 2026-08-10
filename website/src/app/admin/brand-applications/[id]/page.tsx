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
import { RejectApplicationModal } from "@/components/admin/RejectApplicationModal";
import {
  ApiError,
  approveBrandPartnerApplication,
  getBrandPartnerApplication,
  rejectBrandPartnerApplication,
  updateUserType,
} from "@/lib/api";
import type { BrandPartnerApplication } from "@/lib/brand-partner-application";
import { parseAdditionalUrls } from "@/lib/brand-partner-application";
import type { UserType } from "@/lib/types";
import { USER_TYPE_LABELS } from "@/lib/user-types";
import {
  getAppDiscountTier,
  getDisplayOfferings,
  getOtherPartnershipInterests,
  getProductPartnerships,
  hasCustomPartnership,
  labelApplicationType,
  labelGeographicScope,
  labelOfferingOption,
  labelPartnershipInterest,
} from "@/lib/partner-application-options";

const ACCOUNT_TYPES: UserType[] = [
  "member",
  "brand_partner",
  "expert",
  "ambassador",
  "foundation",
];

function statusLabel(status: BrandPartnerApplication["status"]): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

export default function AdminBrandApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshToken } = usePortalAuth();
  const [app, setApp] = useState<BrandPartnerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      setApp(await getBrandPartnerApplication(token, id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove() {
    if (!app) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      setApp(await approveBrandPartnerApplication(token, app.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(reason: string) {
    if (!app) return;
    setRejecting(true);
    setRejectError(null);
    try {
      const token = await refreshToken();
      if (!token) return;
      setApp(await rejectBrandPartnerApplication(token, app.id, reason));
      setRejectModalOpen(false);
    } catch (e) {
      setRejectError(
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to reject application",
      );
    } finally {
      setRejecting(false);
    }
  }

  async function handleUserTypeChange(userType: UserType) {
    if (!app?.userId || !app.user) return;
    setSavingType(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) return;
      const updated = await updateUserType(token, app.userId, userType);
      setApp((prev) =>
        prev?.user
          ? { ...prev, user: { ...prev.user, userType: updated.userType } }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update account type");
    } finally {
      setSavingType(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error && !app) return <p className="admin-error">{error}</p>;
  if (!app) return <p className="admin-error">Application not found</p>;

  const additionalUrls = parseAdditionalUrls(app.otherSocialMedia);
  const currentType = (app.user?.userType as UserType | undefined) ?? undefined;

  return (
    <>
    <AdminDetailLayout
      backHref="/admin/brand-applications"
      backLabel="Partner applications"
      title={app.companyName}
      actions={
        app.status === "pending" ? (
          <>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={busy}
              onClick={handleApprove}
            >
              Approve
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={() => setRejectModalOpen(true)}
            >
              Reject
            </button>
          </>
        ) : undefined
      }
    >
      <DetailSection title="Application">
        <DetailRow label="Type" value={labelApplicationType(app.applicationType)} />
        <DetailRow label="Status" value={statusLabel(app.status)} />
        <DetailRow label="Contact" value={`${app.fullName} (${app.email})`} />
        {app.representativeTitle && (
          <DetailRow label="Representative title" value={app.representativeTitle} />
        )}
        <DetailRow label="Phone" value={app.phone ?? "—"} />
        <DetailRow
          label="Portal account"
          value={app.userId ? "Created" : "Not linked"}
        />
        {app.userId && currentType ? (
          <DetailRow label="Account type">
            <div>
              <select
                value={currentType}
                onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
                disabled={savingType || busy || app.status !== "pending"}
                className="admin-btn"
                style={{ fontSize: "0.85rem" }}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {USER_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {app.status === "pending" ? (
                <p className="admin-field-hint" style={{ marginTop: "0.5rem" }}>
                  Set on apply from what they requested. Change to{" "}
                  <strong>Member</strong> to deny that role before you approve or reject.
                  Access stays blocked until you approve.
                </p>
              ) : null}
            </div>
          </DetailRow>
        ) : null}
        <DetailRow label="Submitted" value={new Date(app.createdAt).toLocaleString()} />
      </DetailSection>

      <DetailSection title="Business">
        <DetailRow label="Website" value={app.website ?? "—"} />
        <DetailRow label="Instagram" value={app.instagram} />
        <DetailRow label="TikTok" value={app.tiktok ?? "—"} />
        <DetailRow label="LinkedIn" value={app.linkedin ?? "—"} />
        <DetailRow label="Address" value={app.address ?? "—"} />
        <DetailRow
          label="Other URLs"
          value={additionalUrls.length > 0 ? additionalUrls.join(", ") : "—"}
        />
      </DetailSection>

      {(app.applicationType === "expert" || app.applicationType === "ambassador") &&
        app.user && (
          <DetailSection title="Professional credentials">
            <DetailRow
              label="Name"
              value={
                [app.user.firstName, app.user.lastName].filter(Boolean).join(" ") ||
                app.user.displayName ||
                "—"
              }
            />
            <DetailRow label="Professional role" value={app.user.professionalRole ?? "—"} />
            <DetailRow label="Specialty" value={app.user.specialty ?? "—"} />
            <DetailRow label="NPI number" value={app.user.npiNumber ?? "—"} />
            <DetailRow label="Phone" value={app.user.phone ?? app.phone ?? "—"} />
            <DetailRow label="Verification photos">
              <div className="admin-verification-grid">
                <DetailVerificationPhoto
                  src={app.user.identityPhotoUrl}
                  label="Identity photo"
                />
                <DetailVerificationPhoto
                  src={app.user.workCredentialPhotoUrl}
                  label="Work credential"
                />
              </div>
            </DetailRow>
          </DetailSection>
        )}

      <DetailSection title={
        app.applicationType === "expert"
          ? "Bio"
          : app.applicationType === "ambassador"
            ? "Ambassador statement"
            : app.applicationType === "foundation"
              ? "Organization"
              : "Wellness alignment"
      }>
        <DetailRow
          label={
            app.applicationType === "expert"
              ? "Bio"
              : app.applicationType === "ambassador"
                ? "Statement"
                : app.applicationType === "foundation"
                  ? "Organization"
                  : "Response"
          }
          value={
            app.applicationType === "foundation"
              ? app.companyName
              : app.wellnessAlignment || "—"
          }
        />
      </DetailSection>

      {app.applicationType === "brand_partner" && (
        <DetailSection title="Brand partner details">
          <DetailRow label="Category" value={app.businessCategory ?? "—"} />
          {app.partnershipInterests?.length ? (
            <>
              {getAppDiscountTier(app.partnershipInterests) ? (
                <DetailRow
                  label="App discount tier"
                  value={labelPartnershipInterest(getAppDiscountTier(app.partnershipInterests))}
                />
              ) : null}
              {getProductPartnerships(app.partnershipInterests).length > 0 ? (
                <DetailRow
                  label="Product partnerships"
                  value={getProductPartnerships(app.partnershipInterests)
                    .map(labelPartnershipInterest)
                    .join(", ")}
                />
              ) : null}
              {hasCustomPartnership(app.partnershipInterests) ? (
                <DetailRow label="Custom partnership" value="Yes" />
              ) : null}
              {getOtherPartnershipInterests(app.partnershipInterests).length > 0 ? (
                <DetailRow
                  label="Other interests"
                  value={getOtherPartnershipInterests(app.partnershipInterests)
                    .map(labelPartnershipInterest)
                    .join(", ")}
                />
              ) : null}
            </>
          ) : (
            <DetailRow label="Partnership interests" value="—" />
          )}
          <DetailRow
            label="Geographic reach"
            value={app.geographicScope ? labelGeographicScope(app.geographicScope) : "—"}
          />
          <DetailRow
            label="Offerings"
            value={
              getDisplayOfferings(app.deliveryTypes, app.offeringType)
                .map(labelOfferingOption)
                .join(", ") || "—"
            }
          />
        </DetailSection>
      )}

      {app.applicationType === "expert" && (
        <DetailSection title="Expert contributor details">
          <DetailRow label="Forum topics" value={app.expertTopics?.join(", ") ?? "—"} />
          <DetailRow
            label="Content / resource types"
            value={app.contentResourceTypes?.join(", ") ?? "—"}
          />
        </DetailSection>
      )}

      {app.applicationType === "foundation" && (
        <DetailSection title="Non-profit Organization / foundation details">
          <DetailRow label="Topics" value={app.expertTopics?.join(", ") ?? "—"} />
          <DetailRow
            label="Resource types"
            value={app.contentResourceTypes?.join(", ") ?? "—"}
          />
          <DetailRow label="Additional information" value={app.message ?? "—"} />
        </DetailSection>
      )}

      {app.status === "pending" && (
        <div className="admin-callout">
          {app.applicationType === "ambassador" ? (
            <>
              Approve to grant mobile app access. Ambassadors are community members who share on
              behalf of Rest &amp; Rx — they use the mobile app (not the web portal) and appear under{" "}
              <Link href="/admin/members">Members</Link> after approval. Set account type to Member
              first if you are denying ambassador access.
            </>
          ) : app.applicationType === "foundation" ? (
            <>
              Approve to unlock portal access for resource uploads. Non-profit and foundation partners
              use the web portal only. To deny that role, set account type to Member, then reject (or
              approve as member with no portal privileges).
            </>
          ) : (
            <>
              The applicant already has the applied account type, but portal access stays locked until
              you approve. Set account type to Member if you want to deny the role they applied for.
              Once approved, they can sign in at <Link href="/portal/login">/portal/login</Link>.
            </>
          )}
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
    <RejectApplicationModal
      open={rejectModalOpen}
      saving={rejecting}
      error={rejectError}
      onCancel={() => setRejectModalOpen(false)}
      onSubmit={handleReject}
    />
    </>
  );
}
