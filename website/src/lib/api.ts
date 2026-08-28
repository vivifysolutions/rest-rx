import { buildQuery, ADMIN_QUERY } from "./buildQuery";
import { notifyAdminMetricsChanged } from "@/lib/admin-metrics-events";
import type { BrandPartnerApplication } from "@/lib/brand-partner-application";
import { normalizeBrandPartnerApplication } from "@/lib/brand-partner-application";
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
  ForumPostDetail,
  Group,
  GuidedGoal,
  CreateGuidedGoalInput,
  Resource,
  Retreat,
  Suggestion,
  Thread,
  ThreadDetail,
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

type PaginatedList<T> = { data: T[]; meta: { total: number } };

/** Count via page=1&limit=1 so the admin home does not download full catalogs. */
export async function getAdminListTotal(
  path: "/discounts" | "/resources" | "/events" | "/retreats",
  token?: string,
): Promise<number> {
  const result = await request<PaginatedList<unknown> | unknown[]>(
    `${path}${buildQuery({ ...(token ? ADMIN_QUERY : undefined), page: 1, limit: 1 })}`,
    { token },
  );
  if (Array.isArray(result)) return result.length;
  if (typeof result?.meta?.total === "number") return result.meta.total;
  if (Array.isArray(result?.data)) return result.data.length;
  return 0;
}

export async function getMe(token: string): Promise<ApiUser> {
  return request<ApiUser>("/users/me", { token });
}

export async function patchMe(
  token: string,
  body: UpdateUserProfilePayload,
): Promise<ApiUser> {
  return request<ApiUser>("/users/me", {
    method: "PATCH",
    token,
    body,
  });
}

export async function markApplicationSubmitted(token: string): Promise<ApiUser> {
  return request<ApiUser>("/users/me/application-submitted", {
    method: "POST",
    token,
  });
}

export async function listUsers(
  token: string,
  params?: {
    userType?: string;
    userTypes?: string[];
    applicationStatus?: string;
    excludeApplicationStatus?: string;
    search?: string;
  },
): Promise<ApiUser[]> {
  const { userTypes, ...rest } = params ?? {};
  return request<ApiUser[]>(
    `/users${buildQuery({
      ...rest,
      userTypes: userTypes?.length ? userTypes.join(",") : undefined,
    })}`,
    { token },
  );
}

export type CommunityMetrics = {
  counts: {
    members: number;
    brandPartners: number;
    experts: number;
    ambassadors: number;
    foundations: number;
    partners: number;
    totalApproved: number;
  };
  pending: {
    members: number;
    partners: number;
    suggestions: number;
    reports: number;
  };
  locations: {
    withAddress: number;
    withoutAddress: number;
    byGeographicScope: Record<string, number>;
    byLocation: Array<{
      label: string;
      region: string | null;
      count: number;
      byType: Record<string, number>;
    }>;
    partners: Array<{
      applicationId: string;
      applicationType: string;
      name: string;
      address: string | null;
      locationLabel: string;
      region: string | null;
      geographicScope: string | null;
      userId: string | null;
    }>;
  };
};

export async function getCommunityMetrics(token: string): Promise<CommunityMetrics> {
  return request<CommunityMetrics>("/users/metrics", { token });
}

export async function getUser(token: string, userId: string): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`, { token });
}

export async function updateUserType(
  token: string,
  userId: string,
  userType: string,
): Promise<ApiUser> {
  const user = await request<ApiUser>(`/users/${userId}/user-type`, {
    method: "PATCH",
    token,
    body: { userType },
  });
  notifyAdminMetricsChanged();
  return user;
}

export async function updateUserActive(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}/active`, {
    method: "PATCH",
    token,
    body: { isActive },
  });
}

export async function updateApplicationStatus(
  token: string,
  userId: string,
  applicationStatus: string,
  rejectionReason?: string,
  rejectionIssue?: string,
): Promise<ApiUser> {
  const user = await request<ApiUser>(`/users/${userId}/application-status`, {
    method: "PATCH",
    token,
    body: { applicationStatus, rejectionReason, rejectionIssue },
  });
  notifyAdminMetricsChanged();
  return user;
}

export type UpdateUserProfilePayload = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  professionalRole?: string;
  specialty?: string;
  npiNumber?: string;
  phone?: string;
  identityPhotoUrl?: string;
  workCredentialPhotoUrl?: string;
};

export async function updateUserProfile(
  token: string,
  userId: string,
  body: UpdateUserProfilePayload,
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${userId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteUser(token: string, userId: string): Promise<void> {
  await request<void>(`/users/${userId}`, { method: "DELETE", token });
  notifyAdminMetricsChanged();
}

// -- Brand partner applications -----------------------------------------------

export async function submitBrandPartnerApplication(
  token: string,
  body: unknown,
): Promise<BrandPartnerApplication> {
  const result = await request<BrandPartnerApplication>("/brand-partner-applications", {
    method: "POST",
    token,
    body,
  });
  return normalizeBrandPartnerApplication(result);
}

/** Edits and resubmits a rejected application in place (no duplicate row). */
export async function resubmitBrandPartnerApplication(
  token: string,
  body: unknown,
): Promise<BrandPartnerApplication> {
  const result = await request<BrandPartnerApplication>("/brand-partner-applications/me", {
    method: "PATCH",
    token,
    body,
  });
  return normalizeBrandPartnerApplication(result);
}

/** The signed-in applicant's own most recent partner application, or null if they've never applied. */
export async function getMyBrandPartnerApplication(
  token: string,
): Promise<BrandPartnerApplication | null> {
  const result = await request<BrandPartnerApplication | null>("/brand-partner-applications/me", {
    token,
  });
  return result ? normalizeBrandPartnerApplication(result) : null;
}

export async function getBrandPartnerApplications(
  token: string,
  params?: { status?: string; applicationType?: string },
): Promise<BrandPartnerApplication[]> {
  const items = await request<BrandPartnerApplication[]>(
    `/brand-partner-applications${buildQuery(params)}`,
    { token },
  );
  return items.map(normalizeBrandPartnerApplication);
}

export async function getBrandPartnerApplication(
  token: string,
  id: string,
): Promise<BrandPartnerApplication> {
  const item = await request<BrandPartnerApplication>(`/brand-partner-applications/${id}`, {
    token,
  });
  return normalizeBrandPartnerApplication(item);
}

export async function approveBrandPartnerApplication(
  token: string,
  id: string,
): Promise<BrandPartnerApplication> {
  const item = await request<BrandPartnerApplication>(`/brand-partner-applications/${id}/approve`, {
    method: "PATCH",
    token,
  });
  notifyAdminMetricsChanged();
  return normalizeBrandPartnerApplication(item);
}

export async function rejectBrandPartnerApplication(
  token: string,
  id: string,
  rejectionReason: string,
  rejectionIssue: string,
): Promise<BrandPartnerApplication> {
  const item = await request<BrandPartnerApplication>(`/brand-partner-applications/${id}/reject`, {
    method: "PATCH",
    token,
    body: { rejectionReason, rejectionIssue },
  });
  notifyAdminMetricsChanged();
  return normalizeBrandPartnerApplication(item);
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

export async function getResources(
  token?: string,
  params?: { type?: string; search?: string; updatedById?: string },
): Promise<Resource[]> {
  return request<Resource[]>(
    `/resources${buildQuery({ ...(token ? ADMIN_QUERY : undefined), ...params })}`,
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
  params?: { search?: string; page?: number; limit?: number; authorId?: string },
): Promise<Thread[]> {
  const res = await request<{ data: Thread[] }>(`/threads${buildQuery(params)}`, {
    token,
  });
  return res.data;
}

export async function getThreadById(token: string, id: string): Promise<ThreadDetail> {
  return request<ThreadDetail>(`/threads/${id}`, { token });
}

export async function getForumPosts(
  token: string,
  params?: {
    search?: string;
    page?: number;
    limit?: number;
    groupId?: string;
  },
): Promise<ForumPost[]> {
  const res = await request<{ data: ForumPost[] }>(`/posts${buildQuery(params)}`, {
    token,
  });
  return res.data;
}

export async function getForumPostById(token: string, id: string): Promise<ForumPostDetail> {
  return request<ForumPostDetail>(`/posts/${id}`, { token });
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

export async function getSuggestions(
  token: string,
  params?: { type?: string; status?: string },
): Promise<Suggestion[]> {
  return request<Suggestion[]>(`/suggestions${buildQuery(params)}`, { token });
}

export async function updateSuggestionStatus(
  token: string,
  id: string,
  status: "pending" | "reviewed",
): Promise<Suggestion> {
  const suggestion = await request<Suggestion>(`/suggestions/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
  notifyAdminMetricsChanged();
  return suggestion;
}

export async function updateReportStatus(
  token: string,
  id: string,
  status: "pending" | "reviewed" | "dismissed",
): Promise<ContentReport> {
  const report = await request<ContentReport>(`/reports/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
  notifyAdminMetricsChanged();
  return report;
}

// -- Groups ------------------------------------------------------------------

export async function getGroups(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "archived" | "all";
}): Promise<Group[]> {
  const res = await request<{ groups: Group[] }>(`/groups${buildQuery(params)}`);
  return res.groups;
}

export async function getGroupById(id: string, token?: string): Promise<Group> {
  return request<Group>(`/groups/${id}`, { token });
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

// -- Guided goals (Rest & Rx challenges) -------------------------------------

export async function getAdminGuidedGoals(
  token: string,
  params?: { search?: string },
): Promise<{ items: GuidedGoal[]; total: number }> {
  return request<{ items: GuidedGoal[]; total: number }>(
    `/goals/admin${buildQuery(params)}`,
    { token },
  );
}

export async function createAdminGuidedGoal(
  token: string,
  body: CreateGuidedGoalInput,
): Promise<GuidedGoal> {
  return request<GuidedGoal>("/goals/admin", { method: "POST", token, body });
}

export async function updateAdminGuidedGoal(
  token: string,
  id: string,
  body: Partial<CreateGuidedGoalInput>,
): Promise<GuidedGoal> {
  return request<GuidedGoal>(`/goals/admin/${id}`, { method: "PATCH", token, body });
}

export async function deleteAdminGuidedGoal(token: string, id: string): Promise<void> {
  await request<void>(`/goals/admin/${id}`, { method: "DELETE", token });
}
