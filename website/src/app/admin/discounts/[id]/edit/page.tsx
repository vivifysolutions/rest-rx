"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminDetailLayout } from "@/components/admin/AdminDetailView";
import {
  DiscountForm,
  EMPTY_DISCOUNT_FORM,
  type DiscountFormValues,
} from "@/components/discounts/DiscountForm";
import type { BrandPartnerOption } from "@/components/discounts/BrandPartnerPicker";
import {
  getBrandPartnerApplications,
  getCategories,
  getDiscountById,
  updateDiscount,
} from "@/lib/api";
import { locationFromListing } from "@/lib/address";
import { toPartnerOwnerOptions } from "@/lib/partner-owner";
import type { CreateDiscountInput, Discount } from "@/lib/types";

function discountToForm(d: Discount): DiscountFormValues {
  return {
    title: d.title,
    description: d.description ?? "",
    offerSummary: d.offerSummary ?? "",
    offerHighlight: d.offerHighlight ?? "",
    percentage: d.percentage != null ? String(d.percentage) : "",
    redemptionInstructions: d.redemptionInstructions ?? "",
    terms: d.terms ?? "",
    category: d.category,
    location: locationFromListing(d),
    tier: d.tier ?? "",
    claimLink: d.claimLink ?? "",
    website: d.website ?? "",
    instagram: d.instagram ?? "",
    phone: d.phone ?? "",
    images: d.images?.length ? d.images : d.image ? [d.image] : [],
    isFeatured: d.isFeatured,
    isFeaturedOnHome: d.isFeaturedOnHome ?? false,
    expiryDate: d.expiryDate ? d.expiryDate.slice(0, 10) : "",
    brandPartnerApplicationId: d.brandPartnerApplicationId ?? "",
  };
}

export default function AdminDiscountEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshToken } = usePortalAuth();
  const [form, setForm] = useState<DiscountFormValues>(EMPTY_DISCOUNT_FORM);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [partners, setPartners] = useState<BrandPartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof DiscountFormValues>(k: K, v: DiscountFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPartnersLoading(true);
      setError(null);
      try {
        const token = await refreshToken();
        const [item, cats, apps] = await Promise.all([
          getDiscountById(id, token ?? undefined),
          getCategories("DISCOUNT"),
          token
            ? getBrandPartnerApplications(token, { status: "approved" })
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setForm(discountToForm(item));
        setCategories(cats.map((c) => ({ value: c.name, label: c.name })));
        setPartners(toPartnerOwnerOptions(apps));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load discount");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPartnersLoading(false);
        }
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
    router.push(`/admin/discounts/${id}`);
  }

  if (loading) return <p>Loading…</p>;

  return (
    <AdminDetailLayout
      backHref={`/admin/discounts/${id}`}
      backLabel="Discount details"
      title="Edit discount"
      actions={
        <Link href={`/admin/discounts/${id}`} className="admin-btn">
          Cancel
        </Link>
      }
    >
      <DiscountForm
        form={form}
        onChange={update}
        categoryOptions={categories}
        showFeatured
        showPartnerPicker
        brandPartners={partners}
        brandPartnersLoading={partnersLoading}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
      {error && <p className="admin-error">{error}</p>}
    </AdminDetailLayout>
  );
}
