import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { normalizeMfaEnforcementMode, shouldRequestMfaStepUp } from "../src/features/identity/mfa-policy";

test("only an explicit server deferred policy suppresses MFA step-up UI", () => {
  assert.equal(normalizeMfaEnforcementMode("deferred"), "deferred");
  assert.equal(shouldRequestMfaStepUp("deferred"), false);
  assert.equal(normalizeMfaEnforcementMode("enforced"), "enforced");
  assert.equal(shouldRequestMfaStepUp("enforced"), true);
  assert.equal(normalizeMfaEnforcementMode(undefined), "enforced");
  assert.equal(normalizeMfaEnforcementMode("disabled"), "enforced");
});

test("account MFA enrollment remains voluntary and admin surfaces follow server policy", () => {
  const authForms = readFileSync("src/features/identity/auth-forms.tsx", "utf8");
  assert.match(authForms, /Optional: add an authenticator app/);
  assert.match(authForms, /Set up MFA/);
  for (const path of [
    "src/features/admin/operations-console.tsx",
    "src/features/admin/brand-approvals.tsx",
    "src/features/admin/taxonomy-admin.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /getCurrentSession/);
    assert.match(source, /shouldRequestMfaStepUp/);
  }
});
