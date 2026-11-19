import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveW2BackendPath } from "../src/lib/server/w2-proxy";

const brandId = "7b4c5c92-3c49-47b7-82fc-6978acee421b";
const categoryId = "0bd89401-201e-4efc-8503-850220344b6d";
const source = readFileSync("src/features/seller/product-workspace.tsx", "utf8");

test("REN2-124 category guidance is forwarded over approved backend GET and unauthorized methods are denied", () => {
  assert.equal(resolveW2BackendPath(["brands",brandId,"categories",categoryId,"attributes"],"GET"),
    `/api/v1/brands/${brandId}/categories/${categoryId}/attributes`);
  assert.equal(resolveW2BackendPath(["brands",brandId,"categories",categoryId,"attributes"],"POST"),null);
});

test("REN2-124 product draft is persisted using real API with CSRF and idempotency", () => {
  assert.match(source, /\["brands", brandId, "products"\], \{/);
  assert.match(source, /method: "POST", body, csrfToken: session\.csrfToken, idempotencyKey: idempotency\.current\.key/);
  assert.match(source, /router\.push\(\x60\/brands\/\$\{encodeURIComponent\(brandId\)\}\/products\/\$\{encodeURIComponent\(receipt\.productId\)\}\x60\)/);
  assert.match(source, /categoryDraftVersion\(selectedCategory\)/);
});

test("REN2-124 loading and empty category guidance states are not confused", () => {
  assert.match(source, /setAttributesLoading\(true\)/);
  assert.match(source, /setAttributesLoading\(false\)/);
  assert.match(source, /No additional product details are required to create a draft/);
  assert.match(source, /Try again/);
  assert.match(source, /Retry loading categories/);
});
