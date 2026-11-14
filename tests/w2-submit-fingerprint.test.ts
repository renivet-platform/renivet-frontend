import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSubmissionRequestDigest } from "../src/features/seller/w2-catalog";

describe("seller submission request fingerprint", () => {
  it("creates a deterministic SHA-256 fingerprint for the exact row and schema versions", async () => {
    const request = { productId: "product-1", rowVersion: 7, draftContentVersion: 3, categorySchemaVersion: 2 };
    const first = await createSubmissionRequestDigest(request);

    assert.match(first, /^[0-9a-f]{64}$/);
    assert.equal(await createSubmissionRequestDigest(request), first);
    assert.notEqual(await createSubmissionRequestDigest({ ...request, rowVersion: 8 }), first);
    assert.notEqual(await createSubmissionRequestDigest({ ...request, categorySchemaVersion: 3 }), first);
  });
});
