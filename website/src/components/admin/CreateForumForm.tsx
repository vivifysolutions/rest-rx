"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MarkdownBodyField } from "@/components/admin/ArticleBodyField";
import { ReferenceSelect } from "@/components/admin/ReferenceSelect";
import { createThread, getResourceSubTopics, getTopics } from "@/lib/api";

type Props = {
  onCreated: () => void;
  onCancel: () => void;
};

export function CreateForumForm({ onCreated, onCancel }: Props) {
  const { refreshToken } = usePortalAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopics()
      .then((rows) => setTopics(rows.map((row) => row.name)))
      .catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    if (!topic) {
      setSubTopics([]);
      setSubTopic("");
      return;
    }
    let cancelled = false;
    getResourceSubTopics(topic)
      .then((rows) => {
        if (!cancelled) setSubTopics(rows);
      })
      .catch(() => {
        if (!cancelled) setSubTopics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      setError("Title must be between 3 and 200 characters.");
      return;
    }
    if (trimmedContent.length < 10) {
      setError("The forum post needs at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      const cover = imageUrl.trim();
      await createThread(token, {
        title: trimmedTitle,
        content: trimmedContent,
        topic: topic || undefined,
        subTopic: subTopic || undefined,
        imageUrl: cover || undefined,
        images: cover ? [cover] : undefined,
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create forum");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <h2 style={{ margin: 0, color: "var(--downriver)", fontSize: "1.15rem" }}>Create new forum</h2>
      <p className="admin-field-hint" style={{ marginTop: 0 }}>
        Experts and admins can start a forum. Members can read and reply.
      </p>
      <label>
        Title *
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
          placeholder="A question or insight worth discussing"
        />
      </label>
      <div className="admin-form-row">
        <label>
          Topic
          <ReferenceSelect
            name="topic"
            value={topic}
            onChange={(next) => {
              setTopic(next);
              setSubTopic("");
            }}
            options={topics.map((name) => ({ value: name, label: name }))}
            placeholder="No topic"
          />
        </label>
        <label>
          Subtopic
          <ReferenceSelect
            name="subTopic"
            value={subTopic}
            onChange={setSubTopic}
            options={subTopics.map((name) => ({ value: name, label: name }))}
            placeholder={topic ? "No subtopic" : "Select a topic first"}
            disabled={!topic || subTopics.length === 0}
          />
        </label>
      </div>
      <MarkdownBodyField
        label="Post"
        required
        value={content}
        onChange={setContent}
        rows={8}
        hint="Supports Markdown. This is the opening post members see in the forum."
        placeholder="Share your perspective, research, or lived experience..."
      />
      <ImageUpload
        folder="threads/admin"
        value={imageUrl}
        onChange={setImageUrl}
        label="Cover image"
        guide="forum-cover"
      />
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create new forum"}
        </button>
        <button type="button" className="admin-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
