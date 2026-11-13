import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("CI visual Chrome startup", () => {
  it("overrides inherited D-Bus addresses with valid Unix addresses for both headless Chrome checks", () => {
    for (const path of ["tests/visual-regression.mjs", "tests/auth-screen.e2e.mjs"]) {
      const source = readFileSync(path, "utf8");

      assert.match(source, /DBUS_SESSION_BUS_ADDRESS:\s*["']unix:path=\/dev\/null["']/);
      assert.match(source, /DBUS_SYSTEM_BUS_ADDRESS:\s*["']unix:path=\/dev\/null["']/);
      assert.match(source, /XDG_RUNTIME_DIR:\s*["']["']/);
      assert.match(source, /env:\s*chromeEnv/);
    }
  });
});
