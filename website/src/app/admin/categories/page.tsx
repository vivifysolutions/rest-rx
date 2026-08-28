"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getCategories, type Category, type CategoryType } from "@/lib/api";
import { CATEGORY_TYPE_LABELS } from "@/lib/admin-labels";
import { compareText, sortBy } from "@/lib/admin-sort";

const CATEGORY_TYPES: CategoryType[] = ["EVENT", "DISCOUNT", "ONBOARDING", "AFFIRMATION"];

type CategorySort = "name" | "type";

const SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "type", label: "Used for" },
];

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "ALL">("ALL");
  const [sortByKey, setSortByKey] = useState<CategorySort>("name");

  useEffect(() => {
    getCategories()
      .then((data) => setItems(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories"));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const list = typeFilter === "ALL" ? items : items.filter((item) => item.type === typeFilter);
    return sortBy(list, (a, b) => {
      switch (sortByKey) {
        case "type":
          return (
            compareText(CATEGORY_TYPE_LABELS[a.type], CATEGORY_TYPE_LABELS[b.type]) ||
            compareText(a.name, b.name)
          );
        case "name":
        default:
          return compareText(a.name, b.name);
      }
    });
  }, [items, typeFilter, sortByKey]);

  return (
    <>
      <ContentPageHeader
        title="Categories"
        description="Reference labels used in the app for filtering events, partner offers, onboarding, and affirmations."
      />

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <label>
          Show
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CategoryType | "ALL")}
          >
            <option value="ALL">All categories</option>
            {CATEGORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CATEGORY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <AdminSortSelect value={sortByKey} onChange={setSortByKey} options={SORT_OPTIONS} />
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Used for</th>
            </tr>
          </thead>
          <tbody>
            {filtered === null && !error && (
              <tr>
                <td colSpan={2}>Loading…</td>
              </tr>
            )}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={2}>No categories found.</td>
              </tr>
            )}
            {filtered?.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{CATEGORY_TYPE_LABELS[category.type]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
