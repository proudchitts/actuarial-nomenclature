/* One shared interface over the rule-based namer.
 * The command line, the HTTP API and the MCP server all call these functions,
 * so every route gives the same answer for the same description.
 */
"use strict";
const path = require("path");
const DATA = require(path.join(__dirname, "..", "docs", "data.js"));
const N = require(path.join(__dirname, "..", "docs", "namer.js")).create(DATA);
const T = N.terms;
const SG = require(path.join(__dirname, "..", "docs", "suggest.js")).create(DATA);

/* Optional search by meaning. It is used only if the embedding library is installed
 * (npm install @huggingface/transformers) and the vectors in docs/embeddings.js match the glossary.
 * Without it, suggestions come from word matching alone. */
let embedder = null, EMB = null, semanticState = "not tried";
async function loadSemantic() {
  if (semanticState !== "not tried") { return embedder; }
  try {
    EMB = require(path.join(__dirname, "..", "docs", "embeddings.js"));
    if (EMB.key !== SG.key) { semanticState = "off: docs/embeddings.js is out of date, run tools/build_embeddings.mjs"; return null; }
    const tf = await import("@huggingface/transformers");
    const ex = await tf.pipeline("feature-extraction", EMB.model, { dtype: "q8" });
    embedder = async (text) => Float32Array.from((await ex([text], { pooling: "mean", normalize: true })).tolist()[0]);
    semanticState = "on";
  } catch (e) {
    semanticState = "off: the embedding library is not installed (npm install @huggingface/transformers)";
  }
  return embedder;
}

function suggestionsFor(text, unknown, vecs) {
  return SG.unusedPhrases(text, unknown).map((ph, i) => ({
    words: ph,
    closest_terms: SG.rank(ph, 3, vecs ? vecs[i] : null, vecs ? EMB : null).map((c) => ({
      short_form: c.token, full_term: c.full_term, definition: c.definition, not_to_be_confused_with: c.not_to_be_confused_with,
      score: c.score, matched_by: c.how,
      revised_description: N.applyOption(text, { find: ph, replace: c.full_term.charAt(0).toLowerCase() + c.full_term.slice(1) }),
    })),
  }));
}

/* description -> candidate glossary terms for every part the namer did not use */
async function suggestTerms(description, opts) {
  const text = String(description == null ? "" : description).replace(/\s+/g, " ").trim();
  const r = N.name(text);
  let vecs = null;
  const phrases = SG.unusedPhrases(text, r.unknown);
  if (!(opts && opts.semantic === false) && phrases.length && (await loadSemantic())) {
    vecs = [];
    for (const ph of phrases) { vecs.push(await embedder(ph)); }
  }
  return {
    description: text,
    current_name: r.name || null,
    unused_words: r.unknown.slice(),
    search_by_meaning: vecs ? "on" : (opts && opts.semantic === false ? "off: not asked for" : semanticState),
    suggestions: suggestionsFor(text, r.unknown, vecs),
    next_step: phrases.length
      ? "These are candidates, not answers. Pick a term only if its definition is what was meant, then call name_variable with its revised_description. If no term fits, the concept is not in the glossary: say so, and use a private token that starts with Z if a name is needed now."
      : "Every word was used. Nothing to suggest.",
  };
}

/* the glossary entry of every token in a name, so a caller can show what each part means */
function termList(slots) {
  const seen = [];
  (slots || []).forEach((s) => { [s.tok, s.arg].forEach((t) => { if (t && T[t] && seen.indexOf(t) < 0) { seen.push(t); } }); });
  return seen.map((t) => ({ short_form: t, full_term: T[t].full, slot: T[t].slot, definition: T[t].def, not_to_be_confused_with: T[t].not, source_checked: T[t].source || null, extension_set: T[t].ext || null }));
}

/* sibling names a model usually holds beside this one: the other parties and the other end of the period */
function seeAlso(name, slots) {
  if (!name) { return []; }
  const toks = name.split("_");
  const out = [];
  const party = (slots || []).filter((s) => s.slot === "PARTY")[0];
  const add = (n, why) => { if (n !== name && N.validate(n).ok && !out.some((o) => o.name === n)) { out.push({ name: n, reads_as: N.decode(n).canonical, relation: why }); } };
  if (party && (party.tok === "RI" || party.tok === "NET")) {
    const i = toks.indexOf(party.tok);
    add(toks.filter((_, k) => k !== i).join("_"), "gross of reinsurance");
    add(toks.map((t, k) => (k === i ? (party.tok === "RI" ? "NET" : "RI") : t)).join("_"), party.tok === "RI" ? "net of reinsurance" : "reinsurance ceded");
  }
  if (toks.indexOf("EOP") >= 0) { add(toks.map((t) => (t === "EOP" ? "BOP" : t)).join("_"), "start of period"); }
  if (toks.indexOf("BOP") >= 0) { add(toks.map((t) => (t === "BOP" ? "EOP" : t)).join("_"), "end of period"); }
  return out;
}

function meta(name, slots, kind) {
  const terms = termList(slots);
  return {
    name_lower_case: name ? name.toLowerCase() : null,
    value_type: kind ? kind.value_type : null,
    unit: kind ? kind.unit : null,
    terms: terms,
    extension_sets: terms.map((t) => t.extension_set).filter((x, i, arr) => x && arr.indexOf(x) === i),
    see_also: seeAlso(name, slots),
    standard_version: N.version,
  };
}

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
    group: r.group || null,
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
  if (r.name) { Object.assign(out, meta(r.name, r.slots, r.kind)); } else { out.standard_version = N.version; }
  if (out.unused_words.length) {
    out.suggestions = suggestionsFor(text, r.unknown, null);
    out.warnings.push("These words were not used and the name ignores them: " + out.unused_words.join(", ") + ".");
  }
  if (out.status === "needs_detail") {
    out.next_step = "Do not invent a name. A must_answer question means a word has two meanings. Get its answer from the user or from the source material, never from your own judgement, then call again with the matching revised_description. Answer one question per call: each revised_description changes only its own point.";
  } else if (out.status === "ok" && !out.clean) {
    out.next_step = "A name was built but part of the description was not used. Check reads_as against what was meant before using the name.";
  }
  return out;
}

/* name -> English, with rule check */
function readName(name) {
  const d = N.decode(String(name == null ? "" : name));
  return Object.assign({ name: d.name, valid: !!d.ok, reads_as: d.canonical || null, group: d.group || null, private_token: !!d.private, slots: slotList(d.ok ? d.slots : []), problems: d.problems },
    d.ok && !d.private ? meta(d.name, d.slots, d.kind) : { standard_version: N.version });
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
    group: row.result.group || null,
    value_type: row.result.kind ? row.result.kind.value_type : null,
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
    by_group: N.groups.map((g) => ({ group: g, names: results.filter((r) => r.group === g && r.name).map((r) => r.name) })).filter((g) => g.names.length),
    results: results,
  };
}

/* the tokens of a table name that its columns must carry: everything after MOD and TBL */
function innerTokens(tableName) {
  let t = String(tableName || "").trim().toUpperCase().split("_");
  if (t[0] === "MOD") { t = t.slice(1); }
  if (t[0] === "TBL") { t = t.slice(1); }
  return t;
}

/* A table with several columns. Each column is a variable with its own valid name,
 * and every token of the table's name appears in every column's name. */
function checkTable(table, columns) {
  const tname = table ? String(table).trim().toUpperCase() : null;
  const cols = (columns || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean);
  const problems = [];
  const out = { table: tname, valid: false, columns: [], problems };
  if (tname) {
    const tv = N.decode(tname);
    out.table_reads_as = tv.canonical || null;
    if (!/^TBL_/.test(tname)) { problems.push("A table name starts with TBL."); }
    if (!tv.ok) { problems.push("The table name breaks the rules: " + tv.problems.join(" ")); }
  }
  const need = tname ? innerTokens(tname) : [];
  cols.forEach((c) => {
    const d = N.decode(c);
    const have = c.split("_");
    const missing = need.filter((t) => have.indexOf(t) < 0);
    const row = { name: c, valid: !!d.ok, reads_as: d.canonical || null, missing_tokens: missing, problems: d.problems.slice() };
    if (missing.length) { row.problems.push("It does not carry " + missing.join(", ") + " from the table name, so the table cannot be found from this name."); }
    if (row.problems.length) { problems.push(c + ": " + row.problems.join(" ")); }
    out.columns.push(row);
  });
  // the name the columns themselves point to: TBL plus the tokens they all share, in the order of the first column
  if (cols.length) {
    const shared = cols[0].split("_").filter((t) => cols.every((c) => c.split("_").indexOf(t) >= 0));
    const guess = shared.length ? "TBL_" + shared.join("_") : null;
    out.suggested_table_name = guess && N.validate(guess).ok ? guess : null;
    if (!out.suggested_table_name) { problems.push("The columns share no leading item, so they do not belong in one table under one name."); }
  }
  out.valid = problems.length === 0;
  return out;
}

/* Which table holds a variable: the table whose name tokens are all in the variable's name, with the most tokens. */
function tableOf(variable, tables) {
  const v = String(variable || "").trim().toUpperCase();
  const have = v.split("_");
  const fits = (tables || []).map((t) => String(t).trim().toUpperCase()).filter((t) => /^TBL_/.test(t))
    .map((t) => ({ table: t, tokens: innerTokens(t) })).filter((t) => t.tokens.length && t.tokens.every((x) => have.indexOf(x) >= 0))
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const best = fits.filter((f) => fits.length && f.tokens.length === fits[0].tokens.length).map((f) => f.table);
  return { variable: v, table: best.length === 1 ? best[0] : null, candidates: fits.map((f) => f.table),
    note: best.length === 1 ? null : best.length ? "More than one table fits equally well. Their names must differ by a token the variable carries." : "No table name is contained in this variable name." };
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
  "MEASURE: none means an amount. CNT count, RATE (takes a time base ANN, MTH or PRD only when the description gives one), PROB, PV (present value, measured at the start of the period, never takes a time point), FAC, IND, FLG, IDX. PER plus one item builds a ratio.",
  "TIME: time base ANN/MTH/PRD, time point BOP/MOP/EOP/INC, then BEF or AFT plus one token. A time point is written only when the description states one and is never required. Do not add one that the description does not give. PV and FUT carry their own point (start of period), ACC and CUM theirs (end of period), so they never take one. There is no valuation date token: the value at the valuation date is the value at the first time step.",
  "Lapse (policy ends through non-payment, nothing paid), surrender (policy ends, a value is paid), partial withdrawal (policy continues), paid-up, maturity and expiry are different terms. Say which one.",
  "Every name falls in one group, worked out from its tokens: " + N.groups.join(", ") + ".",
  "A table is TBL plus the name of the variable it holds. A table with several columns is TBL plus the tokens its columns share, and each column is a full variable name that carries those tokens, so the table can be found from the variable name. A compute module is MOD plus the name of what it produces.",
  "Only what is said: a name carries only what the description states. Never add a time point, time base, basis, party or qualifier that the description does not give, even if you know the value depends on it. Pass the user's description as written.",
  "The standard never guesses. If a description is vague, ask. Do not make up a token: every token must be in the glossary.",
].join("\n");

module.exports = { checkTable, tableOf, suggestTerms, nameVariable, readName, checkList, searchGlossary, RULES, version: N.version, termCount: Object.keys(T).length };
