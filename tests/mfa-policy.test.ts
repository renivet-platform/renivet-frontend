import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { normalizeMfaEnforcementMode, shouldRequestMfaStepUp } from "../src/features/identity/mfa-policy";

test("deferred is the default and explicit opt-in is still recognizable", () => {
  assert.equal(normalizeMfaEnforcementMode("deferred"), "deferred");
  assert.equal(shouldRequestMfaStepUp("deferred"), false);
  assert.equal(normalizeMfaEnforcementMode("enforced"), "enforced");
  assert.equal(shouldRequestMfaStepUp("enforced"), true);
  assert.equal(normalizeMfaEnforcementMode(undefined), "deferred");
  assert.equal(normalizeMfaEnforcementMode("disabled"), "deferred");
});

test("platform UI does not render authenticator prompts for account or approval actions", () => {
  for (const path of [
    "src/features/identity/auth-forms.tsx",
    "src/features/admin/operations-console.tsx",
    "src/features/admin/brand-approvals.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /stepUpWithMfa|Set up MFA|review-mfa|Fresh MFA code|MfaEnrollmentPanel/);
  }
});

test("category creation and imports do not ask for authenticator codes",()=>{
  for(const path of ["src/features/admin/taxonomy-admin.tsx","src/features/seller/import-workspace.tsx"]){
    const source=readFileSync(path,"utf8");
    assert.match(source,/getCurrentSession/);
    assert.doesNotMatch(source,/Authenticator code|stepUpWithMfa|shouldRequestMfaStepUp|mfaField/);
  }
});
