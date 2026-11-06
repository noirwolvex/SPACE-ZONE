import assert from "node:assert/strict";
import { safeRedirectPath } from "../lib/redirect";

const cases = [
  ["/dashboard", "/dashboard"],
  ["/books/123?tab=read", "/books/123?tab=read"],
  ["https://evil.example", "/"],
  ["//evil.example", "/"],
  ["javascript:alert(1)", "/"],
  ["", "/"],
  [null, "/"],
] as const;

for (const [input, expected] of cases) {
  assert.equal(safeRedirectPath(input), expected, `unexpected redirect result for ${String(input)}`);
}

assert.equal(safeRedirectPath("https://evil.example", "/login"), "/login");

console.log("Security regression tests passed.");
