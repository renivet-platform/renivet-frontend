import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedPrivateMediaUploadUrl } from "../src/features/seller/private-media-upload";

test("local media uploads accept HTTP only on loopback during development", () => {
  assert.equal(isAllowedPrivateMediaUploadUrl("http://127.0.0.1:4000/upload", "development"), true);
  assert.equal(isAllowedPrivateMediaUploadUrl("http://localhost:4000/upload", "development"), true);
  assert.equal(isAllowedPrivateMediaUploadUrl("http://[::1]:4000/upload", "development"), true);
  assert.equal(isAllowedPrivateMediaUploadUrl("http://192.168.1.5:4000/upload", "development"), false);
  assert.equal(isAllowedPrivateMediaUploadUrl("http://127.0.0.1:4000/upload", "production"), false);
});

test("private media uploads still require HTTPS outside the local loopback exception", () => {
  assert.equal(isAllowedPrivateMediaUploadUrl("https://storage.example.test/upload", "development"), true);
  assert.equal(isAllowedPrivateMediaUploadUrl("https://storage.example.test/upload", "production"), true);
  assert.equal(isAllowedPrivateMediaUploadUrl("http://user:pass@127.0.0.1:4000/upload", "development"), false);
  assert.equal(isAllowedPrivateMediaUploadUrl("not a url", "development"), false);
});
