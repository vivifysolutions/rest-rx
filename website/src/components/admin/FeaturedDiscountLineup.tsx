"use client";

import Image from "next/image";
import Link from "next/link";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { compareNullableNumberAsc, compareText } from "@/lib/admin-sort";
import { getDiscountBadgeLabel } from "@/lib/discountOffer";
import { labelApplicationTypeShort } from "@/lib/partner-application-options";
import type { Discount } from "@/lib/types";

export type FeaturedSurface = "home" | "discover";

type LineupColumn = {
  surface: FeaturedSurface;
  title: string;
  hint: string;
  empty: string;
  isFeatured: (d: Discount) => boolean;
  getOrder: (d: Discount) => number | null | undefined;
};

const COLUMNS: LineupColumn[] = [
  {
    surface: "home",
    title: "Home tab",
    hint: "Order members see in the Home offers strip. Lowest number is first.",
    empty: "Nothing featured on Home yet. Turn on “Feature on Home” when creating or editing a discount.",
    isFeatured: (d) => Boolean(d.isFeaturedOnHome),
    getOrder: (d) => d.featuredOnHomeOrder,
  },
  {
    surface: "discover",
    title: "Discover → Discounts",
    hint: "Order members see in the Featured Discounts carousel.",
    empty: "Nothing featured on Discover yet. Turn on “Feature on Discover → Discounts” when creating or editing a discount.",
    isFeatured: (d) => d.isFeatured,
    getOrder: (d) => d.featuredOrder,
  },
];

function isLive(d: Discount) {
  return d.isPublished !== false;
}

function sortByFeaturedOrder(
  items: Discount[],
  getOrder: (d: Discount) => number | null | undefined,
) {
  return [...items].sort(
    (a, b) =>
      compareNullableNumberAsc(getOrder(a), getOrder(b)) || compareText(a.title, b.title),
  );
}

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

type Props = {
  discounts: Discount[];
  loading: boolean;
  moving: { surface: FeaturedSurface; id: string } | null;
  onMove: (surface: FeaturedSurface, orderedLiveIds: string[], fromIndex: number, direction: -1 | 1) => void;
};

export function FeaturedDiscountLineup({ discounts, loading, moving, onMove }: Props) {
  const liveCounts = COLUMNS.map((column) => ({
    surface: column.surface,
    title: column.surface === "home" ? "Home" : "Discover",
    count: loading
      ? null
      : sortByFeaturedOrder(discounts.filter(column.isFeatured).filter(isLive), column.getOrder)
          .length,
  }));

  return (
    <details className="admin-card admin-lineup-wrap">
      <summary className="admin-lineup-summary">
        <span className="admin-lineup-summary-title">Featured order</span>
        <span className="admin-lineup-summary-counts">
          {liveCounts.map((item, index) => (
            <span key={item.surface}>
              {index > 0 ? " · " : null}
              {item.title} {item.count == null ? "…" : `${item.count} live`}
            </span>
          ))}
        </span>
      </summary>

      <div className="admin-lineup-grid">
        {COLUMNS.map((column) => {
          const featured = discounts.filter(column.isFeatured);
          const live = sortByFeaturedOrder(featured.filter(isLive), column.getOrder);
          const unpublished = sortByFeaturedOrder(
            featured.filter((d) => !isLive(d)),
            column.getOrder,
          );
          const liveIds = live.map((d) => d.id);

          return (
            <section key={column.surface} className="admin-lineup-card">
              <header className="admin-lineup-header">
                <div>
                  <h2>{column.title}</h2>
                  <p>{column.hint}</p>
                </div>
                <span className="admin-filter-count">{live.length} live</span>
              </header>

              {loading ? (
                <p>Loading…</p>
              ) : live.length === 0 && unpublished.length === 0 ? (
                <p className="admin-empty-hint">{column.empty}</p>
              ) : (
                <ol className="admin-lineup-list">
                  {live.map((d, index) => (
                    <LineupRow
                      key={d.id}
                      discount={d}
                      rank={index + 1}
                      storedOrder={column.getOrder(d)}
                      canMoveUp={index > 0}
                      canMoveDown={index < live.length - 1}
                      busy={moving?.surface === column.surface}
                      movingThis={moving?.surface === column.surface && moving.id === d.id}
                      onMoveUp={() => onMove(column.surface, liveIds, index, -1)}
                      onMoveDown={() => onMove(column.surface, liveIds, index, 1)}
                    />
                  ))}
                  {unpublished.map((d) => (
                    <LineupRow
                      key={d.id}
                      discount={d}
                      rank={null}
                      storedOrder={column.getOrder(d)}
                      unpublished
                      canMoveUp={false}
                      canMoveDown={false}
                      busy={false}
                      movingThis={false}
                      onMoveUp={() => undefined}
                      onMoveDown={() => undefined}
                    />
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </details>
  );
}

function LineupRow({
  discount,
  rank,
  storedOrder,
  unpublished = false,
  canMoveUp,
  canMoveDown,
  busy,
  movingThis,
  onMoveUp,
  onMoveDown,
}: {
  discount: Discount;
  rank: number | null;
  storedOrder: number | null | undefined;
  unpublished?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  movingThis: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const partner = partnerLabel(discount);
  const badge = getDiscountBadgeLabel(discount);

  return (
    <li className={`admin-lineup-item${unpublished ? " is-unpublished" : ""}`}>
      <span className="admin-lineup-rank" title={storedOrder == null ? "Unranked" : `Stored order ${storedOrder}`}>
        {rank ?? "—"}
      </span>
      {discount.image ? (
        <span className="admin-lineup-thumb">
          <Image src={discount.image} alt="" fill sizes="44px" unoptimized style={{ objectFit: "cover" }} />
        </span>
      ) : (
        <span className="admin-lineup-thumb admin-lineup-thumb-empty" aria-hidden />
      )}
      <div className="admin-lineup-copy">
        <AdminTitleLink href={`/admin/discounts/${discount.id}`}>{discount.title}</AdminTitleLink>
        <span className="admin-lineup-meta">
          {badge ?? discount.category}
          {partner ? ` · ${partner}` : ""}
        </span>
        {unpublished ? (
          <span className="admin-lineup-note">
            Unpublished — not shown in the app. <PublishedBadge isPublished={false} />
          </span>
        ) : null}
      </div>
      <div className="admin-lineup-actions">
        {!unpublished ? (
          <>
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              aria-label={`Move ${discount.title} up`}
              disabled={!canMoveUp || busy}
              onClick={onMoveUp}
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              aria-label={`Move ${discount.title} down`}
              disabled={!canMoveDown || busy}
              onClick={onMoveDown}
            >
              ↓
            </button>
          </>
        ) : null}
        <Link href={`/admin/discounts/${discount.id}/edit`} className="admin-btn admin-btn-sm">
          {movingThis ? "Saving…" : "Edit"}
        </Link>
      </div>
    </li>
  );
}
