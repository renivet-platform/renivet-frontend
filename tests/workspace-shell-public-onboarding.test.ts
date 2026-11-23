import assert from "node:assert/strict";
import test from "node:test";
import { isPublicSellerApplicationRoute } from "../src/components/layout/workspace-access-policy";

test("public Join and Apply pages do not require a brand session", () => {
  assert.equal(isPublicSellerApplicationRoute("seller", "/brands/join"), true);
  assert.equal(isPublicSellerApplicationRoute("seller", "/brands/join/application"), true);
});

test("brand workspaces, sibling paths, and all admin routes remain gated", () => {
  for (const pathname of ["/brands", "/brands/123/workspace", "/brands/join/unsafe", "/brands/join/application/edit"]) {
    assert.equal(isPublicSellerApplicationRoute("seller", pathname), false);
  }
  assert.equal(isPublicSellerApplicationRoute("admin", "/brands/join"), false);
  assert.equal(isPublicSellerApplicationRoute("admin", "/brands/join/application"), false);
});
