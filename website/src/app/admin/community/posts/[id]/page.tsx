"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { deleteComment, deletePost, getForumPostById } from "@/lib/api";
import type { ForumAuthor, ForumPostDetail } from "@/lib/types";

function authorLabel(author: ForumAuthor) {
  if (author.displayName) return author.displayName;
  const name = [author.firstName, author.lastName].filter(Boolean).join(" ");
  return name || "Unknown";
}

export default function AdminFeedPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getForumPostById(token, id);
      setPost(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeletePost() {
    if (!post || !confirm("Delete this post and all comments?")) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await deletePost(token, post.id);
      router.push("/admin/community");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await deleteComment(token, commentId);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error || !post) {
    return <p className="admin-error">{error ?? "Post not found"}</p>;
  }

  const title = post.title?.trim() || post.content.slice(0, 80) || "Feed post";
  const commentCount = post.comments?.length ?? post.commentCount ?? post.replyCount ?? 0;

  return (
    <AdminDetailLayout
      backHref="/admin/community"
      backLabel="Community"
      title={title}
      actions={
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          disabled={busy}
          onClick={handleDeletePost}
        >
          Delete post
        </button>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Topic" value={post.topic ?? "—"} />
        <DetailRow label="Author" value={authorLabel(post.author)} />
        <DetailRow label="Likes" value={String(post.likeCount)} />
        <DetailRow label="Comments" value={String(commentCount)} />
        <DetailRow label="Created" value={new Date(post.createdAt).toLocaleString()} />
      </DetailSection>

      <DetailSection title="Post body">
        <DetailRow label="Content">
          <div className="admin-detail-markdown">{post.content}</div>
        </DetailRow>
      </DetailSection>

      <DetailSection title={`Comments (${post.comments?.length ?? 0})`}>
        {!post.comments?.length ? (
          <p className="admin-empty-hint">No comments yet.</p>
        ) : (
          <div className="admin-moderation-list">
            {post.comments.map((comment) => (
              <article key={comment.id} className="admin-moderation-item">
                <div className="admin-moderation-item-header">
                  <div>
                    <strong>{authorLabel(comment.author)}</strong>
                    <span className="admin-moderation-meta">
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.likeCount > 0 ? ` · ${comment.likeCount} likes` : ""}
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
              </article>
            ))}
          </div>
        )}
      </DetailSection>
    </AdminDetailLayout>
  );
}
