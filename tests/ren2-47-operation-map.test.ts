import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

type Operation = {
  operationId: string;
  route: string;
  role: "seller" | "admin";
  availability: "registered" | "gated";
  presentation: "interactive" | "headless" | "gated";
  presentationReason: string;
  stateRequirements: string[];
  accessibility: string[];
  gates: string[];
};

describe("REN2-95 W2 operation map", () => {
  it("maps each v1.5 candidate operation once and distinguishes registered routes from gated routes", () => {
    const map = JSON.parse(readFileSync("docs/ren2-47/operation-map.json", "utf8")) as {
      candidateSource: { repository: string; commit: string; file: string };
      backendSource: { repository: string; commit: string; file: string };
      candidateOperationCount: number;
      scopeNote: string;
      operations: Operation[];
    };
    const backend = JSON.parse(readFileSync("openapi/renivet-backend.openapi.json", "utf8")) as {
      paths: Record<string, Record<string, { operationId?: string }>>;
    };
    const backendOperationIds = new Set(Object.values(backend.paths).flatMap((methods) =>
      Object.values(methods).map((operation) => operation.operationId).filter((id): id is string => Boolean(id))));
    const ids = map.operations.map((operation) => operation.operationId);

    assert.equal(map.candidateSource.repository, "renivet-platform/renivet-engineering-os");
    assert.match(map.candidateSource.commit, /^[0-9a-f]{40}$/);
    assert.equal(map.backendSource.repository, "renivet-platform/renivet-backend");
    assert.match(map.backendSource.commit, /^[0-9a-f]{40}$/);
    assert.equal(map.candidateOperationCount, 47);
    assert.match(map.scopeNote, /Linear acceptance text says 44/i);
    assert.match(map.scopeNote, /pinned candidate contains 47 unique operationId values/i);
    assert.equal(ids.length, map.candidateOperationCount);
    assert.equal(new Set(ids).size, ids.length, "candidate operations must not be double mapped");

    for (const operation of map.operations) {
      assert.ok(operation.route.startsWith("/"), `${operation.operationId} needs a screen or headless route`);
      assert.ok(operation.gates.length > 0, `${operation.operationId} needs an activation gate reference`);
      assert.ok(operation.presentationReason.trim().length > 20, `${operation.operationId} needs a truthful UX boundary`);
      assert.deepEqual(new Set(operation.stateRequirements), new Set(["loading", "empty", "error", "permission-denied", "success"]),
        `${operation.operationId} needs the shared loading/empty/error/permission/success state contract`);
      assert.ok(operation.accessibility.includes("keyboard"), `${operation.operationId} must inherit keyboard requirements`);
      assert.ok(operation.accessibility.includes("labelled-controls"), `${operation.operationId} must inherit accessible control labels`);
      if (operation.availability === "gated") assert.equal(operation.presentation, "gated", `${operation.operationId} must not appear interactive before registration`);
      if (operation.operationId === "proposeVariantPrice") assert.equal(operation.presentation, "headless",
        "price proposal stays out of the UI until a supported source provides the required ruleVersion");
      if (["updateProductVariant", "deactivateProductVariant"].includes(operation.operationId)) assert.equal(operation.presentation, "interactive",
        `${operation.operationId} is available through an authenticated seller draft action`);
      assert.equal(backendOperationIds.has(operation.operationId), operation.availability === "registered",
        `${operation.operationId} availability must match generated backend OpenAPI`);
    }
  });
});
