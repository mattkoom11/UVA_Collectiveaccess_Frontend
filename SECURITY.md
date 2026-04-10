# Security Overview – UVA Fashion Archive

## Current posture

- **Static/content site**: No user accounts or server-side sessions. Data is from static JSON or CollectiveAccess (read-only).
- **Good**: `poweredByHeader: false`, `robots.txt` disallows `/admin`, export/print uses `escapeHtml`, JSON-LD uses `JSON.stringify` (no raw HTML), React’s default escaping for UI.
- **Risks**: Admin and CA credentials exposure (see below), no security headers, no auth on `/admin`.

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

**Issue**: `/admin` has no authentication. Anyone who knows the URL can open the dashboard, trigger a sync, and export analytics/garment data.

**Mitigation**:

- `robots.txt` disallows `/admin` so it is not indexed; the URL is still guessable.
- Prefer one or more of:
  - **Auth**: Add a simple auth check (e.g. NextAuth, or a shared secret checked in an API route) and protect both `/admin` and `/api/admin/sync`.
  - **Network**: Restrict `/admin` and `/api/admin/*` to internal IPs or VPN (e.g. in front proxy or middleware).
  - **Build**: Omit or gate the admin UI in production (e.g. only when `ENABLE_ADMIN=true`).

---

## Security headers (recommended)

Add in `next.config` or in middleware/edge:

- **X-Frame-Options: DENY** (or SAMEORIGIN if you need iframes)
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin** (or stricter)
- **Content-Security-Policy** – start with a strict default and relax only where needed (e.g. for 3D or external media)

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

- [ ] CA credentials use server-only env vars (`CA_*`), not `NEXT_PUBLIC_CA_*` for secrets.
- [ ] Admin and sync API protected (auth and/or network restriction).
- [ ] Security headers configured.
- [ ] No secrets in client bundle; `NEXT_PUBLIC_*` only for non-secret config (e.g. base URL).
