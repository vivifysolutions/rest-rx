const ADMIN_METRICS_CHANGED = "restrx:admin-metrics-changed";

/** Call after approving/rejecting applications or changing roles so nav/page totals refresh. */
export function notifyAdminMetricsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_METRICS_CHANGED));
}

export function subscribeAdminMetricsChanged(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(ADMIN_METRICS_CHANGED, listener);
  return () => window.removeEventListener(ADMIN_METRICS_CHANGED, listener);
}
