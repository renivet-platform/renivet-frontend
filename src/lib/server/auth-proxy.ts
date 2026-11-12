import { resolveApiBaseUrl } from "@/lib/api-url";

type AuthMethod = "GET" | "POST" | "DELETE";

const maxBodyBytes = 16 * 1024;
const safeMessages: Record<string, string> = {
  AUTH_INPUT_INVALID: "Check the information and try again.",
  AUTHENTICATION_FAILED: "We couldn't verify those details. Check them or request another code.",
  AUTH_MFA_PROOF_INVALID: "That authenticator or recovery code could not be verified. Try another code.",
  AUTH_MFA_STEP_UP_REQUIRED: "A fresh identity check is required for this action.",
  AUTH_RATE_LIMITED: "Too many attempts. Wait a little, then try again.",
  AUTH_SERVICE_UNAVAILABLE: "Authentication is temporarily unavailable. Please try again shortly.",
  AUTH_INTERNAL_ERROR: "Authentication is temporarily unavailable. Please try again shortly.",
  CSRF_VALIDATION_FAILED: "This request could not be verified. Refresh the page and try again.",
};

const safeStatuses: Record<string, number> = {
  AUTH_INPUT_INVALID: 400,
  AUTHENTICATION_FAILED: 401,
  AUTH_MFA_PROOF_INVALID: 401,
  AUTH_MFA_STEP_UP_REQUIRED: 403,
  AUTH_RATE_LIMITED: 429,
  AUTH_SERVICE_UNAVAILABLE: 503,
  AUTH_INTERNAL_ERROR: 500,
  CSRF_VALIDATION_FAILED: 403,
};

function jsonResponse(body: unknown, status: number, headers = new Headers()): Response {
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function unavailableResponse(): Response {
  return jsonResponse({
    code: "AUTH_SERVICE_UNAVAILABLE",
    message: safeMessages.AUTH_SERVICE_UNAVAILABLE,
  }, 503);
}

function isAllowedAuthOperation(path: string, method: AuthMethod): boolean {
  if (["/auth/register", "/auth/sessions", "/auth/challenges", "/auth/phone"].includes(path)) return method === "POST";
  if (path === "/auth/session") return method === "GET" || method === "DELETE";
  if (path === "/auth/mfa/step-up") return method === "POST";
  const match = /^\/auth\/challenges\/([^/]+)\/verify$/.exec(path);
  return method === "POST" && Boolean(match && isValidChallengeId(match[1]));
}

export function isValidChallengeId(value: string | undefined): boolean {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || fetchSite !== "same-origin") return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin && origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readJsonBody(request: Request): Promise<string | Response> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse({ code: "AUTH_INPUT_INVALID", message: safeMessages.AUTH_INPUT_INVALID }, 415);
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) {
    return jsonResponse({ code: "AUTH_INPUT_INVALID", message: safeMessages.AUTH_INPUT_INVALID }, 413);
  }
  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected an object.");
    return JSON.stringify(body);
  } catch {
    return jsonResponse({ code: "AUTH_INPUT_INVALID", message: safeMessages.AUTH_INPUT_INVALID }, 400);
  }
}

function safeError(status: number, body: unknown, headers = new Headers()): Response {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const rawCode = typeof record.code === "string" ? record.code : "";
  const known = Object.hasOwn(safeMessages, rawCode);
  const code = known ? rawCode : "AUTH_SERVICE_UNAVAILABLE";
  const requestId = typeof record.requestId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(record.requestId)
    ? record.requestId
    : undefined;
  const responseBody: { code: string; message: string; requestId?: string } = {
    code,
    message: safeMessages[code]!,
  };
  if (requestId) responseBody.requestId = requestId;
  return jsonResponse(responseBody, known && status === safeStatuses[code] ? status : safeStatuses[code]!, headers);
}

/** Forward one fixed auth operation from a same-origin Next.js Route Handler. */
export async function proxyAuthRequest(request: Request, path: string, method: AuthMethod): Promise<Response> {
  if (!isAllowedAuthOperation(path, method) || request.method !== method) {
    return jsonResponse({ code: "AUTH_INPUT_INVALID", message: safeMessages.AUTH_INPUT_INVALID }, 404);
  }
  if (method !== "GET" && !isSameOriginRequest(request)) {
    return jsonResponse({
      code: "CSRF_VALIDATION_FAILED",
      message: safeMessages.CSRF_VALIDATION_FAILED,
    }, 403);
  }

  let body: string | undefined;
  if (method === "POST") {
    const result = await readJsonBody(request);
    if (result instanceof Response) return result;
    body = result;
  }

  const upstreamHeaders = new Headers({ Accept: "application/json" });
  if (body !== undefined) upstreamHeaders.set("Content-Type", "application/json");
  const cookie = request.headers.get("cookie");
  if (cookie && (path === "/auth/session" || path === "/auth/sessions" || path === "/auth/phone" || path === "/auth/mfa/step-up")) {
    upstreamHeaders.set("Cookie", cookie);
  }
  if (method !== "GET") {
    upstreamHeaders.set("Origin", request.headers.get("origin")!);
    upstreamHeaders.set("Sec-Fetch-Site", "same-origin");
  }
  if (method === "DELETE" || path === "/auth/phone" || path === "/auth/mfa/step-up") {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || csrfToken.length > 512) {
      return jsonResponse({
        code: "CSRF_VALIDATION_FAILED",
        message: safeMessages.CSRF_VALIDATION_FAILED,
      }, 403);
    }
    upstreamHeaders.set("X-CSRF-Token", csrfToken);
  }

  try {
    const baseUrl = resolveApiBaseUrl(
      process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
    );
    const upstream = await fetch(`${baseUrl}${path}`, {
      method,
      headers: upstreamHeaders,
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
    });
    let responseBody: unknown;
    try {
      responseBody = await upstream.json();
    } catch {
      return unavailableResponse();
    }
    if (!upstream.ok) {
      const headers = new Headers();
      const retryAfter = upstream.headers.get("retry-after");
      if (retryAfter && /^\d{1,6}$/.test(retryAfter)) headers.set("Retry-After", retryAfter);
      return safeError(upstream.status, responseBody, headers);
    }

    const headers = new Headers();
    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      for (const value of setCookies) headers.append("Set-Cookie", value);
    } else {
      const setCookie = upstream.headers.get("set-cookie");
      if (setCookie) headers.set("Set-Cookie", setCookie);
    }
    return jsonResponse(responseBody, upstream.status, headers);
  } catch {
    return unavailableResponse();
  }
}
