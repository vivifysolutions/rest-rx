"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ImageUploadGuideReference } from "@/components/admin/ImageUploadGuideReference";
import {
  getCommunityMetrics,
  getDiscounts,
  getEvents,
  getForumPosts,
  getReports,
  getResources,
  getRetreats,
  getThreads,
  healthCheck,
  type CommunityMetrics,
} from "@/lib/api";
import {
  GEOGRAPHIC_SCOPE_OPTIONS,
  labelApplicationTypeShort,
  labelGeographicScope,
  type PartnerApplicationType,
} from "@/lib/partner-application-options";

const ROLE_STATS: {
  label: string;
  key: keyof CommunityMetrics["counts"];
  href: string;
}[] = [
  { label: "Members", key: "members", href: "/admin/members" },
  { label: "Brand partners", key: "brandPartners", href: "/admin/partners" },
  { label: "Experts", key: "experts", href: "/admin/members" },
  { label: "Ambassadors", key: "ambassadors", href: "/admin/members" },
  { label: "Foundations", key: "foundations", href: "/admin/partners" },
];

function scopeLabel(value: string): string {
  if (value === "unspecified") return "Unspecified";
  return labelGeographicScope(value);
}

export default function AdminDashboardPage() {
  const { profile, token, refreshToken } = usePortalAuth();
  const [stats, setStats] = useState<Record<string, number | null>>({
    discounts: null,
    resources: null,
    events: null,
    retreats: null,
    threads: null,
    posts: null,
    pendingUsers: null,
    pendingPartners: null,
    pendingReports: null,
    pendingSuggestions: null,
  });
  const [metrics, setMetrics] = useState<CommunityMetrics | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        await healthCheck();
        if (!cancelled) setApiOk(true);

        const authToken = (await refreshToken()) ?? token;
        const [discountsRes, resourcesRes, eventsRes, retreatsRes] = await Promise.allSettled([
          getDiscounts(authToken ?? undefined),
          getResources(authToken ?? undefined),
          getEvents(authToken ?? undefined),
          getRetreats(authToken ?? undefined),
        ]);

        const failures: string[] = [];
        const unwrap = <T,>(res: PromiseSettledResult<T>, label: string): T | null => {
          if (res.status === "fulfilled") return res.value;
          failures.push(`${label}: ${res.reason instanceof Error ? res.reason.message : "failed"}`);
          return null;
        };

        const discounts = unwrap(discountsRes, "Discounts");
        const resources = unwrap(resourcesRes, "Resources");
        const events = unwrap(eventsRes, "Events");
        const retreats = unwrap(retreatsRes, "Retreats");

        let threadCount = 0;
        let postCount = 0;
        let pendingUsers = 0;
        let pendingPartners = 0;
        let pendingReports = 0;
        let pendingSuggestions = 0;
        let communityMetrics: CommunityMetrics | null = null;

        if (authToken) {
          const [threadsRes, postsRes, metricsRes, reportsRes] = await Promise.allSettled([
            getThreads(authToken, { limit: 100 }),
            getForumPosts(authToken, { limit: 100 }),
            getCommunityMetrics(authToken),
            getReports(authToken, "pending"),
          ]);

          const threads = unwrap(threadsRes, "Threads");
          const posts = unwrap(postsRes, "Posts");
          communityMetrics = unwrap(metricsRes, "Community metrics");
          const reports = unwrap(reportsRes, "Reports");

          threadCount = threads?.length ?? 0;
          postCount = posts?.length ?? 0;
          pendingUsers = communityMetrics?.pending.members ?? 0;
          pendingPartners = communityMetrics?.pending.partners ?? 0;
          pendingReports = reports?.length ?? 0;
          pendingSuggestions = communityMetrics?.pending.suggestions ?? 0;
        }

        if (!cancelled) {
          if (failures.length > 0) {
            setApiOk(false);
            setError(failures.join(" · "));
          }
          setMetrics(communityMetrics);
          setStats({
            discounts: discounts?.length ?? null,
            resources: resources?.length ?? null,
            events: events?.length ?? null,
            retreats: retreats?.length ?? null,
            threads: threadCount,
            posts: postCount,
            pendingUsers,
            pendingPartners,
            pendingReports,
            pendingSuggestions,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setApiOk(false);
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshToken]);

  const scopeEntries = metrics
    ? [...GEOGRAPHIC_SCOPE_OPTIONS.map((o) => o.value), "unspecified"].map((key) => ({
        key,
        label: scopeLabel(key),
        count: metrics.locations.byGeographicScope[key] ?? 0,
      }))
    : [];

  return (
    <>
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome{profile?.firstName ? `, ${profile.firstName}` : ""}. Manage app content,
          review signups, and moderate community activity.
        </p>
      </header>

      {apiOk === false && error && (
        <p className="admin-error admin-card">{error}</p>
      )}

      <section className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="admin-section-title">Community totals</h2>
        <p className="admin-field-hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Approved members, brand partners, experts, and ambassadors (plus foundations).
        </p>
        <div className="admin-stats">
          {ROLE_STATS.map(({ label, key, href }) => (
            <Link key={key} href={href} className="admin-stat" style={{ textDecoration: "none" }}>
              <div className="admin-stat-value">
                {metrics ? metrics.counts[key] : "—"}
              </div>
              <div className="admin-stat-label">{label}</div>
            </Link>
          ))}
          <Link href="/admin/partners" className="admin-stat" style={{ textDecoration: "none" }}>
            <div className="admin-stat-value">
              {metrics ? metrics.counts.partners : "—"}
            </div>
            <div className="admin-stat-label">All partners</div>
          </Link>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="admin-section-title">Partner locations</h2>
        <p className="admin-field-hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          From approved partner applications (address and geographic scope). Member
          profiles do not store a home location yet.
        </p>

        {metrics ? (
          <>
            <div className="admin-stats" style={{ marginBottom: "1.25rem" }}>
              {scopeEntries.map(({ key, label, count }) => (
                <div key={key} className="admin-stat">
                  <div className="admin-stat-value">{count}</div>
                  <div className="admin-stat-label">{label} scope</div>
                </div>
              ))}
              <div className="admin-stat">
                <div className="admin-stat-value">{metrics.locations.withAddress}</div>
                <div className="admin-stat-label">With address</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-value">{metrics.locations.withoutAddress}</div>
                <div className="admin-stat-label">Missing address</div>
              </div>
            </div>

            {metrics.locations.byLocation.length > 0 ? (
              <div className="admin-table-wrap" style={{ marginBottom: "1.25rem" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Partners</th>
                      <th>By type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.locations.byLocation.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.count}</td>
                        <td>
                          {Object.entries(row.byType)
                            .map(
                              ([type, count]) =>
                                `${labelApplicationTypeShort(type as PartnerApplicationType)} (${count})`,
                            )
                            .join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty-hint">No approved partner locations yet.</p>
            )}

            {metrics.locations.partners.length > 0 && (
              <details className="admin-advanced">
                <summary>Full partner location list ({metrics.locations.partners.length})</summary>
                <div className="admin-table-wrap" style={{ marginTop: "0.75rem" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Scope</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.locations.partners.map((row) => (
                        <tr key={row.applicationId}>
                          <td>{row.name}</td>
                          <td>
                            {labelApplicationTypeShort(
                              row.applicationType as PartnerApplicationType,
                            )}
                          </td>
                          <td>
                            {row.address?.trim() || (
                              <span className="admin-link-muted">Not provided</span>
                            )}
                          </td>
                          <td>
                            {row.geographicScope
                              ? scopeLabel(row.geographicScope)
                              : "—"}
                          </td>
                          <td>
                            <Link
                              href={`/admin/brand-applications/${row.applicationId}`}
                              className="admin-link-muted"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        ) : (
          <p className="admin-empty-hint">Loading location metrics…</p>
        )}
      </section>

      <div className="admin-stats" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Discounts", key: "discounts", href: "/admin/discounts" },
          { label: "Resources", key: "resources", href: "/admin/resources" },
          { label: "Events", key: "events", href: "/admin/events" },
          { label: "Retreats", key: "retreats", href: "/admin/retreats" },
          { label: "Pending member applications", key: "pendingUsers", href: "/admin/users" },
          {
            label: "Pending partner applications",
            key: "pendingPartners",
            href: "/admin/brand-applications",
          },
          { label: "Pending suggestions", key: "pendingSuggestions", href: "/admin/suggestions" },
          { label: "Flagged content", key: "pendingReports", href: "/admin/reports" },
          { label: "Threads", key: "threads", href: "/admin/community" },
          { label: "Feed posts", key: "posts", href: "/admin/community" },
        ].map(({ label, key, href }) => (
          <Link key={key} href={href} className="admin-stat" style={{ textDecoration: "none" }}>
            <div className="admin-stat-value">
              {stats[key] === null ? "—" : stats[key]}
            </div>
            <div className="admin-stat-label">{label}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <ImageUploadGuideReference />
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--downriver)" }}>
          Quick links
        </h2>
        <ul style={{ lineHeight: 2, color: "var(--astral)" }}>
          <li>
            <Link href="/admin/users">Review pending member applications</Link>
          </li>
          <li>
            <Link href="/admin/brand-applications">Review partner applications by type</Link>
          </li>
          <li>
            <Link href="/admin/suggestions">Review user suggestions</Link>
          </li>
          <li>
            <Link href="/admin/members">Manage approved members</Link>
          </li>
          <li>
            <Link href="/admin/partners">Manage approved partners</Link>
          </li>
          <li>
            <Link href="/admin/discounts">Manage discounts</Link>
          </li>
          <li>
            <Link href="/admin/reports">Review flagged community content</Link>
          </li>
          <li>
            <Link href="/admin/affirmations">Edit wellness affirmations</Link>
          </li>
          <li>
            <Link href="/admin/community">Moderate threads and posts</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
