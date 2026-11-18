import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ren2_117Screens } from "../src/features/ren2-117/screen-catalog";

test("REN2-117 catalog covers the complete approved 40-screen inventory", () => {
  assert.equal(ren2_117Screens.length, 40);
  assert.equal(new Set(ren2_117Screens.map((screen) => screen.id)).size, 40);
  assert.ok(ren2_117Screens.every((screen) => screen.route.startsWith("/")));
});

test("W3 context screens are clearly marked and avoid seller route collisions", () => {
  const w3Screens = ren2_117Screens.filter((screen) => screen.wave === "W3 context");
  assert.deepEqual(w3Screens.map((screen) => screen.id), ["CU-01", "CU-03", "CU-05A", "CU-05B", "CU-06"]);
  assert.ok(w3Screens.every((screen) => screen.route === "/" || screen.route.startsWith("/shop")));
});

test("design routes are unique after normalizing route parameters", () => {
  const normalized = ren2_117Screens.map((screen) => screen.route.replace(/\[[^\]]+\]/g, ":param"));
  assert.equal(new Set(normalized).size, normalized.length);
});

test("every catalog route resolves to an App Router page", () => {
  const appRoot = path.join(process.cwd(), "src", "app");
  const routeFiles: string[] = [];
  function visit(directory: string, segments: string[]) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() && entry.name === "page.tsx") routeFiles.push(`/${segments.join("/")}`.replace(/\/$/, "") || "/");
      if (!entry.isDirectory()) continue;
      const routeSegment = entry.name.startsWith("(") && entry.name.endsWith(")") ? null : entry.name;
      visit(path.join(directory, entry.name), routeSegment ? [...segments, routeSegment] : segments);
    }
  }
  visit(appRoot, []);
  const routeSet = new Set(routeFiles.map((route) => route.replace(/\[[^\]]+\]/g, ":param")));
  const missing = ren2_117Screens.filter((screen) => {
    const route = screen.route.split("?")[0]!.replace(/\[[^\]]+\]/g, ":param");
    return !routeSet.has(route);
  });
  assert.deepEqual(missing.map((screen) => screen.id), []);
});
