import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveW2BackendPath } from "../src/lib/server/w2-proxy";

const brandId = "13b5bc42-ea79-4610-bd1f-f2553d67df30";
const productId = "d4a3bd3b-5b71-49e1-87fc-3f4f9b8c8b0d";
const variantId = "1d94ba0a-a595-4bda-80b3-0ce3ebacb35c";

describe("REN2-47 live API coverage", () => {
  it("routes SKU edit and deactivation to the registered brand-scoped backend operations", () => {
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", productId, "variants", variantId], "PATCH"),
      `/api/v1/brands/${brandId}/products/${productId}/variants/${variantId}`);
    assert.equal(resolveW2BackendPath(["brands", brandId, "products", productId, "variants", variantId], "DELETE"),
      `/api/v1/brands/${brandId}/products/${productId}/variants/${variantId}`);

    const map = JSON.parse(readFileSync("docs/ren2-47/operation-map.json", "utf8")) as {
      operations: Array<{ operationId: string; presentation: string; presentationReason: string }>;
    };
    for (const id of ["updateProductVariant", "deactivateProductVariant"]) {
      const operation = map.operations.find((item) => item.operationId === id);
      assert.equal(operation?.presentation, "interactive", `${id} must be represented by a real seller action`);
      assert.match(operation?.presentationReason ?? "", /same-origin|brand-scoped/i);
    }

    const component = readFileSync("src/features/seller/product-detail-workspace.tsx", "utf8");
    assert.match(component, /Edit SKU options/);
    assert.match(component, /Deactivate SKU/);
    assert.match(component, /ifMatch: `"\$\{product\.rowVersion\}"`/);
    assert.match(component, /Confirm deactivation/);
  });

  it("provides an inventory route without pretending unregistered stock APIs are live", () => {
    assert.ok(existsSync("src/app/(seller)/brands/[brandId]/inventory/page.tsx"));
    const page = readFileSync("src/app/(seller)/brands/[brandId]/inventory/page.tsx", "utf8");
    const surface = readFileSync("src/features/seller/inventory-availability.tsx", "utf8");
    assert.match(page, /w2PortalEnabled/);
    assert.match(page, /brandId/);
    assert.match(surface, /inventory API routes are not registered/i);
    assert.match(surface, /No stock data is loaded/);
    assert.doesNotMatch(surface, /fetch\s*\(/);
  });
});
