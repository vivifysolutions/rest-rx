"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { getMemberLocationMetrics, type MemberLocationMetrics } from "@/lib/api";

type Level = "city" | "state" | "country";

const LEVELS: Array<{ key: Level; label: string }> = [
  { key: "city", label: "Per city" },
  { key: "state", label: "Per state" },
  { key: "country", label: "Per country" },
];

type Row = { key: string; location: string; count: number };

function rowsFor(metrics: MemberLocationMetrics, level: Level): Row[] {
  switch (level) {
    case "city":
      return metrics.byCity.map((r) => ({
        key: `${r.country}|${r.state ?? ""}|${r.city}`,
        location: [r.city, r.state, r.country].filter(Boolean).join(", "),
        count: r.count,
      }));
    case "state":
      return metrics.byState.map((r) => ({
        key: `${r.country}|${r.state}`,
        location: `${r.state}, ${r.country}`,
        count: r.count,
      }));
    case "country":
      return metrics.byCountry.map((r) => ({ key: r.country, location: r.country, count: r.count }));
  }
}

/**
 * Approved members (members + ambassadors) per city, state and country, from the location they
 * entered in the app, so the team can answer brand partners' audience questions.
 */
export function MemberLocationCounts() {
  const { refreshToken } = usePortalAuth();
  const [metrics, setMetrics] = useState<MemberLocationMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("city");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await refreshToken();
      if (!token) throw new Error("Not authenticated");
      setMetrics(await getMemberLocationMetrics(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members by location");
    }
  }, [refreshToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    if (!metrics) return [];
    const term = query.trim().toLowerCase();
    const all = rowsFor(metrics, level);
    return term ? all.filter((row) => row.location.toLowerCase().includes(term)) : all;
  }, [metrics, level, query]);

  const matchedTotal = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="admin-card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Members by location</h2>
      <p className="admin-empty-hint" style={{ marginTop: 0 }}>
        Approved members and ambassadors, by the city they entered in the app. Only admins see
        member locations.
      </p>

      {error && <p className="admin-error">{error}</p>}

      {!metrics && !error ? (
        <p>Loading…</p>
      ) : metrics ? (
        <>
          <div className="admin-stats" style={{ marginBottom: "1rem" }}>
            <div className="admin-stat">
              <div className="admin-stat-value">{metrics.totalMembers}</div>
              <div className="admin-stat-label">Members</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{metrics.withLocation}</div>
              <div className="admin-stat-label">With location</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{metrics.withoutLocation}</div>
              <div className="admin-stat-label">No location yet</div>
            </div>
          </div>

          <div className="admin-filter-bar" style={{ marginBottom: "1rem" }}>
            {LEVELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`admin-btn ${level === key ? "admin-btn-primary" : ""}`}
                onClick={() => setLevel(key)}
                aria-pressed={level === key}
              >
                {label}
              </button>
            ))}
            <label>
              Search
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Atlanta"
              />
            </label>
            {query.trim() ? (
              <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Matching total: <strong>{matchedTotal}</strong>
              </span>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <p className="admin-empty-hint">
              {query.trim() ? `No members in "${query.trim()}".` : "No member locations yet."}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Members</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.location}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
