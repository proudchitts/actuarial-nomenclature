#!/usr/bin/env node
/* Builds docs/embeddings.js: one small vector for every glossary term name, everyday word and definition.
 * The optional "search by meaning" step compares what the user typed with these vectors.
 *
 * Needs the embedding library once, on the machine that builds:
 *     npm install --no-save @huggingface/transformers
 *     node tools/build_embeddings.mjs
 * Run it again whenever glossary.md or tools/lexicon.json changes (after tools/build.py).
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA = require(path.join(root, "docs", "data.js"));
const SG = require(path.join(root, "docs", "suggest.js")).create(DATA);
const { pipeline } = await import("@huggingface/transformers");
const ex = await pipeline("feature-extraction", SG.modelId, { dtype: "q8" });
const texts = SG.strings.map((s) => s.s);
const vecs = [];
for (let i = 0; i < texts.length; i += 64) {
  const o = await ex(texts.slice(i, i + 64), { pooling: "mean", normalize: true });
  vecs.push(...o.tolist());
}
const dim = vecs[0].length;
const q = new Int8Array(vecs.length * dim);
vecs.forEach((v, i) => v.forEach((x, d) => { q[i * dim + d] = Math.max(-127, Math.min(127, Math.round(x * 127))); }));
const out = { model: SG.modelId, dim, key: SG.key, items: SG.strings.map((s) => ({ t: s.t, w: s.w })), vecs: Buffer.from(q.buffer).toString("base64") };
fs.writeFileSync(path.join(root, "docs", "embeddings.js"),
  "// Built by tools/build_embeddings.mjs. Do not edit by hand.\nvar NOMEN_EMB = " + JSON.stringify(out) + ";\nif (typeof module !== 'undefined') { module.exports = NOMEN_EMB; }\n");
console.log("Wrote docs/embeddings.js: " + vecs.length + " vectors of " + dim + " numbers, key " + SG.key);
