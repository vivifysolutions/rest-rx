export type ImageUploadGuideKey =
  | "discount"
  | "event"
  | "retreat"
  | "resource-cover"
  | "quick-rx-slide";

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
    maxFileSize: "8 MB",
    whereUsed: "Discover discounts — featured carousel, list cards, and detail gallery",
    tips: "Upload multiple photos if you have them. The first image is the cover; members swipe through the rest on the detail screen. Keep logos and text away from the edges.",
  },
  event: {
    key: "event",
    label: "Event cover",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "8 MB",
    whereUsed: "Discover events — browse cards and event detail",
    tips: "Use a clear photo with good contrast; titles overlay on some layouts.",
  },
  retreat: {
    key: "retreat",
    label: "Retreat cover",
    recommendedSize: "1200 × 675 px",
    aspectRatio: "16∶9 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "8 MB",
    whereUsed: "Discover retreats — horizontal cards and retreat detail",
    tips: "Destination and mood shots work best; avoid heavy text in the image.",
  },
  "resource-cover": {
    key: "resource-cover",
    label: "Resource cover (audio, video, article)",
    recommendedSize: "1200 × 800 px",
    aspectRatio: "3∶2 (landscape)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "8 MB",
    whereUsed: "Discover resources — vertical browse cards and article/video detail hero",
    tips: "Slightly taller than events; important content should stay in the center third.",
  },
  "quick-rx-slide": {
    key: "quick-rx-slide",
    label: "Quick Rx slide",
    recommendedSize: "1080 × 1350 px",
    aspectRatio: "4∶5 (portrait)",
    formats: "JPG, PNG, or WebP",
    maxFileSize: "8 MB",
    whereUsed: "Quick Rx slideshow when members open a resource in the app",
    tips: "Design each slide as a full-screen portrait card; upload slides in display order.",
  },
};

export const IMAGE_UPLOAD_GUIDE_LIST = Object.values(IMAGE_UPLOAD_GUIDES);

export function getImageUploadGuide(key: ImageUploadGuideKey): ImageUploadGuide {
  return IMAGE_UPLOAD_GUIDES[key];
}
