"use client";

import { useEffect, useState } from "react";
import {
  APPLICATION_REJECTION_ISSUES,
  type ApplicationRejectionIssue,
} from "@/lib/application-rejection";

export type RejectApplicationPayload = {
  reason: string;
  issue?: ApplicationRejectionIssue;
};

type Props = {
  open: boolean;
  saving: boolean;
  error: string | null;
  /** Member applications: require an issue so the app can route to the right screen. */
  includeIssueSelect?: boolean;
  onCancel: () => void;
  onSubmit: (payload: RejectApplicationPayload) => void;
};

export function RejectApplicationModal({
  open,
  saving,
  error,
  includeIssueSelect = false,
  onCancel,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");
  const [issue, setIssue] = useState<ApplicationRejectionIssue | "">("");

  useEffect(() => {
    if (open) {
      setReason("");
      setIssue("");
    }
  }, [open]);

  if (!open) return null;

  const notesRequired = !includeIssueSelect || issue === "other";
  const canSubmit =
    (!includeIssueSelect || Boolean(issue)) &&
    (!notesRequired || Boolean(reason.trim()));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: "1.5rem",
          width: "min(480px, 90vw)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Reject application</h3>
        <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>
          {includeIssueSelect
            ? "Select what needs to be fixed so the applicant is sent to that screen in the app. Optional notes are included in their email."
            : "The applicant will receive an email letting them know their verification wasn't approved. This reason will be included in that email alongside our standard email template."}
        </p>
        {includeIssueSelect ? (
          <label
            className="admin-form"
            style={{ display: "block", marginBottom: "0.75rem" }}
          >
            <span style={{ display: "block", fontSize: "0.85rem", marginBottom: 6 }}>
              What&apos;s the issue?
            </span>
            <select
              value={issue}
              onChange={(e) =>
                setIssue(e.target.value as ApplicationRejectionIssue | "")
              }
              disabled={saving}
              style={{ width: "100%" }}
            >
              <option value="">Select an issue</option>
              {APPLICATION_REJECTION_ISSUES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={
            notesRequired
              ? "Why is this application being rejected?"
              : "Optional note for the applicant"
          }
          disabled={saving}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
        {error && <p className="admin-error">{error}</p>}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="admin-btn"
            style={{ background: "#e8eef3", color: "#1a1a1a" }}
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-danger"
            onClick={() =>
              onSubmit({
                reason: reason.trim(),
                issue: includeIssueSelect
                  ? (issue as ApplicationRejectionIssue)
                  : undefined,
              })
            }
            disabled={saving || !canSubmit}
          >
            {saving ? "Rejecting…" : "Reject & notify applicant"}
          </button>
        </div>
      </div>
    </div>
  );
}
