import { resolveApiBaseUrl } from "@/lib/api-url";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBodyBytes = 64 * 1024;
const maxResponseBytes = 1024 * 1024;
const queryKeys = new Set(["cursor", "limit", "categoryId", "reviewState", "visibility"]);

export function w2PortalEnabled(value = process.env.RENIVET_W2_PORTAL_ENABLED): boolean {
  return value === "true";
}

export type W2Method = "GET" | "POST" | "PATCH" | "DELETE";

/** Exact allowlist for the registered catalog APIs used by the first seller slice. */
export function resolveW2BackendPath(segments: string[], method: string): string | null {
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) return null;
  const [root, brandId, resource, resourceId, subresource] = segments;
  if (root !== "brands" || !brandId || !uuid.test(brandId)) return null;
  if (resource === "media" && segments.length === 3 && method === "POST") return `/api/v1/brands/${brandId}/media/uploads`;
  if (resource === "media" && resourceId && uuid.test(resourceId) && subresource === "complete" && segments.length === 5 && method === "POST") {
    return `/api/v1/brands/${brandId}/media/${resourceId}/complete`;
  }
  if (resource === "media" && resourceId && uuid.test(resourceId) && segments.length === 4 && method === "GET") {
    return `/api/v1/brands/${brandId}/media/${resourceId}`;
  }
  if (resource === "categories" && segments.length === 3 && method === "GET") return `/api/v1/brands/${brandId}/categories`;
  if (resource === "categories" && resourceId && uuid.test(resourceId) && subresource === "attributes" && segments.length === 4 && method === "GET") {
    return `/api/v1/brands/${brandId}/categories/${resourceId}/attributes`;
  }
  if (resource === "categories" && resourceId && uuid.test(resourceId) && subresource === "schema-versions"
    && segments[5] && /^\d{1,6}$/.test(segments[5]) && segments.length === 6 && method === "GET") {
    return `/api/v1/brands/${brandId}/categories/${resourceId}/schema-versions/${segments[5]}`;
  }
  if (resource === "products" && segments.length === 3 && (method === "GET" || method === "POST")) return `/api/v1/brands/${brandId}/products`;
  if (resource === "products" && resourceId && uuid.test(resourceId) && segments.length === 4 && (method === "GET" || method === "PATCH")) {
    return `/api/v1/brands/${brandId}/products/${resourceId}`;
  }
  if (resource === "products" && resourceId && uuid.test(resourceId) && subresource === "variants" && segments.length === 5 && method === "POST") {
    return `/api/v1/brands/${brandId}/products/${resourceId}/variants`;
  }
  if (resource === "products" && resourceId && uuid.test(resourceId) && subresource === "variants" && segments[5] && uuid.test(segments[5]) && segments.length === 6 && (method === "PATCH" || method === "DELETE")) {
    return `/api/v1/brands/${brandId}/products/${resourceId}/variants/${segments[5]}`;
  }
  if (resource === "products" && resourceId && uuid.test(resourceId) && subresource === "claims" && segments.length === 5 && (method === "GET" || method === "POST")) {
    return `/api/v1/brands/${brandId}/products/${resourceId}/claims`;
  }
  if (resource === "products" && resourceId && uuid.test(resourceId) && subresource === "media" && segments.length === 5 && method === "POST") {
    return `/api/v1/brands/${brandId}/products/${resourceId}/media`;
  }
  if (resource === "products" && resourceId && uuid.test(resourceId) && subresource === "media" && segments[5] && uuid.test(segments[5]) && segments.length === 6 && (method === "PATCH" || method === "DELETE")) {
    return `/api/v1/brands/${brandId}/products/${resourceId}/media/${segments[5]}`;
  }
  if (resource === "variants" && resourceId && uuid.test(resourceId) && segments[4] === "prices" && segments.length === 5 && (method === "GET" || method === "PATCH")) {
    return `/api/v1/brands/${brandId}/variants/${resourceId}/prices`;
  }
  if (resource === "product-imports" && segments.length === 3 && method === "POST") return `/api/v1/brands/${brandId}/product-imports`;
  if (resource === "product-imports" && resourceId === "uploads" && segments.length === 4 && method === "POST") return `/api/v1/brands/${brandId}/product-imports/uploads`;
  if (resource === "product-imports" && resourceId && uuid.test(resourceId) && segments.length === 5) {
    if (subresource === "mapping" && method === "POST") return `/api/v1/brands/${brandId}/product-imports/${resourceId}/mapping`;
    if (subresource === "preview" && method === "GET") return `/api/v1/brands/${brandId}/product-imports/${resourceId}/preview`;
    if (subresource === "confirm" && method === "POST") return `/api/v1/brands/${brandId}/product-imports/${resourceId}/confirm`;
    if (subresource === "results" && method === "GET") return `/api/v1/brands/${brandId}/product-imports/${resourceId}/results`;
    if (subresource === "retry" && method === "POST") return `/api/v1/brands/${brandId}/product-imports/${resourceId}/retry`;
  }
  return null;
}

export function resolveW2TargetUrl(apiBaseUrl: string | undefined, backendPath: string): URL {
  const apiRoot = `${resolveApiBaseUrl(apiBaseUrl)}/`;
  return new URL(backendPath.replace(/^\/api\/v1\/?/, ""), apiRoot);
}

function jsonResponse(body: unknown, status: number, headers = new Headers()): Response {
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("__Host-renivet_session="));
  if (!pair || pair.length > 550 || /[\r\n]/.test(pair)) return null;
  const value = pair.slice("__Host-renivet_session=".length);
  return value.length > 0 && !/[;\s]/.test(value) ? pair : null;
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") !== "same-origin") return false;
  try { return new URL(origin).origin === new URL(request.url).origin && origin === new URL(request.url).origin; }
  catch { return false; }
}

async function readJsonBody(request: Request): Promise<string | Response> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 415);
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is too large." }, 413);
  const reader = request.body?.getReader();
  if (!reader) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400);
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBodyBytes) {
      await reader.cancel();
      return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is too large." }, 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let raw: string;
  try { raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400); }
  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected JSON object.");
    return JSON.stringify(body);
  } catch { return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400); }
}

export async function proxyW2Request(request: Request, segments: string[]): Promise<Response> {
  if (!w2PortalEnabled()) return jsonResponse({ code: "W2_ROUTE_UNAVAILABLE", message: "This workspace operation is unavailable." }, 404);
  const method = request.method;
  const backendPath = resolveW2BackendPath(segments, method);
  if (!backendPath) return jsonResponse({ code: "W2_ROUTE_UNAVAILABLE", message: "This workspace operation is unavailable." }, 404);

  const targetUrl = resolveW2TargetUrl(process.env.RENIVET_API_BASE_URL, backendPath);
  const seenQuery = new Set<string>();
  for (const [key, value] of new URL(request.url).searchParams) {
    if (!queryKeys.has(key) || seenQuery.has(key) || value.length > 2048) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The query is invalid." }, 400);
    seenQuery.add(key);
    if (key === "limit" && (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 100)) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The query is invalid." }, 400);
    if (key === "categoryId" && !uuid.test(value)) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The query is invalid." }, 400);
    if (key === "reviewState" && !["NOT_SUBMITTED", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "SUPERSEDED"].includes(value)) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The query is invalid." }, 400);
    if (key === "visibility" && !["PUBLIC", "PRIVATE", "RESTRICTED"].includes(value)) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The query is invalid." }, 400);
    targetUrl.searchParams.append(key, value);
  }

  let body: string | undefined;
  if (method !== "GET") {
    if (!isSameOriginMutation(request)) return jsonResponse({ code: "CSRF_VALIDATION_FAILED", message: "This request could not be verified." }, 403);
    const csrf = request.headers.get("x-csrf-token");
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!csrf || csrf.length > 512 || !idempotencyKey || !/^[A-Za-z0-9._:-]{1,120}$/.test(idempotencyKey)) {
      return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400);
    }
    const requiresIfMatch = method === "PATCH" || method === "DELETE"
      || (method === "POST" && /\/product-imports\/[0-9a-f-]{36}\/(?:mapping|confirm|retry)$/.test(backendPath));
    if (requiresIfMatch && !request.headers.get("if-match")) return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400);
    if (request.body !== null) {
      const result = await readJsonBody(request);
      if (result instanceof Response) return result;
      body = result;
    } else if (method !== "DELETE") {
      return jsonResponse({ code: "W2_REQUEST_INVALID", message: "The request is invalid." }, 400);
    }
  }

  const upstreamHeaders = new Headers({ Accept: "application/json" });
  const cookie = readSessionCookie(request.headers.get("cookie"));
  if (cookie) upstreamHeaders.set("Cookie", cookie);
  if (body !== undefined) upstreamHeaders.set("Content-Type", "application/json");
  for (const name of ["origin", "sec-fetch-site", "x-csrf-token", "idempotency-key", "if-match", "if-none-match"]) {
    const value = request.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }

  try {
    const upstream = await fetch(targetUrl, { method, headers: upstreamHeaders, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12_000) });
    const headers = new Headers();
    for (const name of ["etag", "cache-control"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (upstream.status === 304 || upstream.status === 204) return new Response(null, { status: upstream.status, headers });
    const raw = await upstream.text();
    if (new TextEncoder().encode(raw).byteLength > maxResponseBytes) {
      return jsonResponse({ code: "W2_RESPONSE_INVALID", message: "The workspace response is too large." }, 502);
    }
    try { return jsonResponse(JSON.parse(raw), upstream.status, headers); }
    catch { return jsonResponse({ code: "W2_SERVICE_UNAVAILABLE", message: "The workspace service is temporarily unavailable." }, 503); }
  } catch {
    return jsonResponse({ code: "W2_SERVICE_UNAVAILABLE", message: "The workspace service is temporarily unavailable." }, 503);
  }
}
