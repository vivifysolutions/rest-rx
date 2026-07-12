"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AdminTitleLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="admin-title-link">
      {children}
    </Link>
  );
}

export function AdminDetailLayout({
  backHref,
  backLabel,
  title,
  actions,
  children,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="admin-detail-header">
        <Link href={backHref} className="admin-detail-back">
          ← {backLabel ?? "Back"}
        </Link>
        <div className="admin-detail-title-row">
          <h1 className="admin-detail-title">{title}</h1>
          {actions && <div className="admin-detail-actions">{actions}</div>}
        </div>
      </div>
      <div className="admin-card admin-detail-body">{children}</div>
    </>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-detail-section">
      <h2 className="admin-detail-section-title">{title}</h2>
      <dl className="admin-detail-grid">{children}</dl>
    </section>
  );
}

export function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children ?? value ?? "—"}</dd>
    </>
  );
}

export function DetailImage({
  src,
  alt,
  width = 240,
  height = 160,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      className="admin-detail-image"
      style={{ width, height, position: "relative" }}
    >
      <Image src={src} alt={alt} fill sizes={`${width}px`} unoptimized style={{ objectFit: "cover" }} />
    </div>
  );
}

export function DetailImageGrid({
  urls,
  label = "Images",
}: {
  urls: string[];
  label?: string;
}) {
  if (!urls.length) {
    return <span style={{ color: "var(--text-muted)" }}>No {label.toLowerCase()}</span>;
  }
  return (
    <div className="admin-detail-image-grid">
      {urls.map((url, index) => (
        <DetailImage key={`${url}-${index}`} src={url} alt={`${label} ${index + 1}`} width={160} height={120} />
      ))}
    </div>
  );
}

export function DetailVerificationPhoto({
  src,
  label,
}: {
  src: string | null | undefined;
  label: string;
}) {
  if (!src) {
    return (
      <div className="admin-verification-photo admin-verification-photo--empty">
        <p>{label}</p>
        <span>Not submitted</span>
      </div>
    );
  }
  return (
    <div className="admin-verification-photo">
      <p>{label}</p>
      <div className="admin-detail-image" style={{ width: "100%", height: 280, position: "relative" }}>
        <Image src={src} alt={label} fill sizes="400px" unoptimized style={{ objectFit: "contain" }} />
      </div>
    </div>
  );
}
