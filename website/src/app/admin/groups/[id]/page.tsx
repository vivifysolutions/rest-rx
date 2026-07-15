"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import {
  AdminDetailLayout,
  AdminTitleLink,
  DetailRow,
  DetailSection,
} from "@/components/admin/AdminDetailView";
import { deletePost, getForumPosts, getGroupById, updateGroupStatus } from "@/lib/api";
import { formatGroupStatus } from "@/lib/admin-labels";
import type { ForumAuthor, ForumPost, Group } from "@/lib/types";

function authorLabel(author?: ForumAuthor | { displayName?: string | null } | null) {
  if (!author) return "Unknown";
  if ("displayName" in author && author.displayName) return author.displayName;
  if ("firstName" in author || "lastName" in author) {
    const name = [
      (author as ForumAuthor).firstName,
      (author as ForumAuthor).lastName,
    ]
      .filter(Boolean)
      .join(" ");
    if (name) return name;
  }
  return "Unknown";
}

export default function AdminGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshToken } = usePortalAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const [groupData, postData] = await Promise.all([
        getGroupById(id, token),
        getForumPosts(token, { groupId: id, limit: 50 }),
      ]);
      setGroup(groupData);
      setPosts(postData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(status: "active" | "inactive" | "archived") {
    if (!group) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await updateGroupStatus(token, group.id, status);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post and its comments?")) return;
    setBusy(true);
    try {
      const token = await refreshToken();
      if (!token) return;
      await deletePost(token, postId);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error || !group) {
    return <p className="admin-error">{error ?? "Group not found"}</p>;
  }

  const location =
    [group.city, group.state, group.country].filter(Boolean).join(", ") || "—";

  return (
    <AdminDetailLayout
      backHref="/admin/groups"
      backLabel="Groups"
      title={group.name}
      actions={
        <select
          value={group.status}
          disabled={busy}
          onChange={(e) =>
            handleStatusChange(
              e.target.value as "active" | "inactive" | "archived",
            )
          }
          style={{ fontSize: "0.9rem" }}
        >
          <option value="active">Active</option>
          <option value="inactive">Hidden from members</option>
          <option value="archived">Archived</option>
        </select>
      }
    >
      <DetailSection title="Overview">
        <DetailRow label="Topic" value={group.topic ?? "—"} />
        <DetailRow label="Location" value={location} />
        <DetailRow label="Creator" value={authorLabel(group.creator)} />
        <DetailRow label="Members" value={String(group.memberCount)} />
        <DetailRow label="Status">
          <span className="admin-badge">{formatGroupStatus(group.status)}</span>
        </DetailRow>
        <DetailRow label="Created" value={new Date(group.createdAt).toLocaleString()} />
      </DetailSection>

      {group.description && (
        <DetailSection title="Description">
          <DetailRow label="About">
            <div className="admin-detail-markdown">{group.description}</div>
          </DetailRow>
        </DetailSection>
      )}

      {group.members && group.members.length > 0 && (
        <DetailSection title={`Members (sample of ${group.members.length})`}>
          <DetailRow label="People">
            <ul className="admin-moderation-member-list">
              {group.members.map((m) => (
                <li key={m.id}>{authorLabel(m)}</li>
              ))}
            </ul>
          </DetailRow>
        </DetailSection>
      )}

      <DetailSection title={`Posts (${posts.length})`}>
        {posts.length === 0 ? (
          <p className="admin-empty-hint">No posts in this group yet.</p>
        ) : (
          <div className="admin-moderation-list">
            {posts.map((post) => {
              const preview = post.title || post.content.slice(0, 120);
              const full = post.title || post.content;
              return (
                <article key={post.id} className="admin-moderation-item">
                  <div className="admin-moderation-item-header">
                    <div>
                      <AdminTitleLink href={`/admin/community/posts/${post.id}`}>
                        {preview}
                        {full.length > 120 ? "…" : ""}
                      </AdminTitleLink>
                      <span className="admin-moderation-meta">
                        {authorLabel(post.author)} ·{" "}
                        {new Date(post.createdAt).toLocaleString()}
                        {` · ${post.commentCount ?? post.replyCount ?? 0} comments`}
                        {post.likeCount > 0 ? ` · ${post.likeCount} likes` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      disabled={busy}
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="admin-moderation-body">
                    {post.content.length > 280
                      ? `${post.content.slice(0, 280)}…`
                      : post.content}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DetailSection>
    </AdminDetailLayout>
  );
}
