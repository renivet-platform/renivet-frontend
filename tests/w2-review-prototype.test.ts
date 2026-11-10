import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contrastRatio } from "../src/features/identity/auth-theme";
import { getW2ReviewStates, getW2PermissionRows } from "../src/features/seller/w2-review-prototype";

const css = readFileSync(new URL("../src/features/seller/w2-review-prototype.module.css", import.meta.url), "utf8");

function token(name: string): string {
  const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  assert.ok(value, `CSS token --${name} exists`);
  return value;
}

test("W2 review preview covers applicant, failure, status and privileged-review cases", () => {
  const states = getW2ReviewStates();
  for (const id of ["draft", "validation-error", "scan-failed", "evidence-expired", "duplicate-check", "submitted", "pending", "needs-changes", "approved", "rejected", "suspended", "review-queue", "queue-empty", "evidence-restricted", "beneficiary-mismatch", "reviewer-conflict", "mfa-required", "denied", "review-error"]) {
    assert.ok(states.some(state => state.id === id), `contains ${id}`);
  }
  assert.ok(states.every(state => state.proposalOnly));
});

test("unapproved fields and workflow transitions are explicitly marked TBD", () => {
  const states = getW2ReviewStates();
  assert.ok(states.filter(state => ["draft", "validation-error", "scan-failed", "submitted", "pending", "needs-changes", "approved", "rejected", "suspended"].includes(state.id)).every(state => state.ruleStatus === "TBD"));
  assert.ok(getW2PermissionRows().some(row => row.status === "Confirmed" && /server|membership|MFA|audit/i.test(row.rule)));
  assert.ok(getW2PermissionRows().some(row => row.status === "TBD" && /field|transition|evidence/i.test(row.rule)));
});

test("preview avoids live personal or financial information and keeps decisions inert", () => {
  const states = getW2ReviewStates();
  assert.ok(states.every(state => state.primaryActionDisabled));
  assert.ok(states.every(state => !/\b\d{9,}\b/.test(`${state.description} ${state.detail}`)));
  assert.ok(states.find(state => state.id === "evidence-restricted")?.detail.includes("No document preview"));
});

test("W2 preview text and primary action colors meet WCAG AA contrast", () => {
  assert.ok(contrastRatio(token("ink"), token("paper")) >= 4.5);
  assert.ok(contrastRatio(token("muted"), token("paper")) >= 4.5);
  assert.ok(contrastRatio(token("paper"), token("forest")) >= 4.5);
  assert.ok(contrastRatio(token("amber-ink"), token("amber-wash")) >= 4.5);
});
