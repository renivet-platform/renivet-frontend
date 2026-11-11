import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import test from "node:test";
import { isValidChallengeId, proxyAuthRequest } from "../src/lib/server/auth-proxy";

type CapturedRequest = { url?: string; headers: IncomingMessage["headers"]; body: string };

async function withUpstream(
  handler: (request: IncomingMessage, response: ServerResponse, body: string) => void,
  action: (url: string, captured: CapturedRequest[]) => Promise<void>,
) {
  const captured: CapturedRequest[] = [];
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk.toString();
    captured.push({ url: request.url, headers: request.headers, body });
    handler(request, response, body);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const previousBase = process.env.BACKEND_INTERNAL_URL;
  const previousPublicBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.BACKEND_INTERNAL_URL = `http://127.0.0.1:${address.port}/api/v1`;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    await action(`http://127.0.0.1:${address.port}/api/v1`, captured);
  } finally {
    if (previousBase === undefined) delete process.env.BACKEND_INTERNAL_URL;
    else process.env.BACKEND_INTERNAL_URL = previousBase;
    if (previousPublicBase === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previousPublicBase;
    server.closeAllConnections();
    server.close();
    await once(server, "close");
  }
}

function sameOriginHeaders(origin = "http://app.test") {
  return { Origin: origin, "Sec-Fetch-Site": "same-origin" };
}

test("auth BFF rejects missing or cross-site origin metadata before contacting NestJS", async () => {
  await withUpstream((_request, response) => response.writeHead(200).end("{}"), async (_base, captured) => {
    const crossSite = await proxyAuthRequest(
      new Request("http://app.test/api/auth/register", {
        method: "POST",
        headers: { ...sameOriginHeaders("https://evil.test"), "Content-Type": "application/json" },
        body: JSON.stringify({ email: "synthetic@example.test", password: "synthetic passphrase" }),
      }),
      "/auth/register",
      "POST",
    );
    const missingOrigin = await proxyAuthRequest(
      new Request("http://app.test/api/auth/sessions", {
        method: "POST",
        headers: { "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "synthetic@example.test", password: "synthetic passphrase" }),
      }),
      "/auth/sessions",
      "POST",
    );

    assert.equal(crossSite.status, 403);
    assert.equal(missingOrigin.status, 403);
    assert.equal(captured.length, 0);
  });
});

test("auth BFF does not expose an implemented API path through the wrong HTTP method", async () => {
  await withUpstream((_request, response) => response.writeHead(200).end("{}"), async (_base, captured) => {
    const response = await proxyAuthRequest(
      new Request("http://app.test/api/auth/register", { method: "GET" }),
      "/auth/register",
      "GET",
    );
    assert.equal(response.status, 404);
    assert.equal(captured.length, 0);
  });
});

test("auth BFF preserves the backend session cookie and forwards the existing cookie for login rotation", async () => {
  await withUpstream((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Set-Cookie", "__Host-renivet_session=synthetic-session; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax");
    response.writeHead(200).end(JSON.stringify({ authenticationState: "authenticated", user: { id: "synthetic-user" } }));
  }, async (_base, captured) => {
    const response = await proxyAuthRequest(
      new Request("http://app.test/api/auth/sessions", {
        method: "POST",
        headers: {
          ...sameOriginHeaders(),
          "Content-Type": "application/json",
          Cookie: "__Host-renivet_session=old-synthetic-session",
        },
        body: JSON.stringify({ email: "synthetic@example.test", password: "synthetic passphrase" }),
      }),
      "/auth/sessions",
      "POST",
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /^__Host-renivet_session=synthetic-session;/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(captured[0]?.url, "/api/v1/auth/sessions");
    assert.equal(captured[0]?.headers.cookie, "__Host-renivet_session=old-synthetic-session");
    assert.deepEqual(await response.json(), { authenticationState: "authenticated", user: { id: "synthetic-user" } });
  });
});

test("auth BFF performs MFA step-up only with same-origin CSRF evidence and rotates the session", async () => {
  await withUpstream((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Set-Cookie", "__Host-renivet_session=elevated-synthetic-session; Path=/; HttpOnly; Secure; SameSite=Lax");
    response.writeHead(200).end(JSON.stringify({ authenticationState: "elevated", csrfToken: "synthetic-elevated-csrf-token-000000000000000000" }));
  }, async (_base, captured) => {
    const response = await proxyAuthRequest(new Request("http://app.test/api/auth/mfa/step-up", {
      method: "POST",
      headers: {
        ...sameOriginHeaders(),
        "Content-Type": "application/json",
        "X-CSRF-Token": "synthetic-csrf-token",
        Cookie: "__Host-renivet_session=synthetic-session",
      },
      body: JSON.stringify({ code: "123456" }),
    }), "/auth/mfa/step-up", "POST");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /elevated-synthetic-session/);
    assert.equal(captured[0]?.url, "/api/v1/auth/mfa/step-up");
    assert.equal(captured[0]?.headers.cookie, "__Host-renivet_session=synthetic-session");
    assert.equal(captured[0]?.headers["x-csrf-token"], "synthetic-csrf-token");
  });
});

test("auth BFF forwards same-origin CSRF evidence and the session cookie on logout", async () => {
  await withUpstream((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Set-Cookie", "__Host-renivet_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
    response.writeHead(200).end(JSON.stringify({ status: "logged_out" }));
  }, async (_base, captured) => {
    const response = await proxyAuthRequest(
      new Request("http://app.test/api/auth/session", {
        method: "DELETE",
        headers: {
          ...sameOriginHeaders(),
          "X-CSRF-Token": "synthetic-csrf-token",
          Cookie: "__Host-renivet_session=synthetic-session",
        },
      }),
      "/auth/session",
      "DELETE",
    );

    assert.equal(response.status, 200);
    assert.equal(captured[0]?.url, "/api/v1/auth/session");
    assert.equal(captured[0]?.headers.cookie, "__Host-renivet_session=synthetic-session");
    assert.equal(captured[0]?.headers.origin, "http://app.test");
    assert.equal(captured[0]?.headers["sec-fetch-site"], "same-origin");
    assert.equal(captured[0]?.headers["x-csrf-token"], "synthetic-csrf-token");
    assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/);
  });
});

test("auth BFF rejects cross-site or missing-CSRF logout before contacting NestJS", async () => {
  await withUpstream((_request, response) => response.writeHead(200).end(JSON.stringify({ status: "logged_out" })), async (_base, captured) => {
    const crossSite = await proxyAuthRequest(new Request("http://app.test/api/auth/session", {
      method: "DELETE",
      headers: { ...sameOriginHeaders("https://evil.test"), "X-CSRF-Token": "synthetic-csrf-token" },
    }), "/auth/session", "DELETE");
    const missingToken = await proxyAuthRequest(new Request("http://app.test/api/auth/session", {
      method: "DELETE",
      headers: sameOriginHeaders(),
    }), "/auth/session", "DELETE");
    assert.equal(crossSite.status, 403);
    assert.equal(missingToken.status, 403);
    assert.equal(captured.length, 0);
  });
});

test("auth BFF replaces upstream error details with the documented safe envelope", async () => {
  await withUpstream((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.writeHead(401).end(JSON.stringify({ code: "SECRET_DATABASE_DETAIL", message: "password/email leaked", requestId: "synthetic-request" }));
  }, async () => {
    const response = await proxyAuthRequest(
      new Request("http://app.test/api/auth/sessions", {
        method: "POST",
        headers: { ...sameOriginHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: "synthetic@example.test", password: "synthetic passphrase" }),
      }),
      "/auth/sessions",
      "POST",
    );
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      code: "AUTH_SERVICE_UNAVAILABLE",
      message: "Authentication is temporarily unavailable. Please try again shortly.",
      requestId: "synthetic-request",
    });
    assert.equal(JSON.stringify(body).includes("password/email leaked"), false);
  });
});

test("auth BFF maps an upstream timeout to a safe unavailable response", { timeout: 10_000 }, async () => {
  await withUpstream(() => undefined, async () => {
    const response = await proxyAuthRequest(
      new Request("http://app.test/api/auth/session"),
      "/auth/session",
      "GET",
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      code: "AUTH_SERVICE_UNAVAILABLE",
      message: "Authentication is temporarily unavailable. Please try again shortly.",
    });
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});

test("auth BFF rejects malformed challenge identifiers before building upstream paths", () => {
  assert.equal(isValidChallengeId("37a7d0bf-8414-4f75-bd11-311c7a442d84"), true);
  assert.equal(isValidChallengeId("../../session"), false);
  assert.equal(isValidChallengeId("37a7d0bf-8414-4f75-bd11-311c7a442d8"), false);
});
