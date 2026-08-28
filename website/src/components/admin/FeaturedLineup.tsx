"use client";

import Image from "next/image";
import Link from "next/link";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { PublishedBadge } from "@/components/admin/ContentRowActions";
import { compareNullableNumberAsc, compareText } from "@/lib/admin-sort";

export type FeaturedSurface = "home" | "discover";

export type FeaturedLineupItem = {
  id: string;
  title: string;
  image?: string | null;
  isFeatured: boolean;
  isFeaturedOnHome?: boolean;
  featuredOrder?: number | null;
  featuredOnHomeOrder?: number | null;
  isPublished?: boolean;
};

export function featuredPlacementLabel(item: {
  isFeatured?: boolean;
  isFeaturedOnHome?: boolean;
}) {
  const parts = [
    item.isFeaturedOnHome ? "Home" : null,
    item.isFeatured ? "Discover" : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function isLive(item: FeaturedLineupItem) {
  return item.isPublished !== false;
}

function sortByFeaturedOrder<T extends FeaturedLineupItem>(
  items: T[],
  getOrder: (item: T) => number | null | undefined,
) {
  return [...items].sort(
    (a, b) =>
      compareNullableNumberAsc(getOrder(a), getOrder(b)) || compareText(a.title, b.title),
  );
}

type LineupColumn<T extends FeaturedLineupItem> = {
  surface: FeaturedSurface;
  title: string;
  hint: string;
  empty: string;
  isFeatured: (item: T) => boolean;
  getOrder: (item: T) => number | null | undefined;
};

function columnsFor<T extends FeaturedLineupItem>(sectionLabel: string): LineupColumn<T>[] {
  return [
    {
      surface: "home",
      title: "Home tab",
      hint: `Order members see in the Home ${sectionLabel.toLowerCase()} strip. Lowest number is first.`,
      empty: `Nothing featured on Home yet. Turn on “Feature on Home” when creating or editing.`,
      isFeatured: (item) => Boolean(item.isFeaturedOnHome),
      getOrder: (item) => item.featuredOnHomeOrder,
    },
    {
      surface: "discover",
      title: `Discover → ${sectionLabel}`,
      hint: `Order members see in the Featured ${sectionLabel} carousel.`,
      empty: `Nothing featured on Discover yet. Turn on “Feature on Discover → ${sectionLabel}” when creating or editing.`,
      isFeatured: (item) => item.isFeatured,
      getOrder: (item) => item.featuredOrder,
    },
  ];
}

type Props<T extends FeaturedLineupItem> = {
  items: T[];
  loading: boolean;
  moving: { surface: FeaturedSurface; id: string } | null;
  onMove: (
    surface: FeaturedSurface,
    orderedLiveIds: string[],
    fromIndex: number,
    direction: -1 | 1,
  ) => void;
  /** e.g. "Discounts", "Events", "Resources", "Retreats" */
  sectionLabel: string;
  detailHref: (item: T) => string;
  editHref: (item: T) => string;
  getMeta?: (item: T) => string | null;
};

export function FeaturedLineup<T extends FeaturedLineupItem>({
  items,
  loading,
  moving,
  onMove,
  sectionLabel,
  detailHref,
  editHref,
  getMeta,
}: Props<T>) {
  const columns = columnsFor<T>(sectionLabel);
  const liveCounts = columns.map((column) => ({
    surface: column.surface,
    title: column.surface === "home" ? "Home" : "Discover",
    count: loading
      ? null
      : sortByFeaturedOrder(items.filter(column.isFeatured).filter(isLive), column.getOrder)
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
        {columns.map((column) => {
          const featured = items.filter(column.isFeatured);
          const live = sortByFeaturedOrder(featured.filter(isLive), column.getOrder);
          const unpublished = sortByFeaturedOrder(
            featured.filter((item) => !isLive(item)),
            column.getOrder,
          );
          const liveIds = live.map((item) => item.id);

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
                  {live.map((item, index) => (
                    <LineupRow
                      key={item.id}
                      item={item}
                      rank={index + 1}
                      storedOrder={column.getOrder(item)}
                      canMoveUp={index > 0}
                      canMoveDown={index < live.length - 1}
                      busy={moving?.surface === column.surface}
                      movingThis={moving?.surface === column.surface && moving.id === item.id}
                      detailHref={detailHref(item)}
                      editHref={editHref(item)}
                      meta={getMeta?.(item) ?? null}
                      onMoveUp={() => onMove(column.surface, liveIds, index, -1)}
                      onMoveDown={() => onMove(column.surface, liveIds, index, 1)}
                    />
                  ))}
                  {unpublished.map((item) => (
                    <LineupRow
                      key={item.id}
                      item={item}
                      rank={null}
                      storedOrder={column.getOrder(item)}
                      unpublished
                      canMoveUp={false}
                      canMoveDown={false}
                      busy={false}
                      movingThis={false}
                      detailHref={detailHref(item)}
                      editHref={editHref(item)}
                      meta={getMeta?.(item) ?? null}
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
  item,
  rank,
  storedOrder,
  unpublished = false,
  canMoveUp,
  canMoveDown,
  busy,
  movingThis,
  detailHref,
  editHref,
  meta,
  onMoveUp,
  onMoveDown,
}: {
  item: FeaturedLineupItem;
  rank: number | null;
  storedOrder: number | null | undefined;
  unpublished?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  movingThis: boolean;
  detailHref: string;
  editHref: string;
  meta: string | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <li className={`admin-lineup-item${unpublished ? " is-unpublished" : ""}`}>
      <span className="admin-lineup-rank" title={storedOrder == null ? "Unranked" : `Stored order ${storedOrder}`}>
        {rank ?? "—"}
      </span>
      {item.image ? (
        <span className="admin-lineup-thumb">
          <Image src={item.image} alt="" fill sizes="44px" unoptimized style={{ objectFit: "cover" }} />
        </span>
      ) : (
        <span className="admin-lineup-thumb admin-lineup-thumb-empty" aria-hidden />
      )}
      <div className="admin-lineup-copy">
        <AdminTitleLink href={detailHref}>{item.title}</AdminTitleLink>
        {meta ? <span className="admin-lineup-meta">{meta}</span> : null}
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
              aria-label={`Move ${item.title} up`}
              disabled={!canMoveUp || busy}
              onClick={onMoveUp}
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              aria-label={`Move ${item.title} down`}
              disabled={!canMoveDown || busy}
              onClick={onMoveDown}
            >
              ↓
            </button>
          </>
        ) : null}
        <Link href={editHref} className="admin-btn admin-btn-sm">
          {movingThis ? "Saving…" : "Edit"}
        </Link>
      </div>
    </li>
  );
}
