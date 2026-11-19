import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveW2BackendPath } from "../src/lib/server/w2-proxy";

const source = readFileSync("src/features/seller/product-media-workspace.tsx", "utf8");
const brand = "7b4c5c92-3c49-47b7-82fc-6978acee421b";
const product = "13c751ef-e409-4ce4-b0e9-402744ab8357";
const media = "c0612cef-cdb9-4824-b821-8f7a4ab99cea";

test("REN2-125 preserves the private media intent, completion, status and link route chain", () => {
  assert.equal(resolveW2BackendPath(["brands",brand,"media"],"POST"), `/api/v1/brands/${brand}/media/uploads`);
  assert.equal(resolveW2BackendPath(["brands",brand,"media",media,"complete"],"POST"), `/api/v1/brands/${brand}/media/${media}/complete`);
  assert.equal(resolveW2BackendPath(["brands",brand,"media",media],"GET"), `/api/v1/brands/${brand}/media/${media}`);
  assert.equal(resolveW2BackendPath(["brands",brand,"products",product,"media"],"POST"), `/api/v1/brands/${brand}/products/${product}/media`);
});
test("REN2-125 automatically attaches only fully scanned, rights-attested images", () => {
  assert.match(source, /verified\.scanState === "CLEAN" && verified\.rightsState === "ATTESTED" && verified\.derivativeState === "READY"/);
  assert.match(source, /await w2Request\(\["brands", brandId, "products", productId, "media"\]/);
  assert.match(source, /setNotice\("Image uploaded, checked and attached to this product\."\)/);
  assert.match(source, /setMediaId\(" "\)/.source ? "" : /setMediaId\(""\)/);
});
test("REN2-125 distinguishes upload authorization, session protection and unavailable storage", () => {
  for (const code of ["BRAND_ACCESS_DENIED", "CSRF_REJECTED", "MEDIA_STORAGE_UNAVAILABLE", "MEDIA_SCANNER_UNAVAILABLE"]) {
    assert.ok(source.includes(code), `Expected actionable handling of ${code}`);
  }
  assert.match(source, /setError\(safeError\(caught\)\)/);
});
