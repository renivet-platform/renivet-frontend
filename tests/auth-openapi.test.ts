import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const snapshotPath = fileURLToPath(new URL("../openapi/renivet-backend.openapi.json", import.meta.url));

test("auth OpenAPI snapshot exposes only the implemented registration, session, phone, and challenge operations", () => {
  const contract = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
    paths?: Record<string, Record<string, unknown>>;
    components?: { schemas?: Record<string, unknown> };
  };
  const paths = contract.paths ?? {};
  const operationIds = new Map<string, string>();

  for (const [path, method] of [
    ["/api/v1/auth/register", "post"],
    ["/api/v1/auth/sessions", "post"],
    ["/api/v1/auth/session", "get"],
    ["/api/v1/auth/session", "delete"],
    ["/api/v1/auth/phone", "post"],
    ["/api/v1/auth/challenges", "post"],
    ["/api/v1/auth/challenges/{challengeId}/verify", "post"],
  ]) {
    assert.ok(paths[path]?.[method], `${method.toUpperCase()} ${path} is in the backend contract`);
    const operation = paths[path]?.[method] as { operationId?: string } | undefined;
    assert.ok(operation?.operationId, `${method.toUpperCase()} ${path} has a stable operationId`);
    operationIds.set(path, operation.operationId);
  }

  assert.equal(operationIds.get("/api/v1/auth/register"), "registerWithEmailAndPassword");
  assert.equal(operationIds.get("/api/v1/auth/sessions"), "createPasswordSession");
  assert.equal(operationIds.get("/api/v1/auth/challenges"), "createOtpChallenge");
  assert.equal(operationIds.get("/api/v1/auth/phone"), "setPhoneForVerification");
  assert.equal(operationIds.get("/api/v1/auth/challenges/{challengeId}/verify"), "verifyOtpChallenge");

  const schemas = contract.components?.schemas ?? {};
  for (const schema of [
    "RegisterRequestDto",
    "RegistrationAcceptedDto",
    "PasswordSessionRequestDto",
    "PasswordSessionResponseDto",
    "OtpIssueRequestDto",
    "OtpAcceptedDto",
    "OtpVerifyRequestDto",
    "OtpVerifiedDto",
    "SetPhoneForVerificationDto",
    "PhoneContactAcceptedDto",
  ]) {
    assert.ok(schemas[schema], `${schema} is in the backend contract`);
  }

  const challengeDescription = (paths["/api/v1/auth/challenges"]?.post as { description?: string } | undefined)?.description ?? "";
  const verifyDescription = (paths["/api/v1/auth/challenges/{challengeId}/verify"]?.post as { description?: string } | undefined)?.description ?? "";
  const issuePurpose = (schemas.OtpIssueRequestDto as { properties?: Record<string, { enum?: string[] }> } | undefined)?.properties?.purpose?.enum ?? [];
  const verifyPurpose = (schemas.OtpVerifyRequestDto as { properties?: Record<string, { enum?: string[] }> } | undefined)?.properties?.purpose?.enum ?? [];
  assert.ok(issuePurpose.includes("phone_registration"), "challenge contract exposes the passwordless registration purpose");
  assert.ok(verifyPurpose.includes("phone_registration"), "verification contract exposes the passwordless registration purpose");
  assert.match(challengeDescription, /phone_registration creates a pending, passwordless phone account/i);
  assert.match(verifyDescription, /phone_registration atomically activates its passwordless pending account/i);

  assert.equal(
    Object.keys(paths).some((path) => /auth\/(?:otp|sessions\/otp|login\/otp)/i.test(path)),
    false,
    "the frontend must not assume an OTP-to-session endpoint exists",
  );
});
