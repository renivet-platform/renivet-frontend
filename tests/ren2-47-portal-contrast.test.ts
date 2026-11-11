import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

describe("REN2-95 portal contrast", () => {
  it("keeps foreground text colors at WCAG AA against the white workspace surface", () => {
    const css = readFileSync("src/features/seller/w2-portal-design-preview.module.css", "utf8");
    const foregrounds = [...css.matchAll(/(?<![\w-])color:\s*(#[0-9a-f]{6})/gi)].map((match) => match[1]!);
    assert.ok(foregrounds.length > 0, "expected portal foreground colors");

    for (const color of foregrounds) {
      const ratio = 1.05 / (luminance(color) + 0.05);
      assert.ok(ratio >= 4.5, `${color} has contrast ${ratio.toFixed(2)}:1 against white`);
    }
  });
});
