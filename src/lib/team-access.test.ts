import assert from "node:assert/strict";
import test from "node:test";
import { wouldRemoveLastAdmin } from "./team-access";

test("prevents demoting the final administrator", () => {
  assert.equal(wouldRemoveLastAdmin("ADMIN", "TECHNICIAN", 1), true);
  assert.equal(wouldRemoveLastAdmin("ADMIN", "APPROVER", 1), true);
});

test("allows role changes when another administrator remains", () => {
  assert.equal(wouldRemoveLastAdmin("ADMIN", "TECHNICIAN", 2), false);
  assert.equal(wouldRemoveLastAdmin("TECHNICIAN", "APPROVER", 1), false);
  assert.equal(wouldRemoveLastAdmin("ADMIN", "ADMIN", 1), false);
});
