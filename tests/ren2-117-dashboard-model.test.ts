import assert from "node:assert/strict";
import test from "node:test";
import { summarizeProducts } from "../src/features/seller/brand-workspace-model";

test("seller dashboard reports persisted product states from the current API page", () => {
  const summary = summarizeProducts([
    { publicationState: "PUBLISHED" },
    { publicationState: "PENDING_REVIEW" },
    { publicationState: "RE_REVIEW" },
    { publicationState: "RESTRICTED" },
    { publicationState: "REJECTED" },
    { publicationState: "DRAFT" },
    { publicationState: "INCOMPLETE" },
  ]);
  assert.deepEqual(summary, { loaded: 7, live: 1, inReview: 2, needsAttention: 2, drafts: 2 });
});

test("seller dashboard labels an empty product response without inventing records", () => {
  assert.deepEqual(summarizeProducts([]), { loaded: 0, live: 0, inReview: 0, needsAttention: 0, drafts: 0 });
});
