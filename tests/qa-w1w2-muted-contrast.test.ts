import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((end) => Number.parseInt(hex.slice(end, end + 2), 16) / 255);
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

function contrast(a: string, b: string): number {
  const first = luminance(a); const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const auditedFiles = [
  "src/features/admin/brand-approvals.module.css",
  "src/features/seller/seller-onboarding-prototype.module.css",
  "src/features/seller/product-workspace.module.css",
  "src/features/seller/team-exact.module.css",
  "src/features/seller/import-inventory-prototype.module.css",
  "src/features/admin/admin-staff-directory.module.css",
  "src/features/seller/brand-workspace.module.css",
  "src/features/admin/taxonomy-admin.module.css",
  "src/features/seller/product-editor-prototype.module.css",
];

test("QA muted UI text contrast remains WCAG AA on white and the lightest working surfaces", () => {
  for (const background of ["#ffffff", "#faf9f6", "#f2f4f2", "#e9ede9"]) {
    assert.ok(contrast("#56645c", background) >= 4.5, `#56645c on ${background} must reach 4.5:1`);
  }

  // Prevent the known muted foreground colors from recurring in the panels
  // where they caused repeated issues across viewport/browser combinations.
  const oldColors = ["#79817c", "#687d73", "#a0b2a8", "#71847a", "#6f7a72", "#6b776f", "#7c8b7f", "#777879"];
  for (const path of auditedFiles) {
    const stylesheet = readFileSync(path, "utf8");
    assert.match(stylesheet, /color\s*:\s*#56645c/i, `${path} includes the accessible muted foreground`);
    for (const color of oldColors) {
      assert.doesNotMatch(stylesheet, new RegExp(`\\bcolor\\s*:\\s*${color}\\b`, "i"), `${path} must not regress to ${color}`);
    }
  }
});
