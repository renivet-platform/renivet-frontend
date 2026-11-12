import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_THEME, contrastRatio } from "../src/features/identity/auth-theme";
import { isAcceptedPassphrase, normalizeEmail, normalizeOtpEntry, normalizePhoneNumber } from "../src/features/identity/auth-policy";

test("authentication text and action color pairs meet WCAG AA contrast", () => {
  const pairs: Array<[string, string, string]> = [
    [AUTH_THEME.ink, AUTH_THEME.surface, "primary text"],
    [AUTH_THEME.muted, AUTH_THEME.surface, "secondary text"],
    [AUTH_THEME.primaryText, AUTH_THEME.primary, "primary button text"],
    [AUTH_THEME.error, AUTH_THEME.surface, "error text"],
    [AUTH_THEME.success, AUTH_THEME.surface, "success text"],
  ];

  for (const [foreground, background, label] of pairs) {
    assert.ok(contrastRatio(foreground, background) >= 4.5, `${label} has at least 4.5:1 contrast`);
  }
});

test("passphrase validation follows the backend 15-to-128 character rule without trimming", () => {
  assert.equal(isAcceptedPassphrase("12345678901234"), false);
  assert.equal(isAcceptedPassphrase("123456789012345"), true);
  assert.equal(isAcceptedPassphrase("               "), true);
  assert.equal(isAcceptedPassphrase("x".repeat(128)), true);
  assert.equal(isAcceptedPassphrase("x".repeat(129)), false);
});

test("email normalization matches backend canonicalization", () => {
  assert.equal(normalizeEmail("  Buyer@Example.test  "), "buyer@example.test");
});

test("OTP entry accepts whole-code paste and keeps six numeric digits", () => {
  assert.equal(normalizeOtpEntry("12 34-56"), "123456");
  assert.equal(normalizeOtpEntry("1234567"), "123456");
  assert.equal(normalizeOtpEntry("code"), "");
});

test("phone entry normalizes Indian mobile numbers to E.164 and rejects invalid destinations", () => {
  assert.equal(normalizePhoneNumber("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("98765-43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("+1 415 555 0100"), null);
  assert.equal(normalizePhoneNumber("12345"), null);
});
