import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolveW2BackendPath } from "../src/lib/server/w2-proxy";

test("AD-20 read-only audited path is exact; cannot create or modify audit events through BFF",()=>{
 assert.equal(resolveW2BackendPath(["admin","access-audit"],"GET"),"/api/v1/admin/access-audit");
 for(const method of ["POST","PATCH","DELETE"]) assert.equal(resolveW2BackendPath(["admin","access-audit"],method),null);
 assert.equal(resolveW2BackendPath(["admin","access-audit","extra"],"GET"),null);
});
test("AD-20 is a live API-backed read screen with no fabricated records or sensitive payload",()=>{
 const source=readFileSync("src/features/admin/admin-audit-prototype.tsx","utf8");
 assert.match(source,/w2Request<AuditPage>/);
 assert.match(source,/\["admin","access-audit"\]/);
 assert.match(source,/nextCursor/);
 assert.match(source,/data-screen-id="AD-20"/);
 assert.doesNotMatch(source,/payloadHash|ipHash|seedAuditRows/);
});
