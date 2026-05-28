export type ApplicationStatus = "pending" | "approved" | "rejected";

export type UserType = "member" | "admin" | "brand_partner" | "expert";

export type ApiUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  professionalRole: string | null;
  specialty: string | null;
  userType: UserType;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors Prisma `Discount`. All fields below match the model directly so
 * the admin form can edit every column.
 */
export type Discount = {
  id: string;
  title: string;
  description: string | null;
  percentage: number;
  category: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  tier: string | null;
  claimLink: string | null;
  image: string | null;
  isFeatured: boolean;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountInput = {
  title: string;
  description?: string;
  percentage: number;
  category: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  tier?: string;
  claimLink?: string;
  image?: string;
  isFeatured?: boolean;
  expiryDate?: string;
};

/** Mirrors Prisma `Event`. */
export type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  image: string | null;
  format: string | null;
  price: number | null;
  registrationUrl: string | null;
  isFeatured: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  image?: string;
  format?: string;
  price?: number;
  registrationUrl?: string;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
};

/** Mirrors Prisma `Resource`. Uses `topic`/`subTopic` (not category). */
export type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: string | null;
  topic: string | null;
  subTopic: string | null;
  tier: string | null;
  image: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateResourceInput = {
  title: string;
  description?: string;
  type: string;
  duration?: string;
  topic?: string;
  subTopic?: string;
  tier?: string;
  image?: string;
  isFeatured?: boolean;
};

/** Mirrors Prisma `Retreat`. */
export type Retreat = {
  id: string;
  title: string;
  description: string | null;
  season: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  rating: number | null;
  image: string | null;
  isFeatured: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export type CreateRetreatInput = {
  title: string;
  description?: string;
  season?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  rating?: number;
  image?: string;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
};

/** Response shape of `GET /categories` — distinct category values per content type. */
export type ReferenceData = {
  /** Distinct `Discount.category` values currently in the DB. */
  discounts: string[];
  /** Distinct `Event.category` values currently in the DB. */
  events: string[];
  /** Distinct `Retreat.category` values currently in the DB. */
  retreats: string[];
  /** Distinct `Resource.topic` values currently in the DB. */
  resources: string[];
};

export type Thread = {
  id: string;
  title: string;
  content: string;
  topic?: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  author: {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  postCount: number;
};

export type ForumPost = {
  id: string;
  title?: string | null;
  content: string;
  topic?: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  likeCount: number;
  replyCount: number;
};
