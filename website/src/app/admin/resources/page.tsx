"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { AdminTitleLink } from "@/components/admin/AdminDetailView";
import { AdminSortSelect } from "@/components/admin/AdminSortSelect";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  EMPTY_RESOURCE_FORM,
  ResourceForm,
  type ResourceFormValues,
} from "@/components/admin/ResourceForm";
import { MicroRxPanel, MICRO_RX_TYPE } from "@/components/admin/MicroRxPanel";
import { isMicroRxType } from "@/components/admin/resourceTypes";
import {
  createResource,
  deleteResource,
  getResources,
  getResourceSubTopics,
  getResourceTopics,
  getResourceTypes,
  listUsers,
  updateResource,
} from "@/lib/api";
import { compareText, sortBy } from "@/lib/admin-sort";
import { ContentRowActions, PublishedBadge } from "@/components/admin/ContentRowActions";
import type { ExpertOwnerOption } from "@/components/admin/ExpertUserPicker";
import type { Resource } from "@/lib/types";

type ResourceSort = "title" | "type" | "topic" | "subcategory" | "duration";

const SORT_OPTIONS: { value: ResourceSort; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "type", label: "Type" },
  { value: "topic", label: "Topic" },
  { value: "subcategory", label: "Subcategory" },
  { value: "duration", label: "Duration" },
];

const ALL_TAB = "all";

function AdminResourcesContent() {
  const { refreshToken } = usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [items, setItems] = useState<Resource[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [experts, setExperts] = useState<ExpertOwnerOption[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceFormValues>(EMPTY_RESOURCE_FORM);
  const [sortByKey, setSortByKey] = useState<ResourceSort>("title");

  const activeTab = typeParam?.trim() || ALL_TAB;
  const isMicroTab = isMicroRxType(activeTab);

  const update = <K extends keyof ResourceFormValues>(k: K, v: ResourceFormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === ALL_TAB) params.delete("type");
      else params.set("type", tab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setExpertsLoading(true);
    setError(null);
    const token = await refreshToken();
    const [data, topicsList, typesList, expertsList] = await Promise.allSettled([
      getResources(token ?? undefined),
      getResourceTopics(),
      getResourceTypes(),
      token
        ? listUsers(token, {
            userTypes: ["expert"],
            applicationStatus: "approved",
          })
        : Promise.resolve([]),
    ]);
    if (data.status === "fulfilled") setItems(data.value);
    else {
      setError(
        data.reason instanceof Error ? data.reason.message : "Failed to load resources",
      );
    }
    if (topicsList.status === "fulfilled") {
      setTopics(topicsList.value.map((topic) => topic.name));
    }
    if (typesList.status === "fulfilled") {
      const list = [...typesList.value];
      if (!list.some((t) => isMicroRxType(t))) list.push(MICRO_RX_TYPE);
      setTypes(list);
    }
    if (expertsList.status === "fulfilled") {
      setExperts(expertsList.value);
    }
    setExpertsLoading(false);
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isMicroTab) return;
    if (activeTab !== ALL_TAB && form.type !== activeTab) {
      setForm((prev) => ({ ...prev, type: activeTab }));
    }
  }, [activeTab, form.type, isMicroTab]);

  useEffect(() => {
    let cancelled = false;
    const topic = form.topic.trim();
    if (!topic) {
      setSubTopics([]);
      return;
    }
    getResourceSubTopics(topic)
      .then((s) => {
        if (!cancelled) setSubTopics(s);
      })
      .catch(() => {
        if (!cancelled) setSubTopics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.topic]);

  const tabTypes = useMemo(() => {
    const fromItems = items.map((r) => r.type).filter(Boolean);
    const merged = new Set([...types, ...fromItems]);
    if (![...merged].some((t) => isMicroRxType(t))) merged.add(MICRO_RX_TYPE);
    return [...merged].sort((a, b) => {
      if (isMicroRxType(a)) return 1;
      if (isMicroRxType(b)) return -1;
      return a.localeCompare(b);
    });
  }, [items, types]);

  const filteredSorted = useMemo(() => {
    const filtered =
      activeTab === ALL_TAB
        ? items
        : items.filter((r) => r.type.toLowerCase() === activeTab.toLowerCase());
    return sortBy(filtered, (a, b) => {
      switch (sortByKey) {
        case "type":
          return compareText(a.type, b.type) || compareText(a.title, b.title);
        case "topic":
          return compareText(a.topic, b.topic) || compareText(a.title, b.title);
        case "subcategory":
          return compareText(a.subTopic, b.subTopic) || compareText(a.title, b.title);
        case "duration":
          return compareText(a.duration, b.duration) || compareText(a.title, b.title);
        case "title":
        default:
          return compareText(a.title, b.title);
      }
    });
  }, [items, activeTab, sortByKey]);

  async function handleCreate(body: Parameters<typeof createResource>[0]) {
    setError(null);
    setSuccess(null);
    try {
      const token = await refreshToken();
      await createResource(body, token ?? undefined);
      setSuccess("Resource created.");
      setForm({
        ...EMPTY_RESOURCE_FORM,
        type: activeTab !== ALL_TAB && !isMicroTab ? activeTab : "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
      throw err;
    }
  }

  async function handleTogglePublish(item: Resource) {
    const token = await refreshToken();
    await updateResource(item.id, { isPublished: !item.isPublished }, token ?? undefined);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resource?")) return;
    const token = await refreshToken();
    await deleteResource(id, token ?? undefined);
    await load();
  }

  const formTypes =
    activeTab !== ALL_TAB && !isMicroTab
      ? [activeTab]
      : types.filter((t) => !isMicroRxType(t));

  return (
    <>
      <ContentPageHeader
        title="Resources"
        description="Wellness content for the app — audio, video, articles, Quick Rx, and Micro RX."
      />

      <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <span className="admin-filter-label">Type</span>
        <button
          type="button"
          className={`admin-btn ${activeTab === ALL_TAB ? "admin-btn-primary" : ""}`}
          onClick={() => setTab(ALL_TAB)}
        >
          All
        </button>
        {tabTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`admin-btn ${
              activeTab.toLowerCase() === type.toLowerCase() ? "admin-btn-primary" : ""
            }`}
            onClick={() => setTab(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {isMicroTab ? (
        <MicroRxPanel />
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Add resource</h2>
            <ResourceForm
              form={form}
              onChange={update}
              topics={topics}
              subTopics={subTopics}
              types={formTypes.length ? formTypes : types}
              experts={experts}
              expertsLoading={expertsLoading}
              showExpertPicker
              submitLabel="Create resource"
              onSubmit={handleCreate}
            />
            {success && <p className="admin-success">{success}</p>}
            {error && <p className="admin-error">{error}</p>}
          </div>

          <div className="admin-card admin-filter-bar" style={{ marginBottom: "1rem" }}>
            <AdminSortSelect
              value={sortByKey}
              onChange={setSortByKey}
              options={SORT_OPTIONS}
            />
          </div>

          <div className="admin-card admin-table-wrap">
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
              {activeTab === ALL_TAB ? "All resources" : `${activeTab} resources`}
            </h2>
            {loading ? (
              <p>Loading…</p>
            ) : filteredSorted.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No resources in this category.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Topic</th>
                    <th>Subcategory</th>
                    <th>Duration</th>
                    <th>Media</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <AdminTitleLink href={`/admin/resources/${r.id}`}>{r.title}</AdminTitleLink>
                      </td>
                      <td>{r.type}</td>
                      <td>{r.topic ?? "—"}</td>
                      <td>{r.subTopic ?? "—"}</td>
                      <td>{r.duration ?? "—"}</td>
                      <td>{r.mediaUrl ? "Yes" : "—"}</td>
                      <td>
                        <PublishedBadge isPublished={r.isPublished ?? true} />
                      </td>
                      <td>{r.isFeatured ? "Yes" : "—"}</td>
                      <td>
                        <ContentRowActions
                          isPublished={r.isPublished ?? true}
                          onTogglePublish={() => handleTogglePublish(r)}
                          editHref={`/admin/resources/${r.id}/edit`}
                          onDelete={() => handleDelete(r.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function AdminResourcesPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AdminResourcesContent />
    </Suspense>
  );
}
