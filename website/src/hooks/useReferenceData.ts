"use client";

import { useCallback, useEffect, useState } from "react";
import { getReferenceData } from "@/lib/api";
import type { ReferenceData } from "@/lib/types";

const EMPTY: ReferenceData = {
  discounts: [],
  events: [],
  retreats: [],
  resources: [],
};

/**
 * Loads `GET /categories` — the distinct category list per content type.
 * For other reference lookups (locations, tiers, types, formats, seasons,
 * topics, sub-topics) call the dedicated endpoints in `@/lib/api` directly
 * from the form that needs them.
 */
export function useReferenceData() {
  const [data, setData] = useState<ReferenceData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getReferenceData();
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reference data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
