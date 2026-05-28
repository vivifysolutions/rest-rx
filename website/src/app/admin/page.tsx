"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  getDiscounts,
  getEvents,
  getForumPosts,
  getResources,
  getRetreats,
  getThreads,
  healthCheck,
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
  });
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await healthCheck();
        if (!cancelled) setApiOk(true);

        const authToken = (await refreshToken()) ?? token;
        const [discounts, resources, events, retreats] = await Promise.all([
          getDiscounts(authToken ?? undefined),
          getResources(authToken ?? undefined),
          getEvents(authToken ?? undefined),
          getRetreats(authToken ?? undefined),
        ]);

        let threadCount = 0;
        let postCount = 0;
        if (authToken) {
          const [threads, posts] = await Promise.all([
            getThreads(authToken, { limit: 100 }),
            getForumPosts(authToken, { limit: 100 }),
          ]);
          threadCount = threads.length;
          postCount = posts.length;
        }

        if (!cancelled) {
          setStats({
            discounts: discounts.length,
            resources: resources.length,
            events: events.length,
            retreats: retreats.length,
            threads: threadCount,
            posts: postCount,
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
          Welcome{profile?.firstName ? `, ${profile.firstName}` : ""}. Manage app content and
          review community activity.
        </p>
      </header>

      {apiOk === false && (
        <p className="admin-error admin-card">
          API unreachable. Set <code>NEXT_PUBLIC_API_URL</code> and ensure the rest-and-rx API is
          running. {error}
        </p>
      )}

      <div className="admin-stats" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Discounts", key: "discounts", href: "/admin/discounts" },
          { label: "Resources", key: "resources", href: "/admin/resources" },
          { label: "Events", key: "events", href: "/admin/events" },
          { label: "Retreats", key: "retreats", href: "/admin/retreats" },
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
            <Link href="/admin/discounts">Add or remove partner discounts</Link>
          </li>
          <li>
            <Link href="/admin/resources">Publish wellness resources</Link>
          </li>
          <li>
            <Link href="/admin/community">Review forum threads and posts</Link>
          </li>
          <li>
            <Link href="/admin/users">User applications (coming soon)</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
