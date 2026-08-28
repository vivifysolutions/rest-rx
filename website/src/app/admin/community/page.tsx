"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import {
  deletePost,
  deleteThread,
  getForumPosts,
  getThreads,
  moderateThread,
} from "@/lib/api";
import { compareDateDesc, compareText, sortBy } from "@/lib/admin-sort";
import type { ForumPost, Thread } from "@/lib/types";

type CommunitySort = "title" | "topic" | "author" | "created";

const THREAD_SORT_OPTIONS: { value: CommunitySort; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "topic", label: "Topic" },
  { value: "author", label: "Author" },
  { value: "created", label: "Created (newest)" },
];

const POST_SORT_OPTIONS: { value: CommunitySort; label: string }[] = [
  { value: "title", label: "Preview" },
  { value: "topic", label: "Topic" },
  { value: "author", label: "Author" },
  { value: "created", label: "Created (newest)" },
];

function authorLabel(author: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  if (author.displayName) return author.displayName;
  const name = [author.firstName, author.lastName].filter(Boolean).join(" ");
  return name || "Unknown";
}

export default function AdminCommunityPage() {
  const { refreshToken } = usePortalAuth();
  const [tab, setTab] = useState<"threads" | "posts">("threads");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortByKey, setSortByKey] = useState<CommunitySort>("created");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [threadData, postData] = await Promise.all([
        getThreads(token, { limit: 50 }),
        getForumPosts(token, { limit: 50 }),
      ]);
      setThreads(threadData);
      setPosts(postData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load community data");
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleModerateThread(
    id: string,
    action: "pin" | "unpin" | "lock" | "unlock",
  ) {
    const token = await refreshToken();
    if (!token) return;
    const thread = threads.find((t) => t.id === id);
    if (!thread) return;
    const body =
      action === "pin"
        ? { isPinned: true }
        : action === "unpin"
          ? { isPinned: false }
          : action === "lock"
            ? { isLocked: true }
            : { isLocked: false };
    await moderateThread(token, id, body);
    await load();
  }

  async function handleDeleteThread(id: string) {
    if (!confirm("Delete this thread and all replies?")) return;
    const token = await refreshToken();
    if (!token) return;
    await deleteThread(token, id);
    await load();
  }

  const sortedThreads = useMemo(
    () =>
      sortBy(threads, (a, b) => {
        switch (sortByKey) {
          case "topic":
            return compareText(a.topic, b.topic) || compareText(a.title, b.title);
          case "author":
            return (
              compareText(authorLabel(a.author), authorLabel(b.author)) ||
              compareText(a.title, b.title)
            );
          case "created":
            return compareDateDesc(a.createdAt, b.createdAt) || compareText(a.title, b.title);
          case "title":
          default:
            return compareText(a.title, b.title);
        }
      }),
    [threads, sortByKey],
  );

  const sortedPosts = useMemo(
    () =>
      sortBy(posts, (a, b) => {
        const aTitle = a.title || a.content;
        const bTitle = b.title || b.content;
        switch (sortByKey) {
          case "topic":
            return compareText(a.topic, b.topic) || compareText(aTitle, bTitle);
          case "author":
            return (
              compareText(authorLabel(a.author), authorLabel(b.author)) ||
              compareText(aTitle, bTitle)
            );
          case "created":
            return compareDateDesc(a.createdAt, b.createdAt) || compareText(aTitle, bTitle);
          case "title":
          default:
            return compareText(aTitle, bTitle);
        }
      }),
    [posts, sortByKey],
  );

  async function handleDeletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const token = await refreshToken();
    if (!token) return;
    await deletePost(token, id);
    await load();
  }

  return (
    <>
      <ContentPageHeader
        title="Community"
        description="Moderate forum threads and feed posts. Click a title to review replies and comments."
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={`admin-btn ${tab === "threads" ? "admin-btn-primary" : ""}`}
          style={tab !== "threads" ? { background: "#e8eef3", color: "var(--downriver)" } : undefined}
          onClick={() => setTab("threads")}
        >
          Threads ({threads.length})
        </button>
        <button
          type="button"
          className={`admin-btn ${tab === "posts" ? "admin-btn-primary" : ""}`}
          style={tab !== "posts" ? { background: "#e8eef3", color: "var(--downriver)" } : undefined}
          onClick={() => setTab("posts")}
        >
          Feed posts ({posts.length})
        </button>
      </div>

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <AdminSortSelect
          value={sortByKey}
          onChange={setSortByKey}
          options={tab === "threads" ? THREAD_SORT_OPTIONS : POST_SORT_OPTIONS}
        />
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p>Loading…</p>
        ) : tab === "threads" ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Topic</th>
                <th>Author</th>
                <th>Posts</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedThreads.map((t) => (
                <tr key={t.id}>
                  <td>
                    <AdminTitleLink href={`/admin/community/${t.id}`}>
                      {t.title}
                    </AdminTitleLink>
                  </td>
                  <td>{t.topic ?? "—"}</td>
                  <td>{authorLabel(t.author)}</td>
                  <td>{t.postCount}</td>
                  <td>
                    {t.isLocked && <span className="admin-badge">Locked</span>}{" "}
                    {t.isPinned && <span className="admin-badge">Pinned</span>}
                    {!t.isLocked && !t.isPinned && "—"}
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() =>
                          handleModerateThread(t.id, t.isPinned ? "unpin" : "pin")
                        }
                      >
                        {t.isPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={() =>
                          handleModerateThread(t.id, t.isLocked ? "unlock" : "lock")
                        }
                      >
                        {t.isLocked ? "Unlock" : "Lock"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDeleteThread(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Topic</th>
                <th>Author</th>
                <th>Likes</th>
                <th>Replies</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((p) => {
                const preview = p.title || p.content.slice(0, 80);
                const full = p.title || p.content;
                return (
                  <tr key={p.id}>
                    <td>
                      <AdminTitleLink href={`/admin/community/posts/${p.id}`}>
                        {preview}
                        {full.length > 80 ? "…" : ""}
                      </AdminTitleLink>
                    </td>
                    <td>{p.topic ?? "—"}</td>
                    <td>{authorLabel(p.author)}</td>
                    <td>{p.likeCount}</td>
                    <td>{p.commentCount ?? p.replyCount ?? 0}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDeletePost(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
