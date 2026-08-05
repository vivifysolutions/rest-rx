"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
};

export function RejectApplicationModal({
  open,
  saving,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

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
          The applicant will receive an email letting them know their
          verification wasn&apos;t approved. This reason will be included in
          that email alongside our standard email template.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Why is this application being rejected?"
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
            onClick={() => onSubmit(reason)}
            disabled={saving || !reason.trim()}
          >
            {saving ? "Rejecting…" : "Reject & notify applicant"}
          </button>
        </div>
      </div>
    </div>
  );
}
