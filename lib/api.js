/* One shared interface over the rule-based namer.
 * The command line, the HTTP API and the MCP server all call these functions,
 * so every route gives the same answer for the same description.
 */
"use strict";
const path = require("path");
const DATA = require(path.join(__dirname, "..", "docs", "data.js"));
const N = require(path.join(__dirname, "..", "docs", "namer.js")).create(DATA);
const T = N.terms;

function slotList(slots) {
  return (slots || []).map((s) => ({
    slot: s.slot,
    token: s.arg ? s.tok + "_" + s.arg : s.tok,
    term: T[s.tok] ? T[s.tok].full + (s.arg && T[s.arg] ? " " + T[s.arg].full.toLowerCase() : "") : "instance",
  }));
}

/* description -> name. Never guesses: a vague description comes back as needs_detail with questions. */
function nameVariable(description) {
  const text = String(description == null ? "" : description).replace(/\s+/g, " ").trim();
  const r = N.name(text);
  const out = {
    status: r.status === "ok" ? "ok" : r.status === "needs" ? "needs_detail" : "failed",
    name: r.name || null,
    reads_as: r.canonical || null,
    description: text,
    slots: slotList(r.name ? r.slots : []),
    questions: r.questions.map((q) => ({
      question: q.text,
      must_answer: !!q.hard,
      options: q.options.map((o) => ({ label: o.label, revised_description: N.applyOption(text, o) })),
    })),
    warnings: r.notes.slice(),
    unused_words: r.unknown.slice(),
    clean: r.status === "ok" && !r.warn,
  };
  if (out.unused_words.length) {
    out.warnings.push("These words were not used and the name ignores them: " + out.unused_words.join(", ") + ".");
  }
  if (out.status === "needs_detail") {
    out.next_step = "Do not invent a name. Get the answer to each must_answer question from the user or from the source material, then call again with the matching revised_description. Answer one question per call: each revised_description changes only its own point.";
  } else if (out.status === "ok" && !out.clean) {
    out.next_step = "A name was built but part of the description was not used. Check reads_as against what was meant before using the name.";
  }
  return out;
}

/* name -> English, with rule check */
function readName(name) {
  const d = N.decode(String(name == null ? "" : name));
  return { name: d.name, valid: !!d.ok, reads_as: d.canonical || null, private_token: !!d.private, slots: slotList(d.ok ? d.slots : []), problems: d.problems };
}

/* many variables at once. items: [{description, name?}] or plain strings */
function checkList(items) {
  const lines = (items || []).map((it) => {
    if (typeof it === "string") { return it.replace(/\s+/g, " "); }
    const desc = String(it.description || "").replace(/\s+/g, " ");
    return it.name ? String(it.name).trim() + " | " + desc : desc;
  });
  const rows = N.batch(lines.join("\n"));
  const results = rows.map((row) => ({
    line: row.line,
    description: row.description,
    given_name: row.given || null,
    name: row.result.name || null,
    reads_as: row.result.canonical || null,
    status: row.flags.length ? "fix" : row.result.warn ? "check" : "ok",
    shares_name_with_another_line: !!row.duplicate,
    problems: row.flags.concat(row.result.status === "ok" && row.result.warn ? row.result.notes : []),
    unused_words: row.result.unknown,
  }));
  return {
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    check: results.filter((r) => r.status === "check").length,
    fix: results.filter((r) => r.status === "fix").length,
    lines_sharing_a_name: results.filter((r) => r.shares_name_with_another_line).length,
    results: results,
  };
}

function searchGlossary(query, limit) {
  const q = String(query || "").trim().toLowerCase();
  const score = (k) => {
    const t = T[k];
    if (k.toLowerCase() === q) { return 0; }
    if (t.full.toLowerCase() === q) { return 1; }
    if (t.also.some((a) => a.toLowerCase() === q)) { return 2; }
    if (t.full.toLowerCase().indexOf(q) >= 0) { return 3; }
    if (t.also.join(" ").toLowerCase().indexOf(q) >= 0) { return 4; }
    if (q.length > 3 && t.def.toLowerCase().indexOf(q) >= 0) { return 5; }
    return 9;
  };
  const hits = Object.keys(T).map((k) => [score(k), k]).filter((x) => !q || x[0] < 9).sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
  return {
    query: q,
    count: hits.length,
    terms: hits.slice(0, limit || 10).map(([, k]) => ({
      short_form: k, full_term: T[k].full, slot: T[k].slot, family: T[k].family, also_called: T[k].also,
      definition: T[k].def, not_to_be_confused_with: T[k].not, related: T[k].related || [], source_checked: T[k].source || null,
    })),
  };
}

const RULES = [
  "Open nomenclature for life insurance projection model variables, version " + N.version + ".",
  "A name is tokens joined by underscores, in this fixed slot order: ITEM _ KIND _ MOVE _ PARTY _ BASIS _ MEASURE _ TIME.",
  "ITEM is required and is the head noun (what the number is an amount, count or rate of). KIND narrows it (up to two). MOVE turns a balance into part of its change (new business, release, accretion).",
  "PARTY: RI reinsurance ceded, NET net of reinsurance, SH shareholder, PH policyholder. Gross of reinsurance is implied and never written.",
  "BASIS is written only when the description states one (BE, PRC, IFL, IFC, EV, SII, SAM ...).",
  "MEASURE: none means an amount. CNT count, RATE (must have a time base ANN, MTH or PRD), PROB, PV (must have a time point), FAC, IND, FLG, IDX. PER plus one item builds a ratio.",
  "TIME: time base ANN/MTH/PRD, time point BOP/MOP/EOP/T0/INC, then BEF or AFT plus one token. A value at an instant must have a time point. A flow over the period has none.",
  "Lapse (policy ends through non-payment, nothing paid), surrender (policy ends, a value is paid), partial withdrawal (policy continues), paid-up, maturity and expiry are different terms. Say which one.",
  "The standard never guesses. If a description is vague, ask. Do not make up a token: every token must be in the glossary.",
].join("\n");

module.exports = { nameVariable, readName, checkList, searchGlossary, RULES, version: N.version, termCount: Object.keys(T).length };
