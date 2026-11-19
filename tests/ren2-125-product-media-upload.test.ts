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
test("REN2-126 queues multiple photos and attaches only scanned, rights-attested READY assets", () => {
  assert.match(source, /type="file" multiple/);
  assert.match(source, /status\.scanState !== "CLEAN" \|\| status\.rightsState !== "ATTESTED" \|\| status\.derivativeState !== "READY"/);
  assert.match(source, /await attachMedia\(assetId, photo, session\.csrfToken, counts\)/);
  assert.match(source, /progress: 100/);
  assert.match(source, /variantId \? \{ variantId \} : \{\}/);
});

test("REN2-125 distinguishes upload authorization, session protection and unavailable storage", () => {
  for (const code of ["BRAND_ACCESS_DENIED", "CSRF_REJECTED", "MEDIA_STORAGE_UNAVAILABLE", "MEDIA_SCANNER_UNAVAILABLE"]) {
    assert.ok(source.includes(code), `Expected actionable handling of ${code}`);
  }
  assert.match(source, /uploadError\(caught\)/);
});
