import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Category } from "../src/features/seller/w2-catalog";
import { canonicalVariantOptions, categoryDraftVersion, categoryLabel, hasVariantCombination, selectableCategories } from "../src/features/seller/w2-catalog";

const categories: Category[] = [
  { id: "parent", code: "APPAREL", name: "Apparel", schemaVersion: 1, parentId: null, isLeaf: false, isActive: true, currentSchemaVersion: 2, pathCodes: ["APPAREL"] },
  { id: "leaf", code: "SHIRT", name: "Shirts", schemaVersion: 1, parentId: "parent", isLeaf: true, isActive: true, currentSchemaVersion: 3, pathCodes: ["APPAREL", "SHIRT"] },
  { id: "inactive", code: "RETIRED", name: "Retired", schemaVersion: 1, parentId: null, isLeaf: true, isActive: false, currentSchemaVersion: 2, pathCodes: ["RETIRED"] },
  { id: "unpinned", code: "UNPINNED", name: "Unpinned", schemaVersion: 0, parentId: null, isLeaf: true, isActive: true, currentSchemaVersion: 0, pathCodes: ["UNPINNED"] },
];

describe("REN2-96 category selection state", () => {
  it("allows only active leaf categories with a published schema pin", () => {
    assert.deepEqual(selectableCategories(categories).map((category) => category.id), ["leaf"]);
    assert.equal(categoryDraftVersion(categories[1]!), 3);
  });

  it("shows the full category breadcrumb by readable names", () => {
    assert.equal(categoryLabel(categories[1]!, categories), "Apparel › Shirts");
  });
});

describe("REN2-97 SKU option uniqueness", () => {
  const variants = [{ options: { color: "Blue", size: "M" }, variantState: "ACTIVE" }];

  it("compares canonical combinations independent of object key order", () => {
    assert.equal(canonicalVariantOptions({ size: "M", color: "Blue" }), canonicalVariantOptions(variants[0]!.options));
    assert.equal(hasVariantCombination({ size: "M", color: "Blue" }, variants), true);
  });

  it("allows a distinct option combination", () => {
    assert.equal(hasVariantCombination({ color: "Blue", size: "L" }, variants), false);
  });

  it("allows a SKU to keep its own current option combination during edit", () => {
    const current = [{ id: "sku-1", options: { color: "Blue", size: "M" }, variantState: "DRAFT" }];
    assert.equal(hasVariantCombination({ size: "M", color: "Blue" }, current, "sku-1"), false);
  });
});
