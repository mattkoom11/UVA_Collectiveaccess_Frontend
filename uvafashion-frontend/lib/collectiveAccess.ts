/**
 * CollectiveAccess Web Service API Client
 * Uses session token auth via /service.php endpoints.
 * Docs: https://docs.collectiveaccess.org/wiki/Web_Service_API
 */

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
    const origin = new URL(this.config.baseUrl).origin;
    const loginPageUrl = `${origin}/index.php/LoginReg/loginForm`;

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
    const doLoginUrl = `${origin}/index.php/system/Auth/DoLogin`;
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

      const reps: any[] = data?.representations ?? data?.ca_objects_representations ?? [];
      return reps.map((r: any) => ({
        media_id: r.representation_id ?? r.media_id ?? '',
        url: r.urls?.original ?? r.url ?? '',
        thumbnail_url: r.urls?.thumbnail ?? r.thumbnail_url ?? '',
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
  convertToGarment(caObject: CAObject, images: CAImage[] = []): any {
    const idno   = caObject.intrinsic?.idno ?? caObject.idno?.value ?? caObject.idno ?? '';
    const name   = caObject.preferred_labels?.en_US?.[0]?.name ?? idno;
    const typeDisplay = caObject.type_id?.display_text?.en_US ?? caObject.intrinsic?.type_id;

    const dateRange  = this.extractBundleValue(caObject, 'ca_objects.date_range');
    const earliest   = dateRange?.earliest_date as string | undefined;
    const latest     = dateRange?.latest_date   as string | undefined;
    const dateStr    = earliest && latest && earliest !== latest
      ? `${earliest}–${latest}`
      : (earliest ?? latest);

    const condition       = this.extractBundleValue(caObject, 'ca_objects.condition')?.condition as string | undefined;
    const provenance      = this.extractBundleValue(caObject, 'ca_objects.provenance')?.provenance as string | undefined;
    const storageLocation = this.extractBundleValue(caObject, 'ca_objects.storage_location')?.storage_location as string | undefined;

    return {
      id:              caObject.object_id?.value ?? caObject.intrinsic?.object_id ?? idno,
      slug:            this.generateSlug(idno),
      label:           name,
      name,
      decade:          this.extractDecade(earliest),
      date:            dateStr,
      era:             this.extractEra(earliest),
      work_type:       typeDisplay,
      type:            typeDisplay,
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
 * Sync garments from CollectiveAccess.
 * Called by the admin /api/admin/sync route and by hydrateGarmentsFromCA().
 */
export async function syncGarmentsFromCA(limit = 100): Promise<any[]> {
  const client = getCollectiveAccessClient();
  const objects = await client.fetchObjects({ limit });

  const garments = await Promise.all(
    objects.map(async obj => {
      const images = await client.fetchObjectImages(obj.object_id);
      return client.convertToGarment(obj, images);
    }),
  );

  return garments;
}
