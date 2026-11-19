import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { shouldRequestMfaStepUp } from "../src/features/identity/mfa-policy";

const team = readFileSync("src/features/seller/brand-team.tsx","utf8");
const importScreen = readFileSync("src/features/seller/import-workspace.tsx","utf8");
const products = readFileSync("src/features/seller/product-workspace.tsx","utf8");

test("SE-20C only renders user-facing name, role, status, action, and preserves lone-owner safeguard", () => {
  for(const label of ["Person","Role","Status","Action","Only owner"]) assert.ok(team.includes(label),label);
  assert.match(team,/data-screen-id="SE-20C"/);
  assert.match(team,/member\.memberEmail/);
  assert.match(team,/rolesFor\(member\)/);
  assert.match(team,/disabled className=\{styles\.invite\}/);
  assert.doesNotMatch(team, /\{permission\.permissionCode\}/);
});

test("SE-12 opens a deliberate new import flow without exposing duplicate source selectors", () => {
  assert.match(importScreen,/setNewImport\(true\)/);
  assert.match(importScreen,/!batchId && !newImport \? null : !batchId/);
  assert.match(importScreen,/Choose a source export/);
  assert.doesNotMatch(importScreen, /id="import-profile"/);
});

test("SE-12 controls MFA only through server-provided enforcement mode", () => {
  assert.equal(shouldRequestMfaStepUp("deferred"), false);
  assert.equal(shouldRequestMfaStepUp("enforced"), true);
  assert.match(importScreen,/shouldRequestMfaStepUp\(session\.mfaEnforcementMode\)/);
  assert.match(importScreen,/shouldRequestMfaStepUp\(mfaMode\)/);
});

test("SE-08 uses persisted product metadata or clearly unavailable dates", () => {
  assert.doesNotMatch(products, /<BrandAccessPanel/);
  assert.match(products,/product\.updatedAt/);
  assert.match(products,/product\.categoryId/);
  assert.match(products,/Not available/);
});
