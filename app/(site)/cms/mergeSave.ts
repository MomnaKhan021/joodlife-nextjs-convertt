/**
 * Saving a document that more than one screen writes.
 *
 * The treatments document is written by the Home screen and the Period delay
 * screen; the shared treatment-pages document by the Period delay and ED
 * screens. Each screen used to send back the whole document as it was when
 * the screen opened - so with two open at once, the second Save quietly put
 * back whatever the first had changed.
 *
 * Now a screen re-reads the stored document just before saving and keeps,
 * piece by piece, its own value only where it was edited here; everything
 * else is taken from what is stored now.
 */

/** The document as stored right now. */
export async function loadLatest(slug: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/globals/${slug}?depth=0`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Could not re-read ${slug} before saving (HTTP ${res.status}). Nothing was saved.`);
  }
  return (await res.json()) as Record<string, unknown>;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Mine if it was edited on this screen since `base`, otherwise the stored value. */
export function keepChange<T>(mine: T, base: T, latest: T): T {
  return same(mine, base) ? latest : mine;
}

/** keepChange for every key of a map - text sizes, section colours. */
export function keepChangedKeys<V>(
  mine: Record<string, V>,
  base: Record<string, V>,
  latest: Record<string, V>,
): Record<string, V> {
  const out: Record<string, V> = { ...latest };
  for (const k of Object.keys(mine)) {
    if (!same(mine[k], base[k])) out[k] = mine[k];
  }
  return out;
}
