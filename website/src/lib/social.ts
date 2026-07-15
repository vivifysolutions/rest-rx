/** Strip Instagram URL/@ down to a bare username for storage. */
export function normalizeInstagramHandle(value: string | null | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  let handle = raw;
  if (/instagram\.com/i.test(handle)) {
    try {
      const withProtocol = /^https?:\/\//i.test(handle) ? handle : `https://${handle}`;
      const path = new URL(withProtocol).pathname.replace(/^\/+|\/+$/g, "");
      handle = path.split("/")[0] || handle;
    } catch {
      /* keep raw */
    }
  }

  handle = handle.replace(/^@/, "").replace(/\/+$/, "").trim();
  return handle || undefined;
}

export function instagramProfileUrl(value: string | null | undefined): string | null {
  const handle = normalizeInstagramHandle(value);
  return handle ? `https://instagram.com/${handle}` : null;
}

export function formatInstagramLabel(value: string | null | undefined): string {
  const handle = normalizeInstagramHandle(value);
  return handle ? `@${handle}` : "—";
}
