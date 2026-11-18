import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspaceNavigation, mobileWorkspaceLinks } from "../src/components/layout/workspace-navigation";

test("seller navigation stays inside the active UUID brand and marks nested product routes", () => {
  const items = buildWorkspaceNavigation("seller", "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/products/6a7d1598-8da1-49d8-a1a4-9dfe18f4fb4b");

  assert.ok(items.some((item) => item.label === "Products" && item.href === "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/products" && item.active));
  assert.ok(items.some((item) => item.label === "Imports" && item.href === "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/imports" && !item.active));
  assert.ok(items.filter((item) => item.label !== "Switch brand").every((item) => item.href.startsWith("/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/")));
  assert.ok(items.some((item) => item.label === "Payout account" && item.href === "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/payouts"));
  assert.ok(items.some((item) => item.label === "Switch brand" && item.href === "/brands"));
  assert.deepEqual(mobileWorkspaceLinks("seller", items).map((item) => item.label), ["Home", "Products", "Inventory", "Imports"]);
});

test("seller navigation omits brand-scoped links when the path has no UUID", () => {
  assert.deepEqual(buildWorkspaceNavigation("seller", "/brands/not-a-uuid/products"), []);
});

test("admin navigation maps directly to registered review routes", () => {
  const items = buildWorkspaceNavigation("admin", "/operations/claims/claim-id");

  assert.ok(items.some((item) => item.label === "Claims & evidence" && item.href === "/operations/claims" && item.active));
  assert.ok(items.some((item) => item.label === "Home" && item.href === "/operations" && !item.active));
  assert.ok(items.some((item) => item.label === "Brand applications" && item.href === "/brand-approvals" && !item.active));
  assert.ok(items.some((item) => item.label === "Staff & access" && item.href === "/operations/staff"));
  assert.ok(items.some((item) => item.label === "Taxonomy" && item.href === "/taxonomy" && !item.active));
  assert.ok(items.every((item) => !item.href.startsWith("/brands/")));
  assert.deepEqual(mobileWorkspaceLinks("admin", items).map((item) => item.label), ["Home", "Product quality", "Brand applications", "Inventory exceptions"]);
});

test("brand approval routes highlight the brand applications destination", () => {
  const items = buildWorkspaceNavigation("admin", "/brand-approvals/7d785d72-ea2c-44bb-9d82-87b272112b32");
  assert.ok(items.some((item) => item.label === "Brand applications" && item.href === "/brand-approvals" && item.active));
});
