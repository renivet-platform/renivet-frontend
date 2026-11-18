import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync("src/features/admin/admin-module-empty.tsx", "utf8");
const styles = readFileSync("src/features/admin/admin-module-empty.module.css", "utf8");

test("REN2-117 gated admin modules retain all five source screen IDs", () => {
  for (const screen of ["AD-05", "AD-06", "AD-09", "AD-19", "AD-20"]) assert.ok(source.includes(`id: "${screen}"`), screen);
});

test("REN2-117 no unsupported finance/privacy/staff decision is clickable or reported persisted", () => {
  assert.match(source, /<fieldset disabled className=\{styles\.disabledFilters\}/);
  assert.match(source, /<fieldset disabled><legend>Decision actions unavailable<\/legend>/);
  assert.match(source, /<button type="button" disabled>Record decision unavailable<\/button>/);
  assert.doesNotMatch(source, /w2Request\(/);
  assert.match(source, /No audit events are loaded/);
  assert.match(source, /No bank records are loaded/);
});

test("REN2-117 pending administration screens use responsive forms and accessible status states", () => {
  assert.match(source, /role="status"/);
  assert.match(styles, /@media\(max-width:760px\)/);
  assert.match(styles, /@media\(max-width:430px\)/);
});
