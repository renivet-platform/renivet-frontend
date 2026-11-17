import assert from "node:assert/strict";
import test from "node:test";
import { resolvePostSignInPath } from "../src/features/identity/auth-routing";

const brandSession = { kind: "brands" as const, brands: [{ id: "7d785d72-ea2c-44bb-9d82-87b272112b32", name: "Kora & Loom" }] };

test("returns a requested seller screen only for a backend-authorized brand", () => {
  assert.equal(resolvePostSignInPath("/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/products", brandSession), "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/products");
  assert.equal(resolvePostSignInPath("/brands/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/products", brandSession), "/brands/7d785d72-ea2c-44bb-9d82-87b272112b32/workspace");
});

test("keeps staff destinations within the server-resolved operations role", () => {
  assert.equal(resolvePostSignInPath("/operations/claims", { kind: "operations" }), "/operations/claims");
  assert.equal(resolvePostSignInPath("/operations", { kind: "storefront" }), "/");
});

test("rejects external, protocol-relative, and backslash return targets", () => {
  for (const target of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
    assert.equal(resolvePostSignInPath(target, { kind: "storefront" }), "/");
  }
});
