"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import {
  EMPTY_RESOURCE_FORM,
  ResourceForm,
  type ResourceFormValues,
} from "@/components/admin/ResourceForm";
import { isQuickRxType } from "@/components/admin/resourceTypes";
import {
  getResourceById,
  getResourceSubTopics,
  getResourceTopics,
  getResourceTypes,
  updateResource,
} from "@/lib/api";
import type { Resource } from "@/lib/types";

function resourceToForm(item: Resource): ResourceFormValues {
  const images =
    item.images?.length ? item.images : isQuickRxType(item.type) && item.image ? [item.image] : [];
  return {
    title: item.title,
    description: item.description ?? "",
    citations: item.citations ?? "",
    type: item.type,
    duration: item.duration ?? "",
    topic: item.topic ?? "",
    subTopic: item.subTopic ?? "",
    image: item.image ?? "",
    images,
    mediaUrl: item.mediaUrl ?? "",
    isFeatured: item.isFeatured,
  };
}

export default function AdminResourceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<ResourceFormValues>(EMPTY_RESOURCE_FORM);
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const update = <K extends keyof ResourceFormValues>(k: K, v: ResourceFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await refreshToken();
      const [item, topicsList, typesList] = await Promise.all([
        getResourceById(id, token ?? undefined),
        getResourceTopics(),
        getResourceTypes(),
      ]);
      setForm(resourceToForm(item));
      setTopics(topicsList.map((t) => t.name));
      setTypes(typesList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resource");
    } finally {
      setLoading(false);
    }
  }, [id, refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const topic = form.topic.trim();
    if (!topic) {
      setSubTopics([]);
      return;
    }
    getResourceSubTopics(topic)
      .then((s) => {
        if (!cancelled) setSubTopics(s);
      })
      .catch(() => {
        if (!cancelled) setSubTopics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.topic]);

  async function handleSubmit(body: Parameters<typeof updateResource>[1]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await updateResource(id, body, token ?? undefined);
      setSuccess("Resource updated.");
      router.push(`/admin/resources/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update resource");
      throw e;
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <>
      <AdminDetailLayout
        backHref={`/admin/resources/${id}`}
        backLabel="Resource details"
        title="Edit resource"
        actions={
          <Link href={`/admin/resources/${id}`} className="admin-btn">
            Cancel
          </Link>
        }
      >
        <ResourceForm
          form={form}
          onChange={update}
          topics={topics}
          subTopics={subTopics}
          types={types}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
        {success && <p className="admin-success">{success}</p>}
        {error && <p className="admin-error">{error}</p>}
      </AdminDetailLayout>
    </>
  );
}
