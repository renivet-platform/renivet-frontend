import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSameOriginMutation, proxyW2Request, resolveW2BackendPath, resolveW2TargetUrl, w2PortalEnabled } from "../src/lib/server/w2-proxy";

const brandId = "13b5bc42-ea79-4610-bd1f-f2553d67df30";
const productId = "d4a3bd3b-5b71-49e1-87fc-3f4f9b8c8b0d";

describe("W2 API proxy allowlist", () => {
  it("keeps W2 routes unavailable until the release gate is explicitly enabled", () => {
    assert.equal(w2PortalEnabled(undefined), false);
    assert.equal(w2PortalEnabled("false"), false);
    assert.equal(w2PortalEnabled("true"), true);
  });

  it("fails closed before contacting the backend when the portal gate is unset", async () => {
    const previous = process.env.RENIVET_W2_PORTAL_ENABLED;
    delete process.env.RENIVET_W2_PORTAL_ENABLED;
    try {
      const response = await proxyW2Request(new Request("https://seller.example/api/w2"), ["brands", brandId, "products"]);
      assert.equal(response.status, 404);
    } finally {
      if (previous === undefined) delete process.env.RENIVET_W2_PORTAL_ENABLED;
      else process.env.RENIVET_W2_PORTAL_ENABLED = previous;
    }
  });

  it("maps only the registered category and product draft routes", () => {
    assert.equal(resolveW2BackendPath(["admin", "catalog", "categories", productId, "activate"], "POST"), `/api/v1/admin/catalog/categories/${productId}/activate`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "categories"], "GET"), `/api/v1/brands/${brandId}/categories`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "categories", productId, "schema-versions", "3"], "GET"), `/api/v1/brands/${brandId}/categories/${productId}/schema-versions/3`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products"], "GET"), `/api/v1/brands/${brandId}/products`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products"], "POST"), `/api/v1/brands/${brandId}/products`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", productId], "PATCH"), `/api/v1/brands/${brandId}/products/${productId}`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", productId, "variants"], "POST"), `/api/v1/brands/${brandId}/products/${productId}/variants`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", productId, "claims"], "GET"), `/api/v1/brands/${brandId}/products/${productId}/claims`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "variants", productId, "prices"], "PATCH"), `/api/v1/brands/${brandId}/variants/${productId}/prices`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "media"], "POST"), `/api/v1/brands/${brandId}/media/uploads`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "product-imports", "uploads"], "POST"), `/api/v1/brands/${brandId}/product-imports/uploads`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "product-imports"], "POST"), `/api/v1/brands/${brandId}/product-imports`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "product-imports", productId, "preview"], "GET"), `/api/v1/brands/${brandId}/product-imports/${productId}/preview`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "product-imports", productId, "confirm"], "POST"), `/api/v1/brands/${brandId}/product-imports/${productId}/confirm`);
  });

  it("rejects unknown methods, malformed identifiers, path traversal and unregistered operations", () => {
    assert.equal(resolveW2BackendPath(["brands", brandId, "products"], "DELETE"), null);
    assert.equal(resolveW2BackendPath(["brands", "not-a-uuid", "products"], "GET"), null);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", "..", "admin"], "GET"), null);
    assert.equal(resolveW2BackendPath(["brands", brandId, "inventory", "balances"], "GET"), `/api/v1/brands/${brandId}/inventory/balances`);
  });

  it("keeps the configured API prefix exactly once", () => {
    assert.equal(resolveW2TargetUrl("http://localhost:4000/api/v1", `/api/v1/brands/${brandId}/products`).toString(),
      `http://localhost:4000/api/v1/brands/${brandId}/products`);
  });

  it("requires an exact same-origin mutation request", () => {
    const sameOrigin = new Request("https://seller.example/api/w2", { headers: { origin: "https://seller.example", "sec-fetch-site": "same-origin" } });
    const crossOrigin = new Request("https://seller.example/api/w2", { headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" } });
    assert.equal(isSameOriginMutation(sameOrigin), true);
    assert.equal(isSameOriginMutation(crossOrigin), false);
  });
});

describe("admin review proxy allowlist", () => {
  it("maps only the review queues, details and decision routes", () => {
    for (const queue of ["taxonomy", "quality", "pricing", "claims", "publishing"]) {
      assert.equal(resolveW2BackendPath(["admin", "reviews", queue], "GET"), `/api/v1/admin/reviews/${queue}`);
      assert.equal(resolveW2BackendPath(["admin", "reviews", queue, productId], "GET"), `/api/v1/admin/reviews/${queue}/${productId}`);
    }
    assert.equal(resolveW2BackendPath(["admin", "brands", brandId, "variant-prices", productId, "decision"], "POST"), `/api/v1/admin/brands/${brandId}/variant-prices/${productId}/decision`);
    assert.equal(resolveW2BackendPath(["admin", "brands", brandId, "claims", productId, "decision"], "POST"), `/api/v1/admin/brands/${brandId}/claims/${productId}/decision`);
    assert.equal(resolveW2BackendPath(["admin", "brands", brandId, "products", productId, "review"], "POST"), `/api/v1/admin/brands/${brandId}/products/${productId}/review`);
    assert.equal(resolveW2BackendPath(["admin", "brands", brandId, "products", productId, "publication", "publish"], "POST"), `/api/v1/admin/brands/${brandId}/products/${productId}/publication/publish`);
    assert.equal(resolveW2BackendPath(["admin", "reviews", "other"], "GET"), null);
    assert.equal(resolveW2BackendPath(["admin", "reviews", "quality", ".."], "GET"), null);
  });
});

describe("seller product submission proxy", () => {
  it("requires an exact same-origin mutation, idempotency key, CSRF token and If-Match", async () => {
    const previousEnabled = process.env.RENIVET_W2_PORTAL_ENABLED;
    const previousBaseUrl = process.env.RENIVET_API_BASE_URL;
    process.env.RENIVET_W2_PORTAL_ENABLED = "true";
    process.env.RENIVET_API_BASE_URL = "http://127.0.0.1:4000/api/v1";
    try {
      const response = await proxyW2Request(new Request(`https://seller.example/api/w2/brands/${brandId}/products/${productId}/submit`, {
        method: "POST",
        headers: {
          origin: "https://seller.example",
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
          "x-csrf-token": "session-csrf",
          "idempotency-key": "submit-request-1",
        },
        body: JSON.stringify({ draftContentVersion: 2, categorySchemaVersion: 1, contentSha256: "a".repeat(64) }),
      }), ["brands", brandId, "products", productId, "submit"]);
      assert.equal(response.status, 400);
    } finally {
      if (previousEnabled === undefined) delete process.env.RENIVET_W2_PORTAL_ENABLED;
      else process.env.RENIVET_W2_PORTAL_ENABLED = previousEnabled;
      if (previousBaseUrl === undefined) delete process.env.RENIVET_API_BASE_URL;
      else process.env.RENIVET_API_BASE_URL = previousBaseUrl;
    }
  });
});
