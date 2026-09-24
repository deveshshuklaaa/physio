// Run: node src/lib/markdown.test.mjs
import assert from "node:assert/strict";
import { parseMarkdown, splitInline } from "./markdown.js";

const sample = `## How the session went
Hello. You completed 7 reps.
Second line joins.

## What to adjust

- Not deep enough (appeared in 2 out of 7 reps)
  The rule notes a fail.
  To adjust this, sit back.
- Second item

1. First
2. Second
Plain after list.`;

assert.deepEqual(parseMarkdown(sample), [
  { type: "h", level: 2, text: "How the session went" },
  { type: "p", text: "Hello. You completed 7 reps. Second line joins." },
  { type: "h", level: 2, text: "What to adjust" },
  {
    type: "ul",
    items: [
      ["Not deep enough (appeared in 2 out of 7 reps)", "The rule notes a fail.", "To adjust this, sit back."],
      ["Second item"],
    ],
  },
  { type: "ol", items: [["First"], ["Second"]] },
  { type: "p", text: "Plain after list." },
]);

assert.deepEqual(parseMarkdown(""), []);
assert.deepEqual(parseMarkdown(null), []);

assert.deepEqual(splitInline("a **bold** and *it* <b>x</b>"), [
  { t: "text", v: "a " },
  { t: "b", v: "bold" },
  { t: "text", v: " and " },
  { t: "i", v: "it" },
  { t: "text", v: " <b>x</b>" },
]);
assert.deepEqual(splitInline("2 * 3 = 6"), [{ t: "text", v: "2 * 3 = 6" }]);

console.log("markdown: all checks passed");
