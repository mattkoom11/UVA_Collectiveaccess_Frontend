import type { Garment } from "@/types/garment";

/**
 * Collection search through the hfa-ml search service (keyword + FashionCLIP image
 * search, fused; nDCG@5 0.80 vs 0.68 for keyword search on a 40-query blind-judged benchmark).
 *
 * Server-side only: SEARCH_SERVICE_URL and SEARCH_SERVICE_TOKEN must never be NEXT_PUBLIC_.
 * Returns null whenever the service isn't configured, is slow, errors, or returns nothing
 * loaded here, so the caller can fall back to plain keyword search and search never breaks.
 */
export interface SemanticSearchConfig {
  url?: string;
  token?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const MAX_QUERY = 200; // the service rejects longer queries
const MAX_K = 24;

export async function semanticSearch(
  q: string,
  allGarments: Garment[],
  config: SemanticSearchConfig = {}
): Promise<Garment[] | null> {
  const url = config.url ?? process.env.SEARCH_SERVICE_URL;
  const token = config.token ?? process.env.SEARCH_SERVICE_TOKEN;
  const query = q.trim().slice(0, MAX_QUERY);
  if (!url || !token || !query) return null;

  try {
    const res = await (config.fetchImpl ?? fetch)(`${url.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, k: MAX_K }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 2000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: unknown };
    if (!Array.isArray(data.results)) return null;

    const byAccession = new Map<string, Garment>();
    for (const g of allGarments) if (g.accessionNumber) byAccession.set(g.accessionNumber, g);
    const found = data.results
      .filter((a): a is string => typeof a === "string")
      .map((a) => byAccession.get(a))
      .filter((g): g is Garment => g !== undefined);
    return found.length > 0 ? found : null;
  } catch {
    return null; // timeout, network error, bad JSON: fall back to keyword search
  }
}
