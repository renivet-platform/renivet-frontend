import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contrastRatio } from "../src/features/identity/auth-theme";
import { getOnboardingPrototypeScreens, getPrototypeStateCopy, type PrototypeScreenId } from "../src/features/identity/onboarding-prototype";

const prototypeCss = readFileSync(new URL("../src/features/identity/onboarding-prototype.module.css", import.meta.url), "utf8");
const prototypeView = readFileSync(new URL("../src/features/identity/onboarding-prototype-view.tsx", import.meta.url), "utf8");

function cssToken(name: string): string {
  const value = prototypeCss.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  assert.ok(value, `CSS token --${name} exists`);
  return value;
}

test("W1 onboarding preview covers the customer, seller, and admin journey map", () => {
  const screens = getOnboardingPrototypeScreens();
  assert.deepEqual(screens.map(screen => [screen.id, screen.sourceId]), [
    ["sign-in", "CU-08"],
    ["register", "CU-09"],
    ["email-verification", "CU-09"],
    ["recover", "CU-09"],
    ["recovery-code", "CU-09"],
    ["account-session", "CU-08"],
    ["session-expired", "CU-09"],
    ["admin-mfa", "AD-01"],
    ["seller-access", "SE-20"],
    ["team-permissions", "AD-06"],
  ]);
});

test("preview journey controls resolve to screens in the same map", () => {
  const screens = getOnboardingPrototypeScreens();
  const screenIds = new Set(screens.map(screen => screen.id));
  for (const screen of screens) {
    for (const target of [screen.nextStepId, screen.alternateStepId]) {
      if (target) assert.ok(screenIds.has(target), screen.id + " links to an existing preview screen");
    }
  }
  assert.equal(screens.find(screen => screen.id === "sign-in")?.alternateStepId, "recover");
  assert.equal(screens.find(screen => screen.id === "register")?.nextStepId, "email-verification");
});

test("each journey screen offers relevant loading and negative states", () => {
  const screens = new Map(getOnboardingPrototypeScreens().map(screen => [screen.id, screen]));
  const expectedStates: Record<string, string[]> = {
    "sign-in": ["validation-error", "loading", "recoverable-error", "denied", "expired", "service-unavailable"],
    register: ["validation-error", "loading", "recoverable-error", "success-preview", "service-unavailable"],
    "email-verification": ["validation-error", "loading", "invalid-code", "expired", "already-used", "rate-limited", "service-unavailable", "success-preview"],
    recover: ["validation-error", "loading", "recoverable-error", "success-preview", "service-unavailable"],
    "recovery-code": ["validation-error", "loading", "invalid-code", "expired", "rate-limited", "service-unavailable", "success-preview"],
    "account-session": ["loading", "success-preview", "expired", "recoverable-error"],
    "session-expired": ["expired", "loading", "recoverable-error"],
    "admin-mfa": ["validation-error", "loading", "invalid-code", "expired", "rate-limited", "denied", "service-unavailable"],
    "seller-access": ["loading", "success-preview", "empty", "denied", "suspended", "expired", "service-unavailable"],
    "team-permissions": ["loading", "success-preview", "empty", "denied", "expired", "audit-unavailable", "service-unavailable"],
  };
  for (const [id, required] of Object.entries(expectedStates)) {
    const screen = screens.get(id as PrototypeScreenId);
    assert.ok(screen, id + " screen exists");
    for (const state of required) assert.ok(screen.states.includes(state as never), id + " includes " + state);
  }
});

test("onboarding preview labels all approval and access states as proposals requiring review", () => {
  const screens = getOnboardingPrototypeScreens();
  assert.ok(screens.every(screen => screen.approval === "proposed"));
  assert.ok(screens.every(screen => screen.states.length > 0));
  assert.ok(screens.some(screen => screen.states.includes("denied")));
  assert.ok(screens.some(screen => screen.states.includes("recoverable-error")));
});

test("seller and admin previews state that access decisions come from the backend", () => {
  const screens = getOnboardingPrototypeScreens();
  for (const screen of screens.filter(item => item.audience !== "customer")) {
    assert.match(screen.securityNote, /backend/i);
    assert.match(screen.securityNote, /preview/i);
  }
});

test("error and denial preview copy avoids claiming an account or access exists", () => {
  assert.match(getPrototypeStateCopy("recoverable-error").message, /could not complete/i);
  assert.doesNotMatch(getPrototypeStateCopy("recoverable-error").message, /account exists|approved/i);
  assert.match(getPrototypeStateCopy("denied").message, /does not currently have access/i);
  assert.doesNotMatch(getPrototypeStateCopy("denied").message, /brand|application|staff/i);
});

test("simulated success never claims a request, verification, session, or permission occurred", () => {
  const copy = getPrototypeStateCopy("success-preview" as never);
  assert.match(copy.label, /preview/i);
  assert.match(copy.message, /no (request|code|session|permission)|not (sent|verified|created|changed)/i);
  assert.doesNotMatch(copy.message, /email sent|code verified|signed in|permission granted/i);
});

test("preview controls do not call authentication APIs or submit form data", () => {
  assert.doesNotMatch(prototypeView, /\bfetch\s*\(|\/api\/auth/);
  assert.match(prototypeView, /readOnly/);
  assert.match(prototypeView, /Continue preview|Preview next/);
  assert.match(prototypeView, /aria-live="polite"/);
});

test("proposed onboarding text and button color pairs meet WCAG AA contrast", () => {
  const pairs: Array<[string, string, string, number?]> = [
    [cssToken("ink"), cssToken("paper"), "primary text"],
    [cssToken("muted"), cssToken("paper"), "secondary text"],
    [cssToken("muted"), "#fffefa", "secondary text on cards"],
    ["#fffefa", cssToken("pine"), "primary action text"],
    ["#743b32", "#fff7f4", "error message"],
    ["#31483c", "#f4f7f1", "ready status message"],
    ["#59665d", "#fffefa", "source note"],
    ["#59665d", cssToken("paper"), "footer note"],
    ["#68795f", "#fffefa", "screen eyebrow"],
    ["#69776e", "#fffefa", "input placeholder"],
    ["#68736b", "#fffefa", "audience label"],
    ["#546258", "#eff0e8", "screen number"],
    ["#76583c", "#fffefa", "principle number"],
    ["#805d3e", "#fffefa", "pending review label"],
    ["#6e583d", "#faf6ee", "notice icon"],
    ["#687b62", cssToken("paper"), "large heading accent", 3],
  ];

  for (const [foreground, background, label, minimum = 4.5] of pairs) {
    assert.ok(contrastRatio(foreground, background) >= minimum, `${label} has at least ${minimum}:1 contrast`);
  }
});
