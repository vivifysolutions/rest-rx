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
