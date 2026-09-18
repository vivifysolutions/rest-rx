import Link from "next/link";
import type { LegalSection } from "@/lib/legal-copy";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-copy";

export function LegalPage({
  title,
  summary,
  sections,
  meta,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
  meta?: { legalEntity?: string; website?: string; contact?: string };
}) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--brand-cream)" }}>
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "3rem 1.5rem 5rem",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--astral)",
            marginBottom: "1.5rem",
          }}
        >
          ← Back to home
        </Link>
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--marigold)",
            margin: "0 0 0.5rem",
          }}
        >
          Rest & Rx
        </p>
        <h1
          className="font-subheading"
          style={{
            fontSize: "2rem",
            color: "var(--downriver)",
            margin: "0 0 0.75rem",
          }}
        >
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          {summary}
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
          Last updated {LEGAL_LAST_UPDATED}
          {meta?.legalEntity ? ` · ${meta.legalEntity}` : ""}
        </p>
        {sections.map((section) => (
          <section key={section.heading} style={{ marginBottom: "1.75rem" }}>
            <h2
              className="font-subheading"
              style={{
                fontSize: "1.15rem",
                color: "var(--downriver)",
                margin: "0 0 0.6rem",
              }}
            >
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p
                key={p.slice(0, 48)}
                style={{
                  color: "var(--text-primary)",
                  lineHeight: 1.65,
                  margin: "0 0 0.75rem",
                }}
              >
                {p}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul style={{ paddingLeft: "1.2rem", color: "var(--text-primary)", lineHeight: 1.65 }}>
                {section.bullets.map((item) => (
                  <li key={item} style={{ marginBottom: "0.35rem" }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
    </main>
  );
}
