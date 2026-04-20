# Tech Debt — Track 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply three targeted fixes to security headers, materials normalization, and CA hydration blocking in the UVA Historic Fashion Archive.

**Architecture:** All changes are isolated to single files — `middleware.ts` for the missing `Permissions-Policy` header, and `app/layout.tsx` to make CA hydration non-blocking. Materials normalization is already complete (confirmed in code).

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Next.js middleware

---

## Pre-flight: Actual Code State

Before implementing, note what is already done:
- `middleware.ts` already sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. Only `Permissions-Policy` is missing.
- `normalizeMaterials()` is already called in all three garment data paths in `lib/garments.ts`. `materials` is already typed `string[]` in `types/garment.ts`. **No work needed here.**
- `app/layout.tsx` line 44 still `await`s `hydrateGarmentsFromCA()`. This needs to change.

---

## Task 1: Add Permissions-Policy Header

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Open middleware.ts and locate the response headers block**

The block starts at line 57:
```ts
response.headers.set('Content-Security-Policy', csp);
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

- [ ] **Step 2: Add the Permissions-Policy header after the existing four**

```ts
response.headers.set('Content-Security-Policy', csp);
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

- [ ] **Step 3: Verify the header is present**

Run the dev server and check the header:
```bash
cd "c:/UVA Historic Fashion/UVA_Collectiveaccess_Frontend"
npm run dev &
sleep 5
curl -sI http://localhost:3000 | grep -i permissions
```

Expected output:
```
permissions-policy: camera=(), microphone=(), geolocation=()
```

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "security: add Permissions-Policy header to middleware"
```

---

## Task 2: Make CA Hydration Non-Blocking

**Files:**
- Modify: `app/layout.tsx:44`

- [ ] **Step 1: Open app/layout.tsx and locate line 44**

Current code:
```ts
await hydrateGarmentsFromCA();
```

- [ ] **Step 2: Remove the await**

```ts
void hydrateGarmentsFromCA();
```

The `void` operator is intentional — it explicitly signals that the returned Promise is deliberately not awaited, suppressing the TypeScript `no-floating-promises` lint rule.

- [ ] **Step 3: Verify the change doesn't break the page**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Verify CA data still loads**

Start dev server and load the collection page:
```bash
npm run dev
```
Open `http://localhost:3000/collection` — garments should appear (from disk cache or static fallback). Check terminal for `[CA] Hydrating garments...` log appearing after the page response, not before.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "perf: make CA hydration non-blocking to prevent render delay"
```

---

## Materials Normalization — Already Done

No action required. Confirmed in code:
- `lib/garments.ts` calls `normalizeMaterials(g.materials)` in `hydrateGarmentsFromCA()` (line 82), `setCAGarmentsCache()` (line 99), and `getAllGarments()` (line 111).
- `types/garment.ts` types `materials` as `string[]`.
