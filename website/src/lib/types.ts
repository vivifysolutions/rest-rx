export type ApplicationStatus = "pending" | "approved" | "rejected";

export type UserType = "member" | "admin" | "brand_partner" | "expert" | "ambassador" | "foundation";

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
  partnerApplicationStatus?: ApplicationStatus | null;
  isActive: boolean;
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
  percentage: number | null;
  offerHighlight: string | null;
  offerSummary: string | null;
  redemptionInstructions: string | null;
  terms: string | null;
  category: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  tier: string | null;
  claimLink: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  image: string | null;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  expiryDate: string | null;
  ownerId?: string | null;
  brandPartnerApplicationId?: string | null;
  brandPartnerApplication?: {
    id: string;
    companyName: string;
    fullName: string;
    email: string;
    applicationType?: string;
    status?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountInput = {
  title: string;
  description?: string;
  percentage?: number;
  offerHighlight?: string;
  offerSummary?: string;
  redemptionInstructions?: string;
  terms?: string;
  category: string;
  location?: string;
  /** Structured address — preferred for geocoding to lat/lng. */
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  latitude?: number;
  longitude?: number;
  tier?: string;
  claimLink?: string;
  website?: string;
  instagram?: string;
  phone?: string;
  image?: string;
  images?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  expiryDate?: string;
  /** Admin: link discount to an approved brand partner application. Empty string clears. */
  brandPartnerApplicationId?: string;
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
  ownerId?: string | null;
  brandPartnerApplicationId?: string | null;
  brandPartnerApplication?: {
    id: string;
    companyName: string;
    fullName: string;
    email: string;
    applicationType?: string;
    status?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  location?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
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
  /** Admin: link to approved brand / expert / foundation application. Empty string clears. */
  brandPartnerApplicationId?: string;
};

/** Mirrors Prisma `Resource`. Uses `topic`/`subTopic` (not category). */
export type Resource = {
  id: string;
  title: string;
  description: string | null;
  citations: string | null;
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
  citations?: string;
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
  joinInstructions: string | null;
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
  joinInstructions?: string;
};

export type ForumAuthor = {
  id: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type ForumComment = {
  id: string;
  content: string;
  createdAt: string;
  author: ForumAuthor;
  likeCount: number;
};

export type Thread = {
  id: string;
  title: string;
  content: string;
  topic?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  author: ForumAuthor;
  postCount: number;
};

export type ThreadPost = {
  id: string;
  content: string;
  title?: string | null;
  createdAt: string;
  author: ForumAuthor;
  likeCount: number;
  comments: ForumComment[];
};

export type ThreadDetail = Thread & {
  posts: ThreadPost[];
};

export type ForumPost = {
  id: string;
  title?: string | null;
  content: string;
  topic?: string | null;
  createdAt: string;
  author: ForumAuthor;
  likeCount: number;
  replyCount?: number;
  commentCount?: number;
};

export type ForumPostDetail = ForumPost & {
  comments: ForumComment[];
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
  coverImageUrl?: string | null;
  status: "active" | "inactive" | "archived";
  topic?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  memberCount: number;
  createdAt: string;
  creatorId?: string;
  creator?: {
    id: string;
    displayName?: string | null;
    professionalRole?: string | null;
  };
  members?: Array<{
    id: string;
    displayName?: string | null;
    professionalRole?: string | null;
  }>;
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
