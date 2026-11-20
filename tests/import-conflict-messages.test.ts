import assert from "node:assert/strict";
import test from "node:test";
import { importConflictMessage, uniqueImportConflicts } from "@/features/seller/import-conflict-messages";

test("every preview conflict shown in the reported import has a clear remedy", () => {
  for (const code of ["CATEGORY_UNMAPPED", "PRICE_REVIEW_REQUIRED", "ATTRIBUTE_NOT_IN_SCHEMA"]) {
    const message = importConflictMessage(code);
    assert.notEqual(message.title, "Import needs review");
    assert.ok(message.explanation.length > 20);
    assert.ok(message.nextStep.length > 20);
    assert.equal(message.code, code);
  }
});

test("repeated attribute errors are grouped without losing count", () => {
  const issues = uniqueImportConflicts(["CATEGORY_UNMAPPED", "ATTRIBUTE_NOT_IN_SCHEMA", "ATTRIBUTE_NOT_IN_SCHEMA"]);
  assert.equal(issues.length, 2);
  assert.equal(issues[1].occurrences, 2);
});

test("unknown backend codes retain technical reference without falsely specifying a cause", () => {
  const issue = importConflictMessage("FUTURE_VALIDATION_CODE");
  assert.equal(issue.code, "FUTURE_VALIDATION_CODE");
  assert.equal(issue.title, "Import needs review");
});
