"use client";

import { FeaturedLineup, type FeaturedSurface } from "@/components/admin/FeaturedLineup";
import { getDiscountBadgeLabel } from "@/lib/discountOffer";
import { labelApplicationTypeShort } from "@/lib/partner-application-options";
import type { Discount } from "@/lib/types";

export type { FeaturedSurface };

function partnerLabel(d: Discount) {
  const app = d.brandPartnerApplication;
  if (!app) return null;
  const name = app.companyName.trim() || app.fullName.trim() || app.email || null;
  if (!name) return null;
  const type = app.applicationType
    ? ` (${labelApplicationTypeShort(app.applicationType as "brand_partner" | "expert" | "foundation" | "ambassador")})`
    : "";
  return `${name}${type}`;
}

function discountMeta(d: Discount) {
  const badge = getDiscountBadgeLabel(d);
  const partner = partnerLabel(d);
  const parts = [badge ?? d.category, partner].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

type Props = {
  discounts: Discount[];
  loading: boolean;
  moving: { surface: FeaturedSurface; id: string } | null;
  onMove: (surface: FeaturedSurface, orderedLiveIds: string[], fromIndex: number, direction: -1 | 1) => void;
};

export function FeaturedDiscountLineup({ discounts, loading, moving, onMove }: Props) {
  return (
    <FeaturedLineup
      items={discounts}
      loading={loading}
      moving={moving}
      onMove={onMove}
      sectionLabel="Discounts"
      detailHref={(d) => `/admin/discounts/${d.id}`}
      editHref={(d) => `/admin/discounts/${d.id}/edit`}
      getMeta={discountMeta}
    />
  );
}
