"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getCategories, type Category, type CategoryType } from "@/lib/api";
import { CATEGORY_TYPE_LABELS } from "@/lib/admin-labels";

const CATEGORY_TYPES: CategoryType[] = ["EVENT", "DISCOUNT", "ONBOARDING", "AFFIRMATION"];

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "ALL">("ALL");

  useEffect(() => {
    getCategories()
      .then((data) => setItems(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories"));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (typeFilter === "ALL") return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

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
