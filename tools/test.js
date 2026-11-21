#!/usr/bin/env node
/* Tests the rule-based namer against examples.md.
 * Run from the repository root:  node tools/test.js
 *   Part A: every description must give exactly the name in the table.
 *   Part B: every name must decode.
 *   Part C: every vague headline must be refused with a question.
 */
const fs = require("fs");
const path = require("path");
const root = path.dirname(__dirname);
const N = require(path.join(root, "docs", "namer.js")).create(require(path.join(root, "docs", "data.js")));
const ex = fs.readFileSync(path.join(root, "examples.md"), "utf8");
const A = ex.split("## Part A")[1].split("## Part B")[0];
const B = ex.split("## Part B")[1].split("## Part C")[0];
const C = ex.split("## Part C")[1];
let fail = 0;
const verbose = process.argv.includes("-v");

const rowsA = [...A.matchAll(/^\| (\d+) \| (.+?) \| `([A-Z0-9_]+)` \|$/gm)];
let okA = 0, notes = 0;
for (const [, no, desc, want] of rowsA) {
  const r = N.name(desc);
  if (r.status === "ok" && r.name === want) { okA++; if (r.notes.length || r.unknown.length) { notes++; if (verbose) console.log("  note", no, want, r.notes.join(" | "), r.unknown.join(",")); } }
  else { fail++; console.log(`A${no} FAIL: "${desc}"\n      want ${want}\n      got  ${r.name || r.draft} [${r.status}] ${r.questions.map(q => q.text).join(" / ")} ${r.notes.join(" / ")}`); }
}
console.log(`Part A: ${okA} of ${rowsA.length} descriptions give the expected name (${notes} with a note).`);

const rowsB = [...B.matchAll(/^\| \d+ \| `([A-Z0-9_]+)` \|/gm)];
let okB = 0;
for (const [, name] of rowsB) {
  const d = N.decode(name);
  if (d.ok && d.canonical) { okB++; if (verbose) console.log("  ", name, "=>", d.canonical); const back = N.name(d.canonical); if (back.name !== name) { fail++; console.log(`B FAIL round trip: ${name} -> "${d.canonical}" -> ${back.name || back.draft} [${back.status}]`); } }
  else { fail++; console.log("B FAIL:", name, d.problems.join(" ")); }
}
console.log(`Part B: ${okB} of ${rowsB.length} names decode and their canonical description gives the same name back.`);

// every Part A name must also round trip through its canonical description
let rt = 0;
for (const [, no, , want] of rowsA) {
  const d = N.decode(want);
  const back = d.ok ? N.name(d.canonical) : { status: "fail" };
  if (back.name === want) { rt++; } else { fail++; console.log(`A${no} ROUND TRIP FAIL: ${want} -> "${d.canonical}" -> ${back.name || back.draft} [${back.status}] ${(back.questions || []).map(q => q.text).join(" / ")}`); }
}
console.log(`Round trip: ${rt} of ${rowsA.length} names decode to a canonical description that gives the same name back.`);

const heads = [...C.matchAll(/^### C\d+\. "(.+?)"/gm)];
let okC = 0;
for (const [, phrase] of heads) {
  const r = N.name(phrase);
  if (r.status !== "ok" || r.questions.length) { okC++; } else { fail++; console.log(`C FAIL: "${phrase}" was named ${r.name} with no question`); }
}
console.log(`Part C: ${okC} of ${heads.length} vague descriptions are refused or questioned.`);

// no two different Part A descriptions may share a name
const seen = {};
for (const [, no, , want] of rowsA) { if (seen[want]) { fail++; console.log(`DUPLICATE: ${want} in rows ${seen[want]} and ${no}`); } seen[want] = no; }

if (fail) { console.log(`\nFAILED: ${fail} problem(s)`); process.exit(1); }
console.log("\nAll namer tests passed.");
