/**
 * CollectiveAccess Web Service API Client
 * Uses session token auth via /service.php endpoints.
 * Docs: https://docs.collectiveaccess.org/wiki/Web_Service_API
 */

import { getGarmentTypeFromWorkType } from '@/types/garment';

export interface CollectiveAccessConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface CAObject {
  object_id: any;
  idno: any;
  type_id: any;
  intrinsic?: Record<string, any>;
  preferred_labels?: Record<string, any>;
  [key: string]: any;
}

export interface CAImage {
  media_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

class CollectiveAccessClient {
  private config: CollectiveAccessConfig;
  private token: string | null = null;
  private sessionCookie: string | null = null;
  private tokenExpiry = 0;
  // Token lifetime: CA sessions default to 24h; refresh 5min before expiry
  private readonly TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

  // Result-set cache: key → { data, timestamp }
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(config: CollectiveAccessConfig) {
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  private basicAuthHeader(): string {
    const encoded = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    return `Basic ${encoded}`;
  }

  private async getSessionCookie(): Promise<string> {
    // Use baseUrl (not just origin) so CA installed in a subdirectory works correctly,
    // e.g. https://host/providence/index.php/... not https://host/index.php/...
    const loginPageUrl = `${this.config.baseUrl}/index.php/LoginReg/loginForm`;

    // Step 1: GET login form to grab session cookie + CSRF token
    const pageRes = await fetch(loginPageUrl, { redirect: 'follow' });
    const pageHtml = await pageRes.text();
    const pageSetCookies: string[] =
      (pageRes.headers as any).getSetCookie?.() ??
      (pageRes.headers.get('set-cookie') ? [pageRes.headers.get('set-cookie')!] : []);
    const pageCookieHeader = pageSetCookies.map(c => c.split(';')[0]).join('; ');

    const csrfToken     = pageHtml.match(/name=.csrfToken.\s+value=.([^'"]+)/)?.[1] ?? '';
    const formTimestamp = pageHtml.match(/name=.form_timestamp.\s+value=.([^'"]+)/)?.[1] ?? '';

    // Step 2: POST credentials
    const doLoginUrl = `${this.config.baseUrl}/index.php/system/Auth/DoLogin`;
    const body = new URLSearchParams({
      _formName: 'login', form_timestamp: formTimestamp, csrfToken,
      username: this.config.username, password: this.config.password,
      redirect: '', local: '0',
    });
    const loginRes = await fetch(doLoginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(pageCookieHeader ? { Cookie: pageCookieHeader } : {}),
      },
      body: body.toString(),
      redirect: 'manual',
    });

    const loginSetCookies: string[] =
      (loginRes.headers as any).getSetCookie?.() ??
      (loginRes.headers.get('set-cookie') ? [loginRes.headers.get('set-cookie')!] : []);

    const sessionCookie = loginSetCookies
      .map(c => c.split(';')[0])
      .filter(c => c.startsWith('collectiveaccess=') && !c.includes('deleted'))
      .at(-1) ?? '';

    if (!sessionCookie) throw new Error('CollectiveAccess login failed: no session cookie returned');
    return sessionCookie;
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const sessionCookie = await this.getSessionCookie();

    const url = `${this.config.baseUrl}/service.php/json/auth/login`;
    const response = await fetch(url, {
      headers: {
        Cookie: sessionCookie,
        Authorization: this.basicAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`CollectiveAccess auth HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.authToken) {
      throw new Error(`CollectiveAccess auth failed: ${JSON.stringify(data.errors ?? data)}`);
    }

    this.token = data.authToken as string;
    this.sessionCookie = sessionCookie;
    this.tokenExpiry = Date.now() + this.TOKEN_TTL_MS;
    return this.token;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const token = await this.getToken();
    const qs = new URLSearchParams({ authToken: token });
    for (const [k, v] of Object.entries(params)) {
      qs.set(k, String(v));
    }
    const url = `${this.config.baseUrl}/service.php/json${path}?${qs.toString()}`;

    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data as T;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': this.basicAuthHeader(),
        ...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(`CollectiveAccess API error ${response.status}: ${response.statusText} (${path})`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Search for ca_objects records.
   * q defaults to "*" (all records).
   * Returns the raw results array from the CA response.
   */
  async fetchObjects(params: {
    q?: string;
    type_id?: string;
    limit?: number;
    start?: number;
    bundles?: string;
  } = {}): Promise<CAObject[]> {
    const data = await this.get<{ ok: number; results?: CAObject[] }>('/find/ca_objects', {
      q: params.q ?? '*',
      ...(params.type_id ? { type_id: params.type_id } : {}),
      ...(params.limit  !== undefined ? { limit: params.limit }   : {}),
      ...(params.start  !== undefined ? { start: params.start }   : {}),
      ...(params.bundles ? { bundles: params.bundles } : {}),
    });
    return data.results ?? [];
  }

  /**
   * Fetch a single ca_objects record by numeric/string ID.
   * Pass a comma-separated list of bundle specifiers to control which fields
   * are returned.  If omitted, CA returns all available bundles.
   *
   * Common bundles for this project:
   *   ca_objects.preferred_labels  — display name
   *   ca_objects.idno              — accession number
   *   ca_objects.type_id           — garment type
   *   ca_objects.description       — description text
   *   ca_objects.dimensions        — dimensions
   *   ca_objects.date              — date / date range
   *   ca_objects.representations   — attached media / images
   *   ca_objects.color             — color list
   *   ca_objects.materials         — materials list
   *
   * Note: the exact bundle names depend on your CA configuration.
   * Call this method without `bundles` once to discover all available bundles.
   */
  async fetchObjectById(
    objectId: string,
    bundles?: string,
  ): Promise<CAObject | null> {
    try {
      const params: Record<string, string | number> = {};
      if (bundles) params.bundles = bundles;

      const data = await this.get<CAObject>(`/item/ca_objects/id/${objectId}`, params);
      return data ?? null;
    } catch (err: any) {
      if (/404/.test(String(err))) return null;
      console.error('CollectiveAccess fetchObjectById error:', err);
      throw err;
    }
  }

  /**
   * Fetch media representations attached to a ca_objects record.
   * CA returns them inside the `representations` bundle; this method
   * normalises the result to the CAImage shape used by the rest of the app.
   */
  async fetchObjectImages(objectId: string): Promise<CAImage[]> {
    try {
      const data = await this.get<any>(
        `/item/ca_objects/id/${objectId}`,
        { bundles: 'ca_objects.representations' },
      );

      // CA returns representations as a keyed object { "69": {...}, "70": {...} }
      // not as an array. Normalise to array first.
      const raw = data?.representations ?? data?.ca_objects_representations ?? data ?? {};
      const reps: any[] = Array.isArray(raw)
        ? raw
        : Object.values(raw).filter(
            (v: any) => v && typeof v === 'object' && (v.representation_id || v.urls),
          );
      return reps.map((r: any) => ({
        media_id: r.representation_id ?? r.media_id ?? '',
        url: r.urls?.original ?? r.url ?? '',
        // preview170 is the thumbnail — fall back to original if not yet processed
        thumbnail_url: r.urls?.preview170 || r.urls?.thumbnail || r.urls?.original || r.thumbnail_url || '',
        caption: r.caption ?? r.captions?.[0] ?? '',
      }));
    } catch (err) {
      console.error('CollectiveAccess fetchObjectImages error:', err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Mapping
  // ---------------------------------------------------------------------------

  /**
   * Convert a raw CA object + images into the Garment shape expected by the
   * rest of the application.  Field paths (e.g. preferred_labels.name) may
   * need adjustment to match your specific CA metadata configuration.
   */
  // Map idno prefix to a CA type label for fast stub hydration
  private static readonly IDNO_PREFIX_TYPE: Record<string, string> = {
    DR: 'Dress', WDR: 'Dress', DRW: 'Dress',
    JKT: 'Jacket', SK: 'Skirt', SKT: 'Skirt',
    SH: 'Shirt or Blouse', BD: 'Bodice',
    OTW: 'Outerwear', OC: 'Overcoat',
    ENS: 'Ensemble', CENS: 'Ensemble',
    UND: 'Undergarment',
    RB: 'Robe',
    ST: 'Trouser', TR: 'Trouser',
    VT: 'Vest',
    PJ: 'Pajama',
    MT: 'Military Garment',
    CST: 'Suit',
    CDR: 'Combination Garment',
    CETH: 'Non-Western Garment', ETH: 'Non-Western Garment',
    WENS: 'Ensemble',
    ACS: 'Accessory',
  };

  convertToGarment(caObject: CAObject, images: CAImage[] = []): any {
    const idno   = caObject.intrinsic?.idno ?? caObject.idno?.value ?? caObject.idno ?? '';
    const name   = caObject.preferred_labels?.en_US?.[0]?.name ?? (caObject as any).display_label ?? idno;
    // type_id.display_text.en_US is the human-readable type label e.g. "Overcoat"
    const typeDisplay = caObject.type_id?.display_text?.en_US ?? caObject.intrinsic?.type_id;
    const idnoPrefix = String(idno).split('.')[0].toUpperCase();
    const typeStr = typeof typeDisplay === 'string' && typeDisplay
      ? typeDisplay
      : CollectiveAccessClient.IDNO_PREFIX_TYPE[idnoPrefix] ?? '';

    const dateRange  = this.extractBundleValue(caObject, 'ca_objects.date_range');
    // CA installations differ in the key names used for date range endpoints.
    // Try all known variants: earliest_date/latest_date, start/end, year_start/year_end.
    const earliest   = (
      dateRange?.earliest_date ??
      dateRange?.start_date ??
      dateRange?.start ??
      dateRange?.year_start ??
      dateRange?.date_start
    ) as string | undefined;
    const latest     = (
      dateRange?.latest_date ??
      dateRange?.end_date ??
      dateRange?.end ??
      dateRange?.year_end ??
      dateRange?.date_end
    ) as string | undefined;
    // Some CA versions return the whole display string (e.g. "circa 1960") under `display`
    const displayDate = dateRange?.display as string | undefined;
    const dateStr    = earliest && latest && String(earliest) !== String(latest)
      ? `${earliest}–${latest}`
      : (earliest ?? latest ?? displayDate);

    // Infer year from idno as era fallback when no date_range is present.
    // Handles both "DR.1965.001" (letter prefix) and "1965.001.1" (year-first) patterns.
    // Excludes years >= 2010 to avoid treating acquisition years as manufacture dates.
    const idnoYear = (() => {
      const parts = String(idno).split(/[.\-_]/);
      for (const p of parts) {
        const y = parseInt(p, 10);
        if (p.length === 4 && y >= 1800 && y < 2010) return String(y);
      }
      return undefined;
    })();

    const condition       = this.extractBundleValue(caObject, 'ca_objects.condition')?.condition as string | undefined;
    const provenance      = this.extractTextBundle(caObject, 'ca_objects.provenance')
                            ?? this.extractBundleValue(caObject, 'ca_objects.provenance')?.provenance as string | undefined;
    const storageLocation = this.extractBundleValue(caObject, 'ca_objects.storage_location')?.storage_location as string | undefined;

    const gender = this.extractBundleValue(caObject, 'ca_objects.gender')?.gender as string | undefined;
    const age    = this.extractBundleValue(caObject, 'ca_objects.age_group')?.age_group as string | undefined;

    const colorEntries    = this.extractBundleValues(caObject, 'ca_objects.color_location');
    const colors          = colorEntries.map(v => v.color as string).filter(Boolean);

    const materialEntries = this.extractBundleValues(caObject, 'ca_objects.material_location');
    const materials       = materialEntries.map(v => v.material as string).filter(Boolean);

    const functionEntries = this.extractBundleValues(caObject, 'ca_objects.function');
    const functions       = functionEntries.map(v => v.function as string).filter(Boolean);

    const description = this.extractTextBundle(caObject, 'ca_objects.description');

    const webNarrative       = this.extractBundleValue(caObject, 'ca_objects.web_narrative');
    const story              = webNarrative?.web_story as string | undefined;
    const tagline            = webNarrative?.pull_quote as string | undefined;
    const aestheticDesc      = webNarrative?.style_notes as string | undefined;

    return {
      id:              String(caObject.object_id?.value ?? caObject.intrinsic?.object_id ?? idno),
      slug:            this.generateSlug(idno),
      label:           name,
      name,
      decade:          this.extractDecade(earliest ?? idnoYear),
      date:            dateStr,
      era:             this.extractEra(earliest ?? idnoYear),
      work_type:       typeStr,
      type:            getGarmentTypeFromWorkType(typeStr),
      colors,
      materials,
      function:        functions.length ? functions : undefined,
      gender,
      age,
      description,
      story,
      tagline,
      aesthetic_description: aestheticDesc,
      images:          images.map(img => img.url).filter(Boolean),
      imageUrl:        images[0]?.url,
      thumbnailUrl:    images[0]?.thumbnail_url ?? images[0]?.url,
      accessionNumber: idno,
      collection:      'UVA Historic Clothing Collection',
      condition,
      provenance,
      storageLocation,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * CA stores attribute bundles as { "[attr_id]": { "en_US": { field: value } } }.
   * This picks the first entry and returns the en_US locale object.
   */
  private extractBundleValue(obj: CAObject, bundle: string): Record<string, unknown> | undefined {
    const b = obj[bundle];
    if (!b || typeof b !== 'object') return undefined;
    const first = Object.values(b)[0] as any;
    return first?.en_US ?? first;
  }

  /**
   * Returns ALL entries for a repeatable bundle as an array of locale objects.
   * Used for multi-value attributes like color_location, material_location, function.
   */
  private extractBundleValues(obj: CAObject, bundle: string): Record<string, unknown>[] {
    const b = obj[bundle];
    if (!b || typeof b !== 'object') return [];
    return Object.values(b)
      .map((entry: any) => entry?.en_US ?? entry)
      .filter((v): v is Record<string, unknown> => v != null && typeof v === 'object');
  }

  /**
   * Extracts a plain Text attribute value.
   * CA may return en_US as a bare string (Text type) rather than a keyed object (Container/List).
   */
  private extractTextBundle(obj: CAObject, bundle: string): string | undefined {
    const b = obj[bundle];
    if (!b || typeof b !== 'object') return undefined;
    const first = Object.values(b)[0] as any;
    const val = first?.en_US ?? first;
    if (typeof val === 'string') return val || undefined;
    if (val && typeof val === 'object') {
      return (Object.values(val).find(v => typeof v === 'string') as string | undefined) || undefined;
    }
    return undefined;
  }

  private generateSlug(idno: string): string {
    return String(idno).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private extractDecade(year?: string): string | undefined {
    if (!year) return undefined;
    const y = parseInt(String(year).substring(0, 4), 10);
    if (isNaN(y)) return undefined;
    return `${Math.floor(y / 10) * 10}s`;
  }

  private extractEra(year?: string): string | undefined {
    if (!year) return undefined;
    const y = parseInt(String(year).substring(0, 4), 10);
    if (isNaN(y)) return undefined;
    if (y < 1920) return 'pre-1920';
    if (y < 1950) return '1920-1950';
    if (y < 1980) return '1950-1980';
    return '1980+';
  }

  clearCache(): void {
    this.cache.clear();
    this.token = null;
    this.sessionCookie = null;
    this.tokenExpiry = 0;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let clientInstance: CollectiveAccessClient | null = null;

/**
 * Returns the singleton CA client.
 * Uses server-only CA_* env vars so credentials never reach the client bundle.
 * Throws if CA_BASE_URL / CA_USERNAME / CA_PASSWORD are not set — the caller
 * (lib/garments.ts) is responsible for checking whether CA is configured.
 */
export function getCollectiveAccessClient(
  config?: CollectiveAccessConfig,
): CollectiveAccessClient {
  if (!clientInstance) {
    const defaultConfig: CollectiveAccessConfig = {
      baseUrl:  (process.env.CA_BASE_URL  ?? '').replace(/\/$/, ''),
      username: process.env.CA_USERNAME ?? '',
      password: process.env.CA_PASSWORD ?? '',
    };
    clientInstance = new CollectiveAccessClient(config ?? defaultConfig);
  }
  return clientInstance;
}

/**
 * Returns true when the minimum required env vars are present.
 */
export function isCAConfigured(): boolean {
  return Boolean(process.env.CA_BASE_URL && process.env.CA_USERNAME && process.env.CA_PASSWORD);
}

/**
 * Fetch all CA objects by paginating through results.
 * CA's /find endpoint caps results per page, so we loop until exhausted.
 * Deduplicates by object_id to guard against CA servers that ignore the
 * `start` offset parameter (which would otherwise cause infinite duplication).
 */
// NOTE: CA's /find endpoint ignores the bundles parameter for this installation —
// it returns only object_id, idno, and display_label regardless.
// Bundle data is only available via the /item endpoint.
// FIND_BUNDLES is kept here as a best-effort request in case a future CA upgrade
// starts honouring it, but the real metadata comes from per-object /item fetches.
const FIND_BUNDLES = 'ca_objects.preferred_labels,type_id,idno';

// Full set of bundles fetched via /item for every garment.
const DETAIL_BUNDLES =
  'ca_objects.preferred_labels,type_id,idno,' +
  'ca_objects.date_range,ca_objects.condition,ca_objects.storage_location,' +
  'ca_objects.gender,ca_objects.age_group,' +
  'ca_objects.color_location,ca_objects.material_location,ca_objects.function,' +
  'ca_objects.description,ca_objects.web_narrative,ca_objects.provenance';

/**
 * Returns the CA search query to use when fetching objects.
 * When CA_SET_CODE is set, restricts results to members of that named set.
 * Curators manage set membership entirely inside the CA admin UI.
 */
function caBaseQuery(): string {
  const setCode = process.env.CA_SET_CODE?.trim();
  return setCode ? `ca_sets.set_code:${setCode}` : '*';
}

async function fetchAllObjects(client: CollectiveAccessClient): Promise<CAObject[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 50; // safety cap — 5,000 objects max
  const seen = new Set<string>();
  const all: CAObject[] = [];
  let start = 0;
  let pages = 0;
  const q = caBaseQuery();
  while (pages < MAX_PAGES) {
    const page = await client.fetchObjects({ q, limit: PAGE_SIZE, start, bundles: FIND_BUNDLES });
    if (!page.length) break;
    let newItems = 0;
    for (const obj of page) {
      const id = String(obj.object_id ?? obj.id ?? "");
      if (id && !seen.has(id)) {
        seen.add(id);
        all.push(obj);
        newItems++;
      }
    }
    // If no new unique items were returned, CA is repeating the same page — stop.
    if (newItems === 0) break;
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
    pages++;
  }
  return all;
}

/**
 * Run an array of async tasks with a max concurrency limit.
 */
async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

/**
 * Sync garments from CollectiveAccess.
 * Called by the admin /api/admin/sync route and by hydrateGarmentsFromCA().
 *
 * skipImages=true  → lightweight hydration: stubs only, type derived from idno prefix
 * skipImages=false → full sync: fetches detail + images for every object (admin sync)
 */
export async function syncGarmentsFromCA(limit = 0, skipImages = false): Promise<any[]> {
  const client = getCollectiveAccessClient();

  // Step 1: get the list of object IDs via /find (bundle data is ignored by this CA installation)
  const stubs = limit > 0
    ? await client.fetchObjects({ q: caBaseQuery(), limit, bundles: FIND_BUNDLES })
    : await fetchAllObjects(client);

  // Step 2: fetch full metadata for every object via /item (the only endpoint that returns bundles)
  const detailTasks = stubs.map(stub => () =>
    client.fetchObjectById(
      String(stub.object_id ?? stub.id),
      DETAIL_BUNDLES,
    ).then(detail => detail ?? stub)
  );
  const detailedObjects = await pLimit(detailTasks, 10);

  if (skipImages) {
    // Fast hydration: metadata only, no image requests
    return detailedObjects.map(obj => client.convertToGarment(obj, []));
  }

  // Full sync: also fetch images
  const imageTasks = detailedObjects.map(obj => () =>
    client.fetchObjectImages(String((obj as any).object_id?.value ?? (obj as any).object_id ?? (obj as any).id))
  );
  const imageResults = await pLimit(imageTasks, 10);

  return detailedObjects.map((obj, i) => client.convertToGarment(obj, imageResults[i]));
}
