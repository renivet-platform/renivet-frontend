import assert from "node:assert/strict";
import test from "node:test";
import { brandApprovalDetailPath, findPendingBrandApplication } from "../src/features/admin/brand-approval-route";

const firstBrandId = "13b5bc42-ea79-4610-bd1f-f2553d67df30";
const secondBrandId = "d4a3bd3b-5b71-49e1-87fc-3f4f9b8c8b0d";

test("builds a deep link only for a UUID-backed pending brand", () => {
  assert.equal(brandApprovalDetailPath(firstBrandId), `/brand-approvals/${firstBrandId}`);
  assert.equal(brandApprovalDetailPath("not-a-brand-id"), null);
});

test("finds the persisted pending application by its brand ID without selecting another brand", () => {
  const items = [{ brandId: firstBrandId, brandName: "First" }, { brandId: secondBrandId, brandName: "Second" }];
  assert.deepEqual(findPendingBrandApplication(items, secondBrandId), items[1]);
  assert.equal(findPendingBrandApplication(items, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"), null);
});
