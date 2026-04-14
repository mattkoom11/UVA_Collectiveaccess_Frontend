import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";

const CA_BASE = (process.env.CA_BASE_URL ?? "http://localhost/ca").replace(/\/$/, "");
const CA_ROOT = new URL(CA_BASE).origin; // e.g. http://localhost
const CA_USER = process.env.CA_USERNAME ?? "administrator";
const CA_PASS = process.env.CA_PASSWORD ?? "";

function extractCookie(setCookie: string): string {
  return setCookie.split(";")[0]; // "name=value"
}

async function caLogin(): Promise<{ cookie: string; debug: any }> {
  // Step 1: GET login page to grab session cookie + CSRF token + form_timestamp
  const loginPageUrl = `${CA_BASE}/index.php/LoginReg/loginForm`;
  const pageRes = await fetch(loginPageUrl, { redirect: "follow" });
  const pageHtml = await pageRes.text();


  // Node 18+ returns array of all Set-Cookie headers
  const pageSetCookies: string[] = (pageRes.headers as any).getSetCookie?.() ??
    (pageRes.headers.get("set-cookie") ? [pageRes.headers.get("set-cookie")!] : []);
  const pageCookieHeader = pageSetCookies.map(c => c.split(";")[0]).join("; ");

  const csrfToken     = pageHtml.match(/name=.csrfToken.\s+value=.([^'"]+)/)?.[1] ?? "";
  const formTimestamp = pageHtml.match(/name=.form_timestamp.\s+value=.([^'"]+)/)?.[1] ?? "";

  // Step 2: POST credentials to DoLogin
  const doLoginUrl = `${CA_BASE}/index.php/system/Auth/DoLogin`;
  const body = new URLSearchParams({
    _formName:      "login",
    form_timestamp: formTimestamp,
    csrfToken,
    username:       CA_USER,
    password:       CA_PASS,
    redirect:       "",
    local:          "0",
  });

  const loginRes = await fetch(doLoginUrl, {
    method:   "POST",
    headers:  {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(pageCookieHeader ? { Cookie: pageCookieHeader } : {}),
    },
    body:     body.toString(),
    redirect: "manual",
  });

  const loginSetCookies: string[] = (loginRes.headers as any).getSetCookie?.() ??
    (loginRes.headers.get("set-cookie") ? [loginRes.headers.get("set-cookie")!] : []);
  const location  = loginRes.headers.get("location") ?? "";

  // After successful login CA deletes the old session and issues a new one.
  // Find the last non-deleted collectiveaccess cookie from the login response.
  const newSessionCookie = loginSetCookies
    .map(c => c.split(";")[0])
    .filter(c => c.startsWith("collectiveaccess=") && !c.includes("deleted"))
    .at(-1) ?? "";

  const allCookies = [...pageSetCookies, ...loginSetCookies].map(c => c.split(";")[0]).join("; ");
  const cookie = newSessionCookie;

  return {
    cookie,
    debug: {
      loginPageUrl, doLoginUrl,
      pageSetCookies, pageCookieHeader,
      csrfToken: csrfToken.slice(0, 12) + "…", formTimestamp,
      loginStatus: loginRes.status, location,
      loginSetCookies, allCookies, cookie,
    },
  };
}

async function caGetAuthToken(cookie: string): Promise<{ authToken?: string; raw: any; status: number }> {
  const url = `${CA_BASE}/service.php/json/auth/login`;
  const basicAuth = Buffer.from(`${CA_USER}:${CA_PASS}`).toString('base64');
  const res = await fetch(url, {
    headers: {
      Cookie: cookie,
      Authorization: `Basic ${basicAuth}`,
    },
  });
  const text = await res.text();
  let raw: any;
  try { raw = JSON.parse(text); } catch { raw = text.slice(0, 500) || "(empty)"; }
  return { authToken: raw?.authToken, raw, status: res.status };
}

async function caFetchObjects(authToken: string, cookie: string): Promise<any> {
  const url = `${CA_BASE}/service.php/json/find/ca_objects?q=*&limit=2&authToken=${encodeURIComponent(authToken)}`;
  const res = await fetch(url, { headers: { Cookie: cookie } });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text.slice(0, 500); }
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Debug: show raw login page HTML
  if (req.nextUrl.searchParams.get("debug") === "page") {
    const res = await fetch(`${CA_BASE}/index.php/LoginReg/loginForm`, { redirect: "follow" });
    const html = await res.text();
    const inputs = [...html.matchAll(/<input([^>]+)>/gi)].map(m => m[1]);
    const formAction = html.match(/<form[^>]+action=["']([^"']+)["']/i)?.[1];
    const cookies = (res.headers as any).getSetCookie?.() ?? [];
    return NextResponse.json({ status: res.status, formAction, inputs, cookies, html: html.slice(0, 2000) });
  }

  try {
    const { cookie, debug: loginDebug } = await caLogin();
    if (!cookie) {
      return NextResponse.json({ ok: false, step: "login", debug: loginDebug });
    }

    const { authToken, raw: authRaw, status: authStatus } = await caGetAuthToken(cookie);
    if (!authToken) {
      return NextResponse.json({ ok: false, step: "authToken", debug: loginDebug, authStatus, authRaw });
    }

    // Debug: show raw representations response for a specific idno
    if (req.nextUrl.searchParams.get("debug") === "representations") {
      const idno = req.nextUrl.searchParams.get("idno") ?? "";
      // First find the object_id
      const findUrl = `${CA_BASE}/service.php/json/find/ca_objects?q=${encodeURIComponent(idno)}&limit=1&authToken=${encodeURIComponent(authToken)}`;
      const findRes = await fetch(findUrl, { headers: { Cookie: cookie } });
      const findData = await findRes.json();
      const objectId = findData?.results?.[0]?.object_id ?? findData?.results?.[0]?.id;
      if (!objectId) {
        return NextResponse.json({ ok: false, error: "Object not found", findData });
      }
      // Fetch representations bundle
      const repUrl = `${CA_BASE}/service.php/json/item/ca_objects/id/${objectId}?bundles=ca_objects.representations&authToken=${encodeURIComponent(authToken)}`;
      const repRes = await fetch(repUrl, { headers: { Cookie: cookie } });
      const repData = await repRes.json();
      return NextResponse.json({ ok: true, objectId, idno, repData });
    }

    // Debug: show raw /find results WITH the hydration bundles so we can inspect
    // what CA actually returns for date_range, gender, condition, color_location, etc.
    if (req.nextUrl.searchParams.get("debug") === "raw-bundles") {
      const bundles =
        'ca_objects.preferred_labels,type_id,idno,' +
        'ca_objects.date_range,ca_objects.condition,ca_objects.storage_location,' +
        'ca_objects.gender,ca_objects.age_group,' +
        'ca_objects.color_location,ca_objects.material_location,ca_objects.function,' +
        'ca_objects.description,ca_objects.web_narrative,ca_objects.provenance';
      const basicAuth = Buffer.from(`${CA_USER}:${CA_PASS}`).toString('base64');
      const url = `${CA_BASE}/service.php/json/find/ca_objects?q=*&limit=2&bundles=${encodeURIComponent(bundles)}&authToken=${encodeURIComponent(authToken)}`;
      const res = await fetch(url, {
        headers: { Cookie: cookie, Authorization: `Basic ${basicAuth}` },
      });
      const raw = await res.json();
      return NextResponse.json({ ok: true, url, raw });
    }

    // Debug: show raw /item response for a single object WITH bundles
    if (req.nextUrl.searchParams.get("debug") === "raw-item") {
      const bundles =
        'ca_objects.preferred_labels,type_id,idno,' +
        'ca_objects.date_range,ca_objects.condition,' +
        'ca_objects.gender,ca_objects.color_location,ca_objects.material_location';
      const basicAuth = Buffer.from(`${CA_USER}:${CA_PASS}`).toString('base64');
      // First get any object id
      const findUrl = `${CA_BASE}/service.php/json/find/ca_objects?q=*&limit=1&authToken=${encodeURIComponent(authToken)}`;
      const findRes = await fetch(findUrl, { headers: { Cookie: cookie, Authorization: `Basic ${basicAuth}` } });
      const findData = await findRes.json();
      const objectId = findData?.results?.[0]?.object_id?.value ?? findData?.results?.[0]?.object_id;
      if (!objectId) return NextResponse.json({ ok: false, error: "No objects found", findData });
      const itemUrl = `${CA_BASE}/service.php/json/item/ca_objects/id/${objectId}?bundles=${encodeURIComponent(bundles)}&authToken=${encodeURIComponent(authToken)}`;
      const itemRes = await fetch(itemUrl, {
        headers: { Cookie: cookie, Authorization: `Basic ${basicAuth}` },
      });
      const raw = await itemRes.json();
      return NextResponse.json({ ok: true, objectId, url: itemUrl, raw });
    }

    const objects = await caFetchObjects(authToken, cookie);
    return NextResponse.json({ ok: true, authToken: authToken.slice(0, 12) + "…", objects, loginDebug });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? String(err) }, { status: 500 });
  }
}
