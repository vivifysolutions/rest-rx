"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import { getCategories, type Category, type CategoryType } from "@/lib/api";

const CATEGORY_TYPES: CategoryType[] = ["EVENT", "DISCOUNT", "ONBOARDING", "AFFIRMATION"];

const TYPE_LABELS: Record<CategoryType, string> = {
  EVENT: "Event categories",
  DISCOUNT: "Discount categories",
  ONBOARDING: "Onboarding options",
  AFFIRMATION: "Affirmation preferences",
};

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
        description="Reference categories for events, discounts, onboarding, and affirmation preferences. Seeded via the API; used in mobile and portal forms."
      />

      {error && <p className="admin-error admin-card">{error}</p>}

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <label htmlFor="category-type-filter" style={{ marginRight: 12 }}>
          Filter by type
        </label>
        <select
          id="category-type-filter"
          className="admin-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CategoryType | "ALL")}
        >
          <option value="ALL">All types</option>
          {CATEGORY_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Sort order</th>
            </tr>
          </thead>
          <tbody>
            {filtered === null && !error && (
              <tr>
                <td colSpan={4}>Loading…</td>
              </tr>
            )}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={4}>No categories found.</td>
              </tr>
            )}
            {filtered?.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>
                  <code>{category.slug}</code>
                </td>
                <td>{category.type}</td>
                <td>{category.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
