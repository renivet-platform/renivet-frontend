import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateImportFieldMappings } from "../src/features/seller/import-workspace-state";

describe("REN2-98 import mapping state", () => {
  it("requires a nonempty mapping and catches duplicate source and destination fields", () => {
    assert.match(validateImportFieldMappings([]) ?? "", /at least one/);
    assert.match(validateImportFieldMappings([{ source: "SKU", target: "sku" }, { source: " sku ", target: "title" }]) ?? "", /source column/);
    assert.match(validateImportFieldMappings([{ source: "SKU", target: "sku" }, { source: "Product SKU", target: "sku" }]) ?? "", /destination field/);
  });

  it("allows unmatched source columns only when they are explicitly removed or skipped", () => {
    assert.match(validateImportFieldMappings([{ source: "SKU", target: "sku" }, { source: "Description", target: "" }]) ?? "", /choose a destination/i);
    assert.equal(validateImportFieldMappings([{ source: "SKU", target: "sku" }]), null);
  });
});
