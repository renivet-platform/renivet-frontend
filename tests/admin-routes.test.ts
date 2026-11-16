import test from "node:test";
import assert from "node:assert/strict";
import { isQueueId, reviewQueuePath } from "../src/features/admin/admin-route-utils";

test("accepts only the five persisted admin review queues", () => {
  assert.deepEqual(["taxonomy", "quality", "pricing", "claims", "publishing"].map(isQueueId), [true, true, true, true, true]);
  assert.equal(isQueueId("audit"), false);
  assert.equal(isQueueId(""), false);
});

test("builds stable queue and detail URLs", () => {
  assert.equal(reviewQueuePath("quality"), "/operations/quality");
  assert.equal(reviewQueuePath("quality", "revision-123"), "/operations/quality/revision-123");
});
