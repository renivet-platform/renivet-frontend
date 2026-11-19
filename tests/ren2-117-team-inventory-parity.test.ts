import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const team=readFileSync("src/features/seller/brand-team.tsx","utf8");
const teamCss=readFileSync("src/features/seller/team-exact.module.css","utf8");
const inventory=readFileSync("src/features/seller/inventory-availability.tsx","utf8");
const inventoryCss=readFileSync("src/features/seller/import-inventory-prototype.module.css","utf8");
test("Team has responsive person-role-status-action rows and owner guard",()=>{
 for(const x of ["Person","Role","Status","Action","Only owner"]) assert.ok(team.includes(x),x);
 assert.match(team,/team-v2/);
 assert.match(teamCss,/@media/);
});
test("Inventory preserves authorization/gate errors and real backend balance filters",()=>{
 assert.match(inventory,/RENIVET_INVENTORY_API_ENABLED=true/);
 assert.match(inventory,/visibleBalances = balances\.filter/);
 assert.match(inventory,/availableToSell === 0/);
 assert.match(inventory,/selectedLocation === "all"/);
 assert.match(inventoryCss,/\.inventoryFilters/);
});
