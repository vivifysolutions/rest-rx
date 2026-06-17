import { buildQuery } from "./buildQuery";
import type {
  ApiUser,
  CreateDiscountInput,
  CreateEventInput,
  CreateResourceInput,
  CreateRetreatInput,
  Discount,
  Event,
  ForumPost,
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

export async function getResourceTiers(): Promise<string[]> {
  return request<string[]>("/categories/resources/tiers");
}

export async function getResourceSubTopics(topic: string): Promise<string[]> {
  if (!topic) return [];
  return request<string[]>(
    `/categories/resources/subtopics${buildQuery({ topic })}`,
  );
}

// -- Discounts ---------------------------------------------------------------

export async function getDiscounts(token?: string): Promise<Discount[]> {
  return request<Discount[]>("/discounts", { token });
}

export async function createDiscount(
  body: CreateDiscountInput,
  token?: string,
): Promise<Discount> {
  return request<Discount>("/discounts", { method: "POST", token, body });
}

export async function deleteDiscount(id: string, token?: string): Promise<void> {
  await request<void>(`/discounts/${id}`, { method: "DELETE", token });
}

// -- Events ------------------------------------------------------------------

export async function getEvents(token?: string): Promise<Event[]> {
  return request<Event[]>("/events", { token });
}

export async function createEvent(
  body: CreateEventInput,
  token?: string,
): Promise<Event> {
  return request<Event>("/events", { method: "POST", token, body });
}

// -- Resources ---------------------------------------------------------------

export async function getResources(token?: string): Promise<Resource[]> {
  return request<Resource[]>("/resources", { token });
}

export async function createResource(
  body: CreateResourceInput,
  token?: string,
): Promise<Resource> {
  return request<Resource>("/resources", { method: "POST", token, body });
}

// -- Retreats ----------------------------------------------------------------

export async function getRetreats(token?: string): Promise<Retreat[]> {
  return request<Retreat[]>("/retreats", { token });
}

export async function createRetreat(
  body: CreateRetreatInput,
  token?: string,
): Promise<Retreat> {
  return request<Retreat>("/retreats", { method: "POST", token, body });
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
