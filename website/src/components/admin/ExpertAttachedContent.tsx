"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { getResources, getThreads } from "@/lib/api";
import type { Resource, Thread } from "@/lib/types";

export function ExpertAttachedContent({ userId }: { userId: string }) {
  const { refreshToken } = usePortalAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [resourceData, threadData] = await Promise.all([
        getResources(token, { updatedById: userId }),
        getThreads(token, { authorId: userId, limit: 100 }).catch(() =>
          getThreads(token, { limit: 100 }),
        ),
      ]);
      setResources(
        (Array.isArray(resourceData) ? resourceData : []).filter(
          (item) => item.sharedBy?.id === userId,
        ),
      );
      setThreads(
        (Array.isArray(threadData) ? threadData : []).filter(
          (thread) => thread.author?.id === userId,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expert content");
    } finally {
      setLoading(false);
    }
  }, [refreshToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      {error && (
        <p className="admin-error admin-card" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      <section className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 className="admin-detail-section-title">
          Resources {loading ? "" : `(${resources.length})`}
        </h2>
        {loading ? (
          <p>Loading…</p>
        ) : resources.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            No resources are attributed to this expert yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Topic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <AdminTitleLink href={`/admin/resources/${item.id}`}>
                        {item.title}
                      </AdminTitleLink>
                    </td>
                    <td>{item.type || "—"}</td>
                    <td>{item.topic || "—"}</td>
                    <td>
                      <PublishedBadge isPublished={item.isPublished} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 className="admin-detail-section-title">
          Forum threads {loading ? "" : `(${threads.length})`}
        </h2>
        {loading ? (
          <p>Loading…</p>
        ) : threads.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            This expert has not started any forum threads yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Posts</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id}>
                    <td>
                      <AdminTitleLink href={`/admin/community/${thread.id}`}>
                        {thread.title}
                      </AdminTitleLink>
                    </td>
                    <td>
                      {[thread.topic, thread.subTopic].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>{thread.postCount}</td>
                    <td>
                      {thread.isLocked && <span className="admin-badge">Locked</span>}{" "}
                      {thread.isPinned && <span className="admin-badge">Pinned</span>}
                      {!thread.isLocked && !thread.isPinned && "—"}
                    </td>
                    <td>{new Date(thread.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
