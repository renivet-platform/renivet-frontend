import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveBrandWorkspaceRoute } from "../src/features/seller/workspace-route";

const validBrandId = "7b4c5c92-3c49-47b7-82fc-6978acee421b";

describe("seller W2 workspace route gate", () => {
  it("shows a clear gated state for a valid brand when W2 is disabled", () => {
    assert.equal(resolveBrandWorkspaceRoute(validBrandId, false), "unavailable");
  });

  it("only allows the workspace when W2 is enabled and the brand ID is valid", () => {
    assert.equal(resolveBrandWorkspaceRoute(validBrandId, true), "available");
    assert.equal(resolveBrandWorkspaceRoute("not-a-brand-id", true), "not-found");
  });
});
