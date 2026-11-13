import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { adminOperationAreas } from "../src/features/admin/operations-console-model";

describe("REN2-100 admin operations console", () => {
  it("covers every requested operations area without inventing review data or enabling unsafe actions", () => {
    assert.deepEqual(adminOperationAreas.map((area) => area.id), [
      "overview", "taxonomy", "quality", "pricing", "claims", "publishing",
    ]);

    for (const area of adminOperationAreas) {
      assert.ok(area.title.length > 3, `${area.id} needs a useful title`);
      assert.ok(area.description.length > 30, `${area.id} needs explanatory copy`);
      assert.ok(area.availability.length > 30, `${area.id} needs an accurate API boundary`);
      assert.equal(area.actionAvailable, false, `${area.id} must not imply an unverified action is usable`);
    }

    assert.match(adminOperationAreas.find((area) => area.id === "taxonomy")!.availability, /draft and publish endpoints are registered/i);
    assert.match(adminOperationAreas.find((area) => area.id === "pricing")!.availability, /no reviewer queue or safe read-by-id/i);
    assert.match(adminOperationAreas.find((area) => area.id === "claims")!.availability, /no reviewer queue or safe evidence read/i);
    assert.match(adminOperationAreas.find((area) => area.id === "quality")!.availability, /no registered review queue or decision route/i);
    assert.match(adminOperationAreas.find((area) => area.id === "publishing")!.availability, /no registered publish or restriction route/i);
  });

  it("renders as a non-sensitive server page with labelled navigation and no API fetch", () => {
    const component = readFileSync("src/features/admin/operations-console.tsx", "utf8");
    const page = readFileSync("src/app/(admin)/operations/page.tsx", "utf8");

    assert.match(component, /aria-label="Operations sections"/);
    assert.match(component, /aria-labelledby="operations-title"/);
    assert.match(component, /No protected data is loaded/);
    assert.match(component, /adminOperationAreas/);
    assert.doesNotMatch(component, /fetch\s*\(/);
    assert.doesNotMatch(component, /<button[^>]*type="submit"/);
    assert.match(page, /AdminOperationsConsole/);
    assert.match(page, /robots: \{ index: false, follow: false \}/);
  });

  it("keeps console text at WCAG AA contrast against the light surface and brand mark text against forest", () => {
    const css = readFileSync("src/features/admin/operations-console.module.css", "utf8");
    const colors = [...css.matchAll(/(?<![\w-])color:\s*(#[0-9a-f]{6})/gi)].map((match) => match[1]!.toLowerCase());
    const luminance = (hex: string) => {
      const values = hex.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16) / 255)
        .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * values[0]! + 0.7152 * values[1]! + 0.0722 * values[2]!;
    };
    const contrast = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0]! + 0.05) / (values[1]! + 0.05);
    };

    assert.ok(colors.length > 0, "expected console foreground colors");
    for (const color of colors.filter((item) => item !== "#fff9ea")) {
      assert.ok(contrast(color, "#ffffff") >= 4.5, `${color} has insufficient contrast against the light surface`);
    }
    assert.ok(contrast("#fff9ea", "#174c3e") >= 4.5, "brand mark text must remain legible against forest green");
  });
});
