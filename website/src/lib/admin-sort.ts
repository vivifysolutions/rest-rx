/** Case-insensitive string compare; null/empty sorts last. */
export function compareText(a: string | null | undefined, b: string | null | undefined): number {
  const left = (a ?? "").trim().toLowerCase();
  const right = (b ?? "").trim().toLowerCase();
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

export function compareDateDesc(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;
  return right - left;
}

export function compareDateAsc(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const left = a ? new Date(a).getTime() : Number.POSITIVE_INFINITY;
  const right = b ? new Date(b).getTime() : Number.POSITIVE_INFINITY;
  return left - right;
}

export function compareBoolDesc(a: boolean | null | undefined, b: boolean | null | undefined): number {
  return Number(Boolean(b)) - Number(Boolean(a));
}

export function sortBy<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  return [...items].sort(compare);
}
