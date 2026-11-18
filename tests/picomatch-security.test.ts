import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const picomatch = require("picomatch") as {
  makeRe(pattern: string): RegExp;
  isMatch(input: string, pattern: string): boolean;
};

test("literalizes unanchored repeated extglobs that trigger CVE-2026-112366", () => {
  assert.equal(picomatch.makeRe("+(*a)").source, "^(?:\\+\\(\\*a\\))$");
  assert.equal(picomatch.makeRe("*(*a)").source, "^(?:\\*\\(\\*a\\))$");
  assert.equal(picomatch.makeRe("+(a|*a)").source, "^(?:\\+\\(a\\|\\*a\\))$");
  assert.equal(picomatch.isMatch("a".repeat(30) + "!", "+(*a)"), false);
  assert.equal(picomatch.isMatch("a".repeat(30) + "!", "*(*a)"), false);
});

test("preserves safe repeated extglob patterns", () => {
  assert.equal(picomatch.isMatch("abc", "+(*)"), true);
  assert.equal(picomatch.isMatch("abc", "+(a*)"), true);
  assert.equal(picomatch.isMatch("aaa", "+(a*)"), true);
});
