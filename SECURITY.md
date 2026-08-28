# Security Overview – UVA Fashion Archive

## Current posture

- **Static/content site**: No user accounts. One admin session type (HMAC-signed cookie) for `/admin`; everything else is read-only, sourced from static JSON or CollectiveAccess.
- **Good**: `poweredByHeader: false`, `robots.txt` disallows `/admin`, export/print uses `escapeHtml`, JSON-LD uses `JSON.stringify` (no raw HTML), React's default escaping for UI, a strict nonce-based CSP + full security header set (`middleware.ts`), rate-limited/timing-safe admin auth (`lib/adminAuth.ts`), and `public_display`-gated CA sync so unpublished records aren't served publicly (`lib/collectiveAccess.ts`'s `isPublic()`).
- **Remaining risks**: CA credential exposure if `NEXT_PUBLIC_CA_*` is ever used for secrets (see below), and no network-level restriction on `/admin`/`/api/admin/*` beyond the session auth (defense-in-depth, not currently a gap on its own).

---

## Critical: CollectiveAccess credentials

**Issue**: If CA is configured with `NEXT_PUBLIC_CA_API_KEY`, `NEXT_PUBLIC_CA_USERNAME`, or `NEXT_PUBLIC_CA_PASSWORD`, those values are bundled into client JavaScript and are visible to anyone.

**Fix**: Use server-only environment variables and run CA only on the server.

- In `.env.local` (and hosting env), set:
  - `CA_BASE_URL` (or keep `NEXT_PUBLIC_CA_BASE_URL` for public base URL only)
  - `CA_API_KEY`
  - `CA_USERNAME`
  - `CA_PASSWORD`
- Do **not** use `NEXT_PUBLIC_` for API key, username, or password.
- The app uses these only in server code (root layout hydration and `/api/admin/sync`). Admin “Sync” in the UI calls the API route so the browser never has CA credentials.

---

## Admin route (`/admin`)

**Status: implemented.** `POST /api/admin/auth` verifies the password with a
timing-safe comparison and issues an HMAC-signed, `HttpOnly`/`SameSite=Strict`
session cookie (`lib/adminAuth.ts`), scoped to `/api/admin` and expiring
after 4 hours. Login attempts are rate-limited (10/15min per IP). Both
`/api/admin/sync` and the session-check endpoint verify that cookie before
doing anything. The `/admin` page shell itself is publicly reachable (it's
a client component that gates its own content), but no sensitive data is
server-rendered into it — real protection is on the API routes.

**`ADMIN_PASSWORD`**: the app now refuses to start (throws at module load)
if `NODE_ENV=production` and `ADMIN_PASSWORD` is unset, rather than
silently falling back to the dev default `"uva-fashion-admin"`. Still set
it explicitly in every production environment.

**Remaining option, not required**: network-level restriction of `/admin`
and `/api/admin/*` to internal IPs/VPN, as defense-in-depth on top of the
session auth above — not currently a gap on its own.

---

## Security headers

**Status: implemented**, in `middleware.ts` (runs on every request, not just
`next.config`, so a fresh nonce is available for the strict CSP):

- **Content-Security-Policy** — nonce-based `script-src` with
  `'strict-dynamic'`, `frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, and scoped `img-src`/`connect-src`/
  `worker-src` for CA-hosted images and Three.js workers.
- **X-Frame-Options: DENY**
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy**: camera/microphone/geolocation all denied

---

## Public-record filtering

**Status: implemented.** The CollectiveAccess profile's Web Display
Settings container was designed to gate mid-cataloguing/unpublished
records from the public site via a `public_display` field, but the sync
pipeline (`lib/collectiveAccess.ts`) previously fetched and served every CA
object regardless of that flag. `CollectiveAccessClient.isPublic()` now
filters synced objects to `public_display`-flagged ones before they reach
the cache or any API route — fail-closed, so a missing/unset value is
treated as not public.

**Open item**: the CA bundle name used for this filter
(`ca_objects.web_display_settings`) was inferred by naming-convention
analogy to the existing `ca_objects.web_narrative` bundle, not verified
against a live install. `syncGarmentsFromCA` logs a warning if the filter
unexpectedly hides every synced object — if you see that warning, confirm
the actual bundle/field name in your CA profile and adjust `isPublic()`.
`CA_SKIP_PUBLIC_DISPLAY_FILTER=true` is available as a temporary debug
escape hatch while verifying this — never leave it set in production.

---

## Data and input

- **Favorites, compares, saved searches, analytics**: Stored in `localStorage`; no server-side persistence. Not sensitive; XSS could read or tamper with it, so keeping the app XSS-safe (no unescaped user HTML) is important.
- **Search/filters**: Used in-memory or in URL params; not rendered as HTML unsafely.
- **Export/print**: Garment fields are escaped with `escapeHtml` in the PDF/print path.

---

## Dependency security

- Run `npm audit` (and fix high/critical) and keep dependencies updated.

---

## Checklist

- [ ] CA credentials use server-only env vars (`CA_*`), not `NEXT_PUBLIC_CA_*` for secrets. *(app-level check needed per deployment — code supports it correctly, but a misconfigured env is still possible)*
- [x] Admin and sync API protected (session auth + rate limiting implemented; network restriction still optional/not done).
- [x] Security headers configured (`middleware.ts`).
- [ ] No secrets in client bundle; `NEXT_PUBLIC_*` only for non-secret config (e.g. base URL). *(same as above — verify per deployment's actual env vars)*
- [x] `ADMIN_PASSWORD` required in production (app refuses to start without it).
- [x] Public/unpublished CA records filtered by `public_display` before being served. *(bundle name should be verified against your live CA install — see above)*
- [x] Debug endpoint (`/api/admin/ca-test`) with a query-param auth bypass and credential-leaking debug branches removed.
