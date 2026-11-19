import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const team=readFileSync("src/features/seller/brand-team.tsx","utf8");
const imports=readFileSync("src/features/seller/import-workspace.tsx","utf8");
const products=readFileSync("src/features/seller/product-workspace.tsx","utf8");
test("Team follows approved table and real invitation lifecycle",()=>{
 for(const label of ["Person","Role","Status","Action","Invite someone","Only owner"])assert.ok(team.includes(label),label);
 assert.match(team,/team-v2/);
 assert.match(team,/data-screen-id="SE-20C"/);
 assert.doesNotMatch(team,/disabled className=\{styles\.invite\}/);
});
test("Imports retain separate source-first five-stage workflow with session CSRF and no authenticator",()=>{
 assert.match(imports,/wizardStep/);
 assert.match(imports,/Choose source/);
 assert.match(imports,/Upload file/);
 assert.match(imports,/getCurrentSession/);
 assert.doesNotMatch(imports,/stepUpWithMfa|Authenticator code|shouldRequestMfaStepUp/);
});
test("Products have separate creation route plus persisted category and updated fields",()=>{
 assert.match(products,/mode === "new"/);
 assert.match(products,/products\/new/);
 assert.match(products,/product\.categoryId/);
 assert.match(products,/product\.updatedAt/);
 assert.match(products,/Not available/);
 assert.doesNotMatch(products,/<BrandAccessPanel/);
});
