import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("REN2-95 W2 portal design preview", () => {
  it("labels the static prototype, maps the seller and operations journeys, and does not imply live actions", () => {
    const component = readFileSync("src/features/seller/w2-portal-design-preview.tsx", "utf8");
    const page = readFileSync("src/app/(seller)/portal-preview/page.tsx", "utf8");

    assert.match(component, /Design preview/);
    assert.match(component, /No live API calls or business data/);
    assert.match(component, /Figma is deferred for this implementation pass by owner direction/);
    assert.match(component, /Review context is not available yet/);
    assert.doesNotMatch(component, /One queue for taxonomy/);
    assert.match(component, /Products/);
    assert.match(component, /Imports/);
    assert.match(component, /Inventory/);
    assert.match(component, /Operations/);
    assert.match(component, /G05 · G06 · G07 · G08 · G16 · G17/);
    assert.match(component, /G07 · G08 · G14 · G17/);
    assert.match(component, /aria-label="W2 portal preview navigation"/);
    assert.match(component, /aria-labelledby="workspace-title"/);
    assert.match(component, /type="button" disabled/);
    assert.match(page, /Static design handoff only/);
    assert.doesNotMatch(component, /fetch\s*\(/);
  });
});
