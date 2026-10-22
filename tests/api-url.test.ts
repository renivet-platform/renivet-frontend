import assert from "node:assert/strict";
import test from "node:test";
import { resolveApiBaseUrl } from "../src/lib/api-url";

test("uses local backend default when absent", () => {
  assert.equal(resolveApiBaseUrl(undefined), "http://localhost:4000/api/v1");
});

test("rejects unexpected URL protocols", () => {
  assert.throws(() => resolveApiBaseUrl("file:///etc/passwd"), /http or https/);
});
