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
  assert.equal(issue.title, "Future validation code");
  assert.match(issue.nextStep, /technical code/);
});

test("price is informational at import time and invalid attributes remain saved for later correction", () => {
  const price = importConflictMessage("PRICE_REVIEW_REQUIRED");
  assert.match(price.title, /saved/i);
  assert.match(price.nextStep, /No price approval is required to save this import/);

  const invalidValue = importConflictMessage("ATTRIBUTE_VALUE_INVALID");
  assert.match(invalidValue.title, /editing/i);
  assert.match(invalidValue.explanation, /original entry is still saved/);

  const image = importConflictMessage("MEDIA_REVIEW_REQUIRED");
  assert.match(image.title, /saved/i);
});

test("missing product fields and deferred variants show specific import actions", () => {
  const missing = importConflictMessage("IMPORT_REQUIRED_FIELD");
  assert.match(missing.explanation, /externalItemId/);
  assert.match(missing.nextStep, /SKU and name/);

  const variant = importConflictMessage("IMPORT_VARIANTS_NEED_EDITING");
  assert.match(variant.title, /Product saved/);
  assert.match(variant.explanation, /original SKU/);
});
