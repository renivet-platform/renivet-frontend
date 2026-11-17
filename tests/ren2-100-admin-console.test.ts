import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("REN2-100 authenticated admin review console", () => {
  it("loads all five persisted queues and exposes useful empty, denied, retry and detail states", () => {
    const source = readFileSync("src/features/admin/operations-console.tsx", "utf8");
    for (const queue of ["taxonomy", "quality", "pricing", "claims", "publishing"]) assert.match(source, new RegExp(`id: "${queue}"`));
    assert.match(source, /getCurrentSession/);
    assert.match(source, /w2Request/);
    assert.match(source, /global admin permission/);
    assert.match(source, /Queue is empty/);
    assert.match(source, /Retry/);
    assert.match(source, /EXACT PERSISTED ITEM/);
    assert.doesNotMatch(source, /No protected data is loaded/);
    assert.doesNotMatch(source, /Review action unavailable/);
  });

  it("steps up only when the server reports enforced MFA and keeps CSRF/idempotency on every decision", () => {
    const source = readFileSync("src/features/admin/operations-console.tsx", "utf8");
    assert.match(source, /stepUpWithMfa/);
    assert.match(source, /shouldRequestMfaStepUp\(session\.mfaEnforcementMode\)/);
    assert.match(source, /sessionReady && shouldRequestMfaStepUp\(mfaEnforcementMode\) \? .*id="review-mfa".*required/);
    assert.match(source, /csrfToken/);
    assert.match(source, /idempotencyKey/);
    assert.match(source, /expectedRevisionId/);
    assert.match(source, /approvedRevisionId/);
  });

  it("shows maker-checker context and blocks self-submitted or expired decisions", () => {
    const source = readFileSync("src/features/admin/operations-console.tsx", "utf8");
    assert.match(source, /submittedBy/);
    assert.match(source, /sessionUserId/);
    assert.match(source, /maker-checker/i);
    assert.match(source, /expiresAt/);
    assert.match(source, /expired/i);
    assert.match(source, /disabled=.*self|self.*disabled/i);
  });

  it("keeps keyboard focus visible and contrasts text against the console surface", () => {
    const css = readFileSync("src/features/admin/operations-console.module.css", "utf8");
    assert.match(css, /:focus-visible/);
    assert.match(css, /@media \(max-width: 720px\)/);
    const colors = [...css.matchAll(/(?<![\w-])color:\s*(#[0-9a-f]{6})/gi)].map((match) => match[1]!.toLowerCase());
    const luminance = (hex: string) => {
      const values = hex.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16) / 255)
        .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * values[0]! + 0.7152 * values[1]! + 0.0722 * values[2]!;
    };
    for (const color of colors.filter((item) => item !== "#fff9ea")) {
      const [light, dark] = [luminance(color), luminance("#ffffff")].sort((a, b) => b - a);
      assert.ok((light! + 0.05) / (dark! + 0.05) >= 4.5, `${color} needs WCAG AA contrast on the white panel`);
    }
    assert.ok((luminance("#fff9ea") + 0.05) / (luminance("#174c3e") + 0.05) >= 4.5);
  });
});
