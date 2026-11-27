import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("price proposal uses selected SKU version, not parent product version", () => {
  const source = readFileSync("src/features/seller/product-detail-workspace.tsx", "utf8");
  const proposal = source.slice(source.indexOf("async function proposePrice"), source.indexOf("async function", source.indexOf("async function proposePrice") + 20));
  assert.match(proposal, /product\.variants\.find\(\(variant\) => variant\.id === priceVariantId\)/);
  assert.match(proposal, /selectedVariant\?\.rowVersion/);
  assert.match(proposal, /Number\.isSafeInteger\(variantVersion\)/);
  assert.ok(proposal.includes('ifMatch: `"${variantVersion}"`'));
  assert.ok(!proposal.includes('ifMatch: `"${product.rowVersion}"`'));
});
