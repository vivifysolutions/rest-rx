"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import {
  DiscountForm,
  EMPTY_DISCOUNT_FORM,
  discountToForm,
  type DiscountFormValues,
} from "@/components/discounts/DiscountForm";
import { getCategories, getDiscountById, updateDiscount } from "@/lib/api";
import type { CreateDiscountInput } from "@/lib/types";

export default function BrandDiscountEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<DiscountFormValues>(EMPTY_DISCOUNT_FORM);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof DiscountFormValues>(
    k: K,
    v: DiscountFormValues[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await refreshToken();
        const [item, cats] = await Promise.all([
          getDiscountById(id, token ?? undefined),
          getCategories("DISCOUNT"),
        ]);
        if (cancelled) return;
        setForm(discountToForm(item));
        setCategories(cats.map((c) => ({ value: c.name, label: c.name })));
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load discount");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, refreshToken]);

  async function handleSubmit(body: CreateDiscountInput) {
    setError(null);
    const token = await refreshToken();
    await updateDiscount(id, body, token ?? undefined);
    router.push("/brand/discounts");
  }

  if (loading) return <p>Loading…</p>;

  return (
    <AdminDetailLayout
      backHref="/brand/discounts"
      backLabel="Your discounts"
      title="Edit offer"
      actions={
        <Link href="/brand/discounts" className="admin-btn">
          Cancel
        </Link>
      }
    >
      <DiscountForm
        form={form}
        onChange={update}
        categoryOptions={categories}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
  );
}
