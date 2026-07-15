"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import {
  deleteComment,
  deletePost,
  deleteThread,
  getThreadById,
  moderateThread,
} from "@/lib/api";
import type { ForumAuthor, ThreadDetail } from "@/lib/types";

function authorLabel(author: ForumAuthor) {
  if (author.displayName) return author.displayName;
  const name = [author.firstName, author.lastName].filter(Boolean).join(" ");
  return name || "Unknown";
}

export default function AdminThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getThreadById(token, id);
      setThread(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load thread");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function withToken(action: (token: string) => Promise<void>) {
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await action(token);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleModerate(action: "pin" | "unpin" | "lock" | "unlock") {
    if (!thread) return;
    const body =
      action === "pin"
        ? { isPinned: true }
        : action === "unpin"
          ? { isPinned: false }
          : action === "lock"
            ? { isLocked: true }
            : { isLocked: false };
    await withToken((token) => moderateThread(token, thread.id, body).then(() => undefined));
  }

  async function handleDeleteThread() {
    if (!thread || !confirm("Delete this thread and all replies?")) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await deleteThread(token, thread.id);
      router.push("/admin/community");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this reply and its comments?")) return;
    await withToken((token) => deletePost(token, postId));
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    await withToken((token) => deleteComment(token, commentId));
  }

  if (loading) return <p>Loading…</p>;
  if (error || !thread) {
    return <p className="admin-error">{error ?? "Thread not found"}</p>;
  }

  return (
    <AdminDetailLayout
      backHref="/admin/community"
      backLabel="Community"
      title={thread.title}
      actions={
        <>
          <button
            type="button"
            className="admin-btn"
            disabled={busy}
            onClick={() => handleModerate(thread.isPinned ? "unpin" : "pin")}
          >
            {thread.isPinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            className="admin-btn"
            disabled={busy}
            onClick={() => handleModerate(thread.isLocked ? "unlock" : "lock")}
          >
            {thread.isLocked ? "Unlock" : "Lock"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            disabled={busy}
            onClick={handleDeleteThread}
          >
            Delete thread
          </button>
        </>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Topic" value={thread.topic ?? "—"} />
        <DetailRow label="Author" value={authorLabel(thread.author)} />
        <DetailRow label="Status">
          {thread.isLocked && <span className="admin-badge">Locked</span>}{" "}
          {thread.isPinned && <span className="admin-badge">Pinned</span>}
          {!thread.isLocked && !thread.isPinned && "—"}
        </DetailRow>
        <DetailRow label="Replies" value={String(thread.postCount)} />
        <DetailRow label="Created" value={new Date(thread.createdAt).toLocaleString()} />
      </DetailSection>

      <DetailSection title="Thread body">
        <DetailRow label="Content">
          <div className="admin-detail-markdown">{thread.content}</div>
        </DetailRow>
      </DetailSection>

      <DetailSection title={`Replies & comments (${thread.posts.length})`}>
        {thread.posts.length === 0 ? (
          <p className="admin-empty-hint">No replies yet.</p>
        ) : (
          <div className="admin-moderation-list">
            {thread.posts.map((post) => (
              <article key={post.id} className="admin-moderation-item">
                <div className="admin-moderation-item-header">
                  <div>
                    <strong>{authorLabel(post.author)}</strong>
                    <span className="admin-moderation-meta">
                      {new Date(post.createdAt).toLocaleString()}
                      {post.likeCount > 0 ? ` · ${post.likeCount} likes` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    disabled={busy}
                    onClick={() => handleDeletePost(post.id)}
                  >
                    Delete reply
                  </button>
                </div>
                {post.title && <p className="admin-moderation-title">{post.title}</p>}
                <div className="admin-moderation-body">{post.content}</div>

                {post.comments.length > 0 && (
                  <div className="admin-moderation-comments">
                    <h3 className="admin-moderation-comments-title">
                      Comments ({post.comments.length})
                    </h3>
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="admin-moderation-comment">
                        <div className="admin-moderation-item-header">
                          <div>
                            <strong>{authorLabel(comment.author)}</strong>
                            <span className="admin-moderation-meta">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            disabled={busy}
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="admin-moderation-body">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </DetailSection>
    </AdminDetailLayout>
  );
}
