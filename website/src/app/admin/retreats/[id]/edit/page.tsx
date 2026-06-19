"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import { RetreatForm, type RetreatFormValues } from "@/components/admin/RetreatForm";
import { getRetreatById, getRetreatSeasons, getTopics, updateRetreat } from "@/lib/api";
import { EMPTY_LOCATION, locationFromListing } from "@/lib/address";
import type { CreateRetreatInput, Retreat } from "@/lib/types";

function retreatToForm(item: Retreat): RetreatFormValues {
  return {
    title: item.title,
    description: item.description ?? "",
    category: item.category ?? "",
    season: item.season ?? "",
    location: locationFromListing(item),
    rating: item.rating != null ? String(item.rating) : "",
    image: item.image ?? "",
    startDate: item.startDate ? item.startDate.slice(0, 10) : "",
    endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    isFeatured: item.isFeatured,
  };
}

export default function AdminRetreatEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<RetreatFormValues>({
    title: "",
    description: "",
    category: "",
    season: "",
    location: EMPTY_LOCATION,
    rating: "",
    image: "",
    startDate: "",
    endDate: "",
    isFeatured: false,
  });
  const [topics, setTopics] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof RetreatFormValues>(k: K, v: RetreatFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await refreshToken();
        const [item, topicsList, sns] = await Promise.all([
          getRetreatById(id, token ?? undefined),
          getTopics(),
          getRetreatSeasons(),
        ]);
        if (cancelled) return;
        setForm(retreatToForm(item));
        setTopics(topicsList.map((t) => t.name));
        setSeasons(sns);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load retreat");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, refreshToken]);

  async function handleSubmit(body: CreateRetreatInput) {
    setError(null);
    const token = await refreshToken();
    await updateRetreat(id, body, token ?? undefined);
    router.push(`/admin/retreats/${id}`);
  }

  if (loading) return <p>Loading…</p>;

  return (
    <AdminDetailLayout
      backHref={`/admin/retreats/${id}`}
      backLabel="Retreat details"
      title="Edit retreat"
      actions={
        <Link href={`/admin/retreats/${id}`} className="admin-btn">
          Cancel
        </Link>
      }
    >
      <RetreatForm
        form={form}
        onChange={update}
        topics={topics}
        seasons={seasons}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
  );
}
