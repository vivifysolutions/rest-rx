export type ImageUploadGuideKey =
  | "discount"
  | "event"
  | "retreat"
  | "resource-cover"
  | "quick-rx-slide"
  | "forum-cover"
  | "group-cover";

export type ImageUploadGuide = {
  key: ImageUploadGuideKey;
  label: string;
  recommendedSize: string;
  aspectRatio: string;
  formats: string;
  maxFileSize: string;
  whereUsed: string;
  tips?: string;
};

export const IMAGE_UPLOAD_GUIDES: Record<ImageUploadGuideKey, ImageUploadGuide> = {
  discount: {
    key: "discount",
    label: "Discount cover",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Discover discounts — featured carousel, list cards, and detail gallery",
    tips: "Upload multiple photos if you have them. The first image is the cover; members swipe through the rest on the detail screen. Keep logos and text away from the edges.",
  },
  event: {
    key: "event",
    label: "Event photos",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Discover events — browse cards and event detail gallery",
    tips: "Upload multiple photos if you have them. The first image is the cover; members swipe through the rest on the detail screen. Use a clear photo with good contrast; titles overlay on some layouts.",
  },
  retreat: {
    key: "retreat",
    label: "Retreat photos",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Discover retreats — horizontal cards and retreat detail gallery",
    tips: "Upload multiple destination and mood shots. The first image is the cover; members swipe through the rest on the detail screen. Avoid heavy text in the image.",
  },
  "resource-cover": {
    key: "resource-cover",
    label: "Resource cover (audio, video, article)",
    recommendedSize: "1200 × 800 px",
    aspectRatio: "3∶2 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Discover resources — vertical browse cards and article/video detail hero",
    tips: "Slightly taller than events; important content should stay in the center third.",
  },
  "quick-rx-slide": {
    key: "quick-rx-slide",
    label: "Quick Rx slide",
    recommendedSize: "1080 × 1350 px",
    aspectRatio: "4∶5 (portrait)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Quick Rx slideshow when members open a resource in the app",
    tips: "Design each slide as a full-screen portrait card; upload slides in display order.",
  },
  "forum-cover": {
    key: "forum-cover",
    label: "Forum cover",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Community forum thread cards and thread detail gallery",
    tips: "Use a clear landscape photo. This is the cover members see on the Community tab.",
  },
  "group-cover": {
    key: "group-cover",
    label: "Group cover",
    recommendedSize: "800 × 800 px",
    aspectRatio: "1∶1 (square)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "32 MB",
    whereUsed: "Community group list thumbnails, trending cards, and group detail header",
    tips: "Square crop works best; it is shown as a round thumbnail on list cards.",
  },
};

export const IMAGE_UPLOAD_GUIDE_LIST = Object.values(IMAGE_UPLOAD_GUIDES);

export function getImageUploadGuide(key: ImageUploadGuideKey): ImageUploadGuide {
  return IMAGE_UPLOAD_GUIDES[key];
}
