import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const team = readFileSync("src/features/seller/brand-team.tsx","utf8");
const css = readFileSync("src/features/seller/team-prototype.module.css","utf8");
const inventory = readFileSync("src/features/seller/inventory-availability.tsx","utf8");

test("SE-20C renders the approved Person / Role / Status / Action table", () => {
  for (const field of ["Person","Role","Status","Action"]) assert.ok(team.includes(field), field);
  assert.match(team, /data-screen-id="SE-20C"/);
  assert.match(team, /member\.memberEmail/);
  assert.match(team, /rolesFor\(member\)/);
  assert.match(team, /onlyOwner/);
  assert.match(team, /disabled className=\{styles\.invite\}/);
});

test("Team screen hides grant codes and adapts to phone widths", () => {
  assert.doesNotMatch(team,/permission\.permissionCode\}/);
  assert.match(css, /@media\(max-width:600px\)/);
});

test("SE-13 distinguishes API gate 404 from valid empty stock and filters only backend balances", () => {
  assert.match(inventory,/RENIVET_INVENTORY_API_ENABLED=true/);
  assert.match(inventory,/visibleBalances = balances\.filter/);
  assert.match(inventory,/availableToSell === 0/);
  assert.match(inventory,/selectedLocation === "all"/);
  assert.match(inventory,/No stock recorded yet/);
});
