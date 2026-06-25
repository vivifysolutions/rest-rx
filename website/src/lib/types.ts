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
  npiNumber?: string | null;
  phone?: string | null;
  userType: UserType;
  applicationStatus: ApplicationStatus;
  identityPhotoUrl?: string | null;
  workCredentialPhotoUrl?: string | null;
  onboardingAnswers?: Record<string, unknown> | null;
  onboardingCompletedAt?: string | null;
  applicationSubmittedAt?: string | null;
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
  isPublished: boolean;
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
  isPublished?: boolean;
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
  isPublished: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt?: string;
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
  isPublished?: boolean;
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
  image: string | null;
  images: string[];
  mediaUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
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
  image?: string;
  images?: string[];
  mediaUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
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
  isPublished: boolean;
  startDate: string | null;
  endDate: string | null;
  bookingUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
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
  isPublished?: boolean;
  startDate?: string;
  endDate?: string;
  bookingUrl?: string;
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

export type ContentReport = {
  id: string;
  contentType: "thread" | "post" | "comment" | "group";
  contentId: string;
  reason: string | null;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  contentPreview?: string | null;
  reporter: {
    id: string;
    email: string | null;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive" | "archived";
  topic?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  memberCount: number;
  createdAt: string;
};

export type Affirmation = {
  id: string;
  topicSlug: string;
  topicTitle: string;
  body: string;
  faithBased: boolean;
  sortOrder: number;
};

export type AffirmationTopic = {
  id: string;
  slug: string;
  title: string;
  description: string;
};
