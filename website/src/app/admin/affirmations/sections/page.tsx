"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthProvider";
import { ContentPageHeader } from "@/components/admin/ContentPageHeader";
import {
  createAffirmationSection,
  deleteAffirmationSection,
  getAffirmationSections,
  updateAffirmationSection,
  updateAffirmationTopic,
} from "@/lib/api";
import type { AffirmationSection, AffirmationTopic } from "@/lib/types";

const ORDER_HINT =
  "Lowest number shows first. Leave blank to use the default order: after numbered items, A–Z by name.";

/** Blank = no order set (null). Returns undefined when the text isn't a whole number ≥ 0. */
function parseOrder(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

function orderText(value: number | null): string {
  return value == null ? "" : String(value);
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

type SectionDraft = { title: string; order: string };
type TopicDraft = { sectionId: string; order: string };

const NO_SECTION = "";

export default function AdminAffirmationSectionsPage() {
  const { refreshToken } = usePortalAuth();
  const [sections, setSections] = useState<AffirmationSection[]>([]);
  const [unsectioned, setUnsectioned] = useState<AffirmationTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, SectionDraft>>({});
  const [topicDrafts, setTopicDrafts] = useState<Record<string, TopicDraft>>({});
  const [newSection, setNewSection] = useState<SectionDraft>({ title: "", order: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAffirmationSections();
      // Drafts are kept on reload so saving one row doesn't discard unsaved edits on others;
      // `run` clears only the draft of the row it saved.
      setSections(data.sections);
      setUnsectioned(data.unsectionedTopics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Topics in the order members see them, each with the section heading it falls under. */
  const topicRows = useMemo(
    () => [
      ...sections.flatMap((section) =>
        section.topics.map((topic) => ({ topic, groupTitle: section.title })),
      ),
      ...unsectioned.map((topic) => ({ topic, groupTitle: "No section" })),
    ],
    [sections, unsectioned],
  );

  function sectionDraft(section: AffirmationSection): SectionDraft {
    return (
      sectionDrafts[section.id] ?? { title: section.title, order: orderText(section.sortOrder) }
    );
  }

  function topicDraft(topic: AffirmationTopic): TopicDraft {
    return (
      topicDrafts[topic.id] ?? {
        sectionId: topic.section?.id ?? NO_SECTION,
        order: orderText(topic.sortOrder),
      }
    );
  }

  /** Returns true when the action succeeded. `onSuccess` runs before the list reloads. */
  async function run(
    id: string,
    action: (token: string) => Promise<unknown>,
    done: string,
    onSuccess?: () => void,
  ): Promise<boolean> {
    setError(null);
    setSuccess(null);
    const token = await refreshToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return false;
    }
    setSavingId(id);
    try {
      await action(token);
      onSuccess?.();
      setSuccess(done);
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sortOrder = parseOrder(newSection.order);
    if (sortOrder === undefined) {
      setError("Order must be a whole number (0 or more), or blank.");
      return;
    }
    const created = await run(
      "new",
      (token) => createAffirmationSection(token, { title: newSection.title.trim(), sortOrder }),
      "Section added.",
    );
    if (created) setNewSection({ title: "", order: "" });
  }

  async function saveSection(section: AffirmationSection) {
    const draft = sectionDraft(section);
    const sortOrder = parseOrder(draft.order);
    if (sortOrder === undefined) {
      setError(`"${section.title}": order must be a whole number (0 or more), or blank.`);
      return;
    }
    if (!draft.title.trim()) {
      setError("Section name can't be empty.");
      return;
    }
    await run(
      section.id,
      (token) =>
        updateAffirmationSection(token, section.id, { title: draft.title.trim(), sortOrder }),
      "Section saved.",
      () => setSectionDrafts((p) => withoutKey(p, section.id)),
    );
  }

  async function removeSection(section: AffirmationSection) {
    const count = section.topics.length;
    const note =
      count > 0 ? ` Its ${count} topic${count === 1 ? "" : "s"} will move to "No section".` : "";
    if (!confirm(`Delete the "${section.title}" section?${note}`)) return;
    await run(
      section.id,
      (token) => deleteAffirmationSection(token, section.id),
      "Section deleted.",
      () => {
        setSectionDrafts((p) => withoutKey(p, section.id));
        // Unsaved topic edits pointing at the deleted section would show a missing option.
        setTopicDrafts((p) =>
          Object.fromEntries(Object.entries(p).filter(([, d]) => d.sectionId !== section.id)),
        );
      },
    );
  }

  async function saveTopic(topic: AffirmationTopic) {
    const draft = topicDraft(topic);
    const sortOrder = parseOrder(draft.order);
    if (sortOrder === undefined) {
      setError(`"${topic.title}": order must be a whole number (0 or more), or blank.`);
      return;
    }
    await run(
      topic.id,
      (token) =>
        updateAffirmationTopic(token, topic.id, {
          sectionId: draft.sectionId === NO_SECTION ? null : draft.sectionId,
          sortOrder,
        }),
      "Topic saved.",
      () => setTopicDrafts((p) => withoutKey(p, topic.id)),
    );
  }

  function sectionDirty(section: AffirmationSection): boolean {
    const draft = sectionDrafts[section.id];
    return (
      draft != null &&
      (draft.title.trim() !== section.title || draft.order.trim() !== orderText(section.sortOrder))
    );
  }

  function topicDirty(topic: AffirmationTopic): boolean {
    const draft = topicDrafts[topic.id];
    return (
      draft != null &&
      (draft.sectionId !== (topic.section?.id ?? NO_SECTION) ||
        draft.order.trim() !== orderText(topic.sortOrder))
    );
  }

  return (
    <>
      <ContentPageHeader
        title="Affirmation sections"
        description="Group affirmation topics into sections and set the order members see them in the app. Changes show in the app right away."
      />

      {success && <p className="admin-success">{success}</p>}
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Sections</h2>
        <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem", color: "var(--muted, #5c758a)" }}>
          {ORDER_HINT}
        </p>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "6rem" }}>Order</th>
                  <th>Section</th>
                  <th>Topics</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No sections yet. Add one below.</td>
                  </tr>
                ) : null}
                {sections.map((section) => {
                  const draft = sectionDraft(section);
                  const busy = savingId === section.id;
                  return (
                    <tr key={section.id}>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          aria-label={`Order for ${section.title}`}
                          value={draft.order}
                          placeholder="—"
                          style={{ width: "5rem" }}
                          onChange={(e) =>
                            setSectionDrafts((p) => ({
                              ...p,
                              [section.id]: { ...draft, order: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          aria-label="Section name"
                          value={draft.title}
                          maxLength={80}
                          onChange={(e) =>
                            setSectionDrafts((p) => ({
                              ...p,
                              [section.id]: { ...draft, title: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>{section.topics.length}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            disabled={!sectionDirty(section) || busy}
                            onClick={() => saveSection(section)}
                          >
                            {busy ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            disabled={busy}
                            onClick={() => removeSection(section)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form
          className="admin-form"
          onSubmit={handleCreate}
          style={{ marginTop: "1rem", flexDirection: "row", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}
        >
          <label style={{ flex: "1 1 14rem" }}>
            New section name *
            <input
              type="text"
              required
              maxLength={80}
              value={newSection.title}
              onChange={(e) => setNewSection((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Clinical Moments"
            />
          </label>
          <label style={{ flex: "0 0 7rem" }}>
            Order
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={newSection.order}
              placeholder="—"
              onChange={(e) => setNewSection((p) => ({ ...p, order: e.target.value }))}
            />
          </label>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={!newSection.title.trim() || savingId === "new"}
          >
            Add section
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Topics</h2>
        <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem", color: "var(--muted, #5c758a)" }}>
          Pick a section for each topic and its order within that section. {ORDER_HINT} Topics with
          no section show after all sections. This list is in the order members see.
        </p>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Showing under</th>
                  <th>Topic</th>
                  <th>Section</th>
                  <th style={{ width: "6rem" }}>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topicRows.map(({ topic, groupTitle }) => {
                  const draft = topicDraft(topic);
                  const busy = savingId === topic.id;
                  return (
                    <tr key={topic.id}>
                      <td>{groupTitle}</td>
                      <td>{topic.title}</td>
                      <td>
                        <select
                          aria-label={`Section for ${topic.title}`}
                          value={draft.sectionId}
                          onChange={(e) =>
                            setTopicDrafts((p) => ({
                              ...p,
                              [topic.id]: { ...draft, sectionId: e.target.value },
                            }))
                          }
                        >
                          <option value={NO_SECTION}>No section</option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          aria-label={`Order for ${topic.title}`}
                          value={draft.order}
                          placeholder="—"
                          style={{ width: "5rem" }}
                          onChange={(e) =>
                            setTopicDrafts((p) => ({
                              ...p,
                              [topic.id]: { ...draft, order: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          disabled={!topicDirty(topic) || busy}
                          onClick={() => saveTopic(topic)}
                        >
                          {busy ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
