import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contrastRatio } from "../src/features/identity/auth-theme";
import { getOnboardingPrototypeScreens, getPrototypeStateCopy } from "../src/features/identity/onboarding-prototype";

const prototypeCss = readFileSync(new URL("../src/features/identity/onboarding-prototype.module.css", import.meta.url), "utf8");

function cssToken(name: string): string {
  const value = prototypeCss.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  assert.ok(value, `CSS token --${name} exists`);
  return value;
}

test("W1 onboarding preview covers the agreed customer, seller, and admin entry screens", () => {
  const screens = getOnboardingPrototypeScreens();
  assert.deepEqual(screens.map(screen => screen.sourceId), ["CU-08", "CU-09", "CU-09", "SE-20", "AD-01", "AD-06"]);
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
