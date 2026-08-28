export function normalizeResourceType(type: string): string {
  return type.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isQuickRxType(type: string): boolean {
  return normalizeResourceType(type) === "quickrx";
}

export function isMicroRxType(type: string): boolean {
  return normalizeResourceType(type) === "microrx";
}

export function isArticleType(type: string): boolean {
  return normalizeResourceType(type) === "article";
}

export function isAudioType(type: string): boolean {
  return normalizeResourceType(type) === "audio";
}

export function isVideoType(type: string): boolean {
  return normalizeResourceType(type) === "video";
}

/** True when the resource has the media admins expect for that type (slides for Quick Rx, file for audio/video). */
export function resourceHasMedia(resource: {
  type: string;
  mediaUrl?: string | null;
  image?: string | null;
  images?: string[] | null;
}): boolean {
  if (isQuickRxType(resource.type)) {
    return Boolean(resource.images?.length || resource.image);
  }
  return Boolean(resource.mediaUrl);
}
