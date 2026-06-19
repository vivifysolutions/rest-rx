"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  getDiscounts,
  getEvents,
  getForumPosts,
  getReports,
  getResources,
  getRetreats,
  getThreads,
  healthCheck,
  listUsers,
} from "@/lib/api";

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
    pendingReports: null,
  });
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
        let pendingReports = 0;

        if (authToken) {
          const [threadsRes, postsRes, usersRes, reportsRes] = await Promise.allSettled([
            getThreads(authToken, { limit: 100 }),
            getForumPosts(authToken, { limit: 100 }),
            listUsers(authToken, { applicationStatus: "pending" }),
            getReports(authToken, "pending"),
          ]);

          const threads = unwrap(threadsRes, "Threads");
          const posts = unwrap(postsRes, "Posts");
          const users = unwrap(usersRes, "Pending users");
          const reports = unwrap(reportsRes, "Reports");

          threadCount = threads?.length ?? 0;
          postCount = posts?.length ?? 0;
          pendingUsers = users?.length ?? 0;
          pendingReports = reports?.length ?? 0;
        }

        if (!cancelled) {
          if (failures.length > 0) {
            setApiOk(false);
            setError(failures.join(" · "));
          }
          setStats({
            discounts: discounts?.length ?? null,
            resources: resources?.length ?? null,
            events: events?.length ?? null,
            retreats: retreats?.length ?? null,
            threads: threadCount,
            posts: postCount,
            pendingUsers,
            pendingReports,
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

      <div className="admin-stats" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Partner discounts", key: "discounts", href: "/admin/discounts" },
          { label: "Resources", key: "resources", href: "/admin/resources" },
          { label: "Events", key: "events", href: "/admin/events" },
          { label: "Retreats", key: "retreats", href: "/admin/retreats" },
          { label: "Pending signups", key: "pendingUsers", href: "/admin/users" },
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

      <div className="admin-card">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--downriver)" }}>
          Quick links
        </h2>
        <ul style={{ lineHeight: 2, color: "var(--astral)" }}>
          <li>
            <Link href="/admin/users">Review and approve user signups</Link>
          </li>
          <li>
            <Link href="/admin/discounts">Manage brand partnerships and discounts</Link>
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
