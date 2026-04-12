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
  } = {}): Promise<CAObject[]> {
    const data = await this.get<{ ok: number; results?: CAObject[] }>('/find/ca_objects', {
      q: params.q ?? '*',
      ...(params.type_id ? { type_id: params.type_id } : {}),
      ...(params.limit  !== undefined ? { limit: params.limit }   : {}),
      ...(params.start  !== undefined ? { start: params.start }   : {}),
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
    const earliest   = dateRange?.earliest_date as string | undefined;
    const latest     = dateRange?.latest_date   as string | undefined;
    const dateStr    = earliest && latest && earliest !== latest
      ? `${earliest}–${latest}`
      : (earliest ?? latest);

    // Infer year from idno (e.g. "DR.1965.001" → 1965) as era fallback when
    // no date_range is present. Only use if year < 2010 to avoid treating
    // acquisition years (e.g. ACS.2023.974) as manufacture dates.
    const idnoYear = (() => {
      const parts = String(idno).split('.');
      for (const p of parts) {
        const y = parseInt(p, 10);
        if (p.length === 4 && y >= 1800 && y < 2010) return String(y);
      }
      return undefined;
    })();

    const condition       = this.extractBundleValue(caObject, 'ca_objects.condition')?.condition as string | undefined;
    const provenance      = this.extractBundleValue(caObject, 'ca_objects.provenance')?.provenance as string | undefined;
    const storageLocation = this.extractBundleValue(caObject, 'ca_objects.storage_location')?.storage_location as string | undefined;

    return {
      id:              String(caObject.object_id?.value ?? caObject.intrinsic?.object_id ?? idno),
      slug:            this.generateSlug(idno),
      label:           name,
      name,
      decade:          this.extractDecade(earliest ?? idnoYear),
      date:            dateStr,   // manufacture date from CA date_range only; undefined until admin sync
      era:             this.extractEra(earliest ?? idnoYear),
      work_type:       typeStr,
      type:            getGarmentTypeFromWorkType(typeStr),
      colors:          [],   // not present in this CA config
      materials:       [],   // not present in this CA config
      description:     undefined,
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
async function fetchAllObjects(client: CollectiveAccessClient): Promise<CAObject[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 50; // safety cap — 5,000 objects max
  const seen = new Set<string>();
  const all: CAObject[] = [];
  let start = 0;
  let pages = 0;
  while (pages < MAX_PAGES) {
    const page = await client.fetchObjects({ limit: PAGE_SIZE, start });
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

  const stubs = limit > 0
    ? await client.fetchObjects({ limit })
    : await fetchAllObjects(client);

  if (skipImages) {
    // Fast path: derive type/era from idno prefix, no extra requests
    return stubs.map(stub => client.convertToGarment(stub, []));
  }

  // Full sync: fetch detail (type_id, dates) + images concurrently
  const detailTasks = stubs.map(stub => () =>
    client.fetchObjectById(
      String(stub.object_id ?? stub.id),
      'ca_objects.preferred_labels,type_id,idno,ca_objects.date_range,ca_objects.condition,ca_objects.provenance,ca_objects.storage_location'
    ).then(detail => detail ?? stub)
  );
  const detailedObjects = await pLimit(detailTasks, 10);

  const imageTasks = detailedObjects.map(obj => () =>
    client.fetchObjectImages(String((obj as any).object_id?.value ?? (obj as any).object_id ?? (obj as any).id))
  );
  const imageResults = await pLimit(imageTasks, 10);

  return detailedObjects.map((obj, i) => client.convertToGarment(obj, imageResults[i]));
}
