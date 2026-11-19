import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/admin/taxonomy-admin.tsx", "utf8");

test("REN2-123 distinguishes approved-but-inactive from awaiting approval and live", () => {
  for (const status of ["Ready to activate", "Waiting for approval", "Needs details", "Live", "Retired"]) {
    assert.ok(source.includes(status), `Missing user-facing status: ${status}`);
  }
  assert.match(source, /currentVersion\(category\) != null/);
  assert.doesNotMatch(source, /Not active.*Published version/);
});

test("REN2-123 activates only a previously published eligible category via audited API", () => {
  assert.match(source, /!selected \|\| busy \|\| isLive\(selected\) \|\| selected\.retired \|\| currentVersion\(selected\) == null/);
  assert.match(source, /\["admin","catalog","categories",selected\.id,"activate"\]/);
  assert.match(source, /reasonCode: "APPROVED_FOR_LISTING"/);
  assert.match(source, /csrfToken: session\.csrfToken/);
  assert.match(source, /idempotencyKey: crypto\.randomUUID\(\)/);
  assert.match(source, /Yes, make live/);
  assert.match(source, /await load\(\)/);
});

test("REN2-123 keeps submitted categories independent-review gated", () => {
  assert.match(source, /selected\.hasDraft/);
  assert.match(source, /A different authorized admin/);
  assert.match(source, /Open approval queue/);
  assert.doesNotMatch(source, /authenticator code|MFA code|stepUpWithMfa/i);
});

test("REN2-123 retains approved rule metadata during revisions", () => {
  assert.match(source, /savedSelection\(selected\)/);
  assert.match(source, /selected\.publishedRuleset\?\.attributes\?\.find/);
  assert.match(source, /return \{ \.\.\.publishedRule, requiredByDefault: field\.required \}/);
});
