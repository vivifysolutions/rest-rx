import { buildQuery, ADMIN_QUERY } from "./buildQuery";
import type {
  ApiUser,
  Affirmation,
  AffirmationTopic,
  ContentReport,
  CreateDiscountInput,
  CreateEventInput,
  CreateResourceInput,
  CreateRetreatInput,
  Discount,
  Event,
  ForumPost,
  Group,
  Resource,
  Retreat,
  Thread,
} from "./types";

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) return "";
  return url.replace(/\/$/, "");
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not set.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      if (json?.message) {
        message = Array.isArray(json.message)
          ? json.message.join(", ")
          : String(json.message);
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as unknown as T;
}

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}

export async function getMe(token: string): Promise<ApiUser> {
  return request<ApiUser>("/users/me", { token });
}

export async function listUsers(
  token: string,
  params?: { userType?: string; applicationStatus?: string; search?: string },
): Promise<ApiUser[]> {
  return request<ApiUser[]>(`/users${buildQuery(params)}`, { token });
}

export async function getUser(token: string, userId: string): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`, { token });
}

export async function updateUserType(
  token: string,
  userId: string,
  userType: string,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}/user-type`, {
    method: "PATCH",
    token,
    body: { userType },
  });
}

export async function updateApplicationStatus(
  token: string,
  userId: string,
  applicationStatus: string,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}/application-status`, {
    method: "PATCH",
    token,
    body: { applicationStatus },
  });
}

// -- Reference data (used to populate form dropdowns) ------------------------
// Field-specific lists use `/categories/...` sub-routes. Topic lists use `/topics`.

export type CategoryType = "EVENT" | "DISCOUNT" | "ONBOARDING" | "AFFIRMATION";

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  sortOrder: number;
};

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  return request<Category[]>(`/categories${buildQuery({ type })}`);
}

/** Canonical topic list from the `Topic` table. */
export type Topic = {
  id: string;
  name: string;
  description: string | null;
};

export async function getTopics(): Promise<Topic[]> {
  return request<Topic[]>("/topics");
}

import type { AddressSuggestion } from "./address";

export async function searchAddresses(q: string): Promise<AddressSuggestion[]> {
  const trimmed = q.trim();
  if (trimmed.length < 3) return [];
  return request<AddressSuggestion[]>(
    `/addresses/search${buildQuery({ q: trimmed })}`,
  );
}

export async function getDiscountLocations(): Promise<string[]> {
  return request<string[]>("/categories/discounts/locations");
}

export async function getDiscountTiers(): Promise<string[]> {
  return request<string[]>("/categories/discounts/tiers");
}

export async function getEventLocations(): Promise<string[]> {
  return request<string[]>("/categories/events/locations");
}

export async function getEventFormats(): Promise<string[]> {
  return request<string[]>("/categories/events/formats");
}

export async function getRetreatLocations(): Promise<string[]> {
  return request<string[]>("/categories/retreats/locations");
}

export async function getRetreatSeasons(): Promise<string[]> {
  return request<string[]>("/categories/retreats/seasons");
}

export async function getResourceTypes(): Promise<string[]> {
  return request<string[]>("/categories/resources/types");
}

export async function getResourceSubTopics(topic: string): Promise<string[]> {
  if (!topic) return [];
  return request<string[]>(
    `/categories/resources/subtopics${buildQuery({ topic })}`,
  );
}

export type ResourceTopic = {
  name: string;
  description: string;
};

export async function getResourceTopics(): Promise<ResourceTopic[]> {
  return request<ResourceTopic[]>("/categories/resources/topics");
}

// -- Discounts ---------------------------------------------------------------

export async function getDiscounts(token?: string): Promise<Discount[]> {
  return request<Discount[]>(
    `/discounts${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

export async function createDiscount(
  body: CreateDiscountInput,
  token?: string,
): Promise<Discount> {
  return request<Discount>("/discounts", { method: "POST", token, body });
}

export async function updateDiscount(
  id: string,
  body: Partial<CreateDiscountInput>,
  token?: string,
): Promise<Discount> {
  return request<Discount>(`/discounts/${id}`, { method: "PATCH", token, body });
}

export async function deleteDiscount(id: string, token?: string): Promise<void> {
  await request<void>(`/discounts/${id}`, { method: "DELETE", token });
}

export async function getDiscountById(id: string, token?: string): Promise<Discount> {
  return request<Discount>(
    `/discounts/${id}${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

// -- Events ------------------------------------------------------------------

export async function getEvents(token?: string): Promise<Event[]> {
  return request<Event[]>(
    `/events${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

export async function createEvent(
  body: CreateEventInput,
  token?: string,
): Promise<Event> {
  return request<Event>("/events", { method: "POST", token, body });
}

export async function updateEvent(
  id: string,
  body: Partial<CreateEventInput>,
  token?: string,
): Promise<Event> {
  return request<Event>(`/events/${id}`, { method: "PATCH", token, body });
}

export async function deleteEvent(id: string, token?: string): Promise<void> {
  await request<void>(`/events/${id}`, { method: "DELETE", token });
}

export async function getEventById(id: string, token?: string): Promise<Event> {
  return request<Event>(
    `/events/${id}${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

// -- Resources ---------------------------------------------------------------

export async function getResources(token?: string): Promise<Resource[]> {
  return request<Resource[]>(
    `/resources${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

export async function createResource(
  body: CreateResourceInput,
  token?: string,
): Promise<Resource> {
  return request<Resource>("/resources", { method: "POST", token, body });
}

export async function updateResource(
  id: string,
  body: Partial<CreateResourceInput>,
  token?: string,
): Promise<Resource> {
  return request<Resource>(`/resources/${id}`, { method: "PATCH", token, body });
}

export async function deleteResource(id: string, token?: string): Promise<void> {
  await request<void>(`/resources/${id}`, { method: "DELETE", token });
}

export async function getResourceById(id: string, token?: string): Promise<Resource> {
  return request<Resource>(
    `/resources/${id}${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

// -- Retreats ----------------------------------------------------------------

export async function getRetreats(token?: string): Promise<Retreat[]> {
  return request<Retreat[]>(
    `/retreats${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

export async function createRetreat(
  body: CreateRetreatInput,
  token?: string,
): Promise<Retreat> {
  return request<Retreat>("/retreats", { method: "POST", token, body });
}

export async function updateRetreat(
  id: string,
  body: Partial<CreateRetreatInput>,
  token?: string,
): Promise<Retreat> {
  return request<Retreat>(`/retreats/${id}`, { method: "PATCH", token, body });
}

export async function deleteRetreat(id: string, token?: string): Promise<void> {
  await request<void>(`/retreats/${id}`, { method: "DELETE", token });
}

export async function getRetreatById(id: string, token?: string): Promise<Retreat> {
  return request<Retreat>(
    `/retreats/${id}${buildQuery(token ? ADMIN_QUERY : undefined)}`,
    { token },
  );
}

// -- Forum -------------------------------------------------------------------

export async function getThreads(
  token: string,
  params?: { search?: string; page?: number; limit?: number },
): Promise<Thread[]> {
  const res = await request<{ data: Thread[] }>(`/threads${buildQuery(params)}`, {
    token,
  });
  return res.data;
}

export async function getForumPosts(
  token: string,
  params?: { search?: string; page?: number; limit?: number },
): Promise<ForumPost[]> {
  const res = await request<{ data: ForumPost[] }>(`/posts${buildQuery(params)}`, {
    token,
  });
  return res.data;
}

// -- Moderation --------------------------------------------------------------

export async function moderateThread(
  token: string,
  id: string,
  body: { isPinned?: boolean; isLocked?: boolean },
): Promise<Thread> {
  return request<Thread>(`/threads/${id}/moderate`, { method: "PATCH", token, body });
}

export async function deleteThread(token: string, id: string): Promise<void> {
  await request<void>(`/threads/${id}`, { method: "DELETE", token });
}

export async function deletePost(token: string, id: string): Promise<void> {
  await request<void>(`/posts/${id}`, { method: "DELETE", token });
}

export async function deleteComment(token: string, id: string): Promise<void> {
  await request<void>(`/comments/${id}`, { method: "DELETE", token });
}

export async function getReports(
  token: string,
  status?: string,
): Promise<ContentReport[]> {
  return request<ContentReport[]>(`/reports${buildQuery({ status })}`, { token });
}

export async function updateReportStatus(
  token: string,
  id: string,
  status: "pending" | "reviewed" | "dismissed",
): Promise<ContentReport> {
  return request<ContentReport>(`/reports/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

// -- Groups ------------------------------------------------------------------

export async function getGroups(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Group[]> {
  const res = await request<{ groups: Group[] }>(`/groups${buildQuery(params)}`);
  return res.groups;
}

export async function updateGroupStatus(
  token: string,
  id: string,
  status: "active" | "inactive" | "archived",
): Promise<Group> {
  return request<Group>(`/groups/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

// -- Affirmations ------------------------------------------------------------

export async function getAffirmationTopics(): Promise<AffirmationTopic[]> {
  return request<AffirmationTopic[]>("/affirmations/topics");
}

export async function getAffirmations(params?: {
  topicSlug?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Affirmation[]; total: number }> {
  const res = await request<{ items: Affirmation[]; total: number }>(
    `/affirmations${buildQuery(params)}`,
  );
  return res;
}

export async function createAffirmation(
  token: string,
  body: { topicSlug: string; body: string; faithBased?: boolean; sortOrder?: number },
): Promise<Affirmation> {
  return request<Affirmation>("/affirmations", { method: "POST", token, body });
}

export async function updateAffirmation(
  token: string,
  id: string,
  body: Partial<{ topicSlug: string; body: string; faithBased: boolean; sortOrder: number }>,
): Promise<Affirmation> {
  return request<Affirmation>(`/affirmations/${id}`, { method: "PATCH", token, body });
}

export async function deleteAffirmation(token: string, id: string): Promise<void> {
  await request<void>(`/affirmations/${id}`, { method: "DELETE", token });
}
