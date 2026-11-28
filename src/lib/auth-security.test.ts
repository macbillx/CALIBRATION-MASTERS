import assert from "node:assert/strict";
import test from "node:test";
import { digestToken, normalizeEmail, validatePassword } from "./auth-security";

test("normalizes valid email addresses and rejects invalid input", () => {
  assert.equal(normalizeEmail("  User@Example.com "), "user@example.com");
  assert.equal(normalizeEmail("bad address"), null);
  assert.equal(normalizeEmail(null), null);
});

test("enforces bcrypt's byte limit as well as a minimum password length", () => {
  assert.match(validatePassword("short") ?? "", /at least 12/);
  assert.equal(validatePassword("a-secure-passphrase"), null);
  assert.match(validatePassword("é".repeat(37)) ?? "", /72 bytes/);
});

test("stores a one-way digest rather than a submitted token", () => {
  const digest = digestToken("one-time-secret");
  assert.notEqual(digest, "one-time-secret");
  assert.equal(digestToken("one-time-secret"), digest);
});
