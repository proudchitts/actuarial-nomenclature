/* Suggests glossary terms for words the namer did not recognise.
 * Two scorers:
 *   lexical  - word stems, spelling distance and overlap with definitions. Always available.
 *   semantic - cosine similarity from a small local embedding model. Optional.
 * It only proposes. A person or the calling program confirms, and the rule-based namer builds the name.
 * Works in a browser (window.NomenSuggest) and in Node (require).
 */
(function (root) {
  "use strict";
  var STOPW = "the a an of on for from in under within to at by that which as with over during is are was be been and or this these those its their all each any it who if there also then than when where what we you they our your how per not no do does can may will would should must have has had out up off into about some one".split(" ");

  function words(s) { return String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean); }
  function stem(w) {
    if (w.length <= 3) { return w; }
    return w.replace(/(isation|ization)$/, "ise").replace(/ies$/, "y").replace(/(ments|ment)$/, "").replace(/(ings|ing)$/, "").replace(/(ations|ation)$/, "").replace(/(ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  }
  function lev(a, b) {
    if (a === b) { return 0; }
    var m = a.length, n = b.length, i, j, prev = [], cur;
    for (j = 0; j <= n; j++) { prev[j] = j; }
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); }
      prev = cur;
    }
    return prev[n];
  }
  function content(s) { return words(s).filter(function (w) { return STOPW.indexOf(w) < 0; }); }

  function create(DATA) {
    var T = DATA.terms, toks = Object.keys(T).filter(function (k) { return k !== "GRS" && k !== "AMT"; });

    // the strings that stand for each term: its name, its everyday words, and its definition
    var strings = [];
    toks.forEach(function (k) {
      strings.push({ t: k, s: T[k].full, w: 1 });
      (T[k].also || []).forEach(function (a) { strings.push({ t: k, s: a.replace(/\(.*?\)/g, "").trim(), w: 1 }); });
      strings.push({ t: k, s: T[k].full + ": " + T[k].def, w: 0.9, def: true });
    });
    Object.keys(DATA.lexicon.phrases).forEach(function (ph) {
      var v = DATA.lexicon.phrases[ph];
      if (v.length === 1 && T[v[0]] && ph.split(" ").length <= 4) { strings.push({ t: v[0], s: ph, w: 1, lex: true }); }
    });

    // inverse document frequency of stems over definitions, so common words count less
    var df = {}, nDocs = toks.length;
    toks.forEach(function (k) {
      var seen = {};
      content(T[k].full + " " + (T[k].also || []).join(" ") + " " + T[k].def).forEach(function (w) { seen[stem(w)] = 1; });
      Object.keys(seen).forEach(function (s) { df[s] = (df[s] || 0) + 1; });
    });
    function idf(s) { return Math.log(1 + nDocs / (1 + (df[s] || 0))); }
    var nameStems = {}, defStems = {};
    toks.forEach(function (k) {
      nameStems[k] = strings.filter(function (x) { return x.t === k && !x.def; }).map(function (x) { return content(x.s).map(stem); });
      defStems[k] = content(T[k].def).map(stem);
    });

    function lexical(query) {
      var q = content(query).map(stem);
      var out = {};
      if (!q.length) { return out; }
      var qw = q.reduce(function (a, s) { return a + idf(s); }, 0);
      toks.forEach(function (k) {
        var best = 0;
        nameStems[k].forEach(function (ns) {
          if (!ns.length) { return; }
          var hit = 0;
          q.forEach(function (s) {
            var m = 0;
            ns.forEach(function (n) {
              if (n === s) { m = 1; }
              else if (s.length > 4 && n.length > 4) {
                var d = lev(s, n);
                if (d <= 1) { m = Math.max(m, 0.8); } else if (d === 2 && s.length > 6) { m = Math.max(m, 0.5); }
                else if (n.indexOf(s) === 0 || s.indexOf(n) === 0) { m = Math.max(m, 0.6); }
              }
            });
            hit += m * idf(s);
          });
          var cover = hit / qw, precision = hit / ns.reduce(function (a, n) { return a + idf(n); }, 0);
          best = Math.max(best, 0.7 * cover + 0.3 * Math.min(1, precision));
        });
        var dh = 0;
        q.forEach(function (s) { if (defStems[k].indexOf(s) >= 0) { dh += idf(s); } });
        var score = Math.max(best, 0.55 * (dh / qw));
        if (score > 0.15) { out[k] = score; }
      });
      return out;
    }

    // EMB: {dim, items:[{t,w}], vecs: Int8Array or base64}, qvec: Float32Array (normalised)
    function decodeEmb(EMB) {
      if (EMB._v) { return EMB._v; }
      var bin, arr;
      if (typeof Buffer !== "undefined") { arr = new Int8Array(Buffer.from(EMB.vecs, "base64")); }
      else { bin = atob(EMB.vecs); arr = new Int8Array(bin.length); for (var i = 0; i < bin.length; i++) { arr[i] = bin.charCodeAt(i) << 24 >> 24; } }
      EMB._v = arr;
      return arr;
    }
    function semantic(qvec, EMB) {
      var v = decodeEmb(EMB), dim = EMB.dim, out = {};
      EMB.items.forEach(function (it, idx) {
        var dot = 0, n2 = 0, o = idx * dim, x;
        for (var d = 0; d < dim; d++) { x = v[o + d]; dot += qvec[d] * x; n2 += x * x; }
        var cos = (dot / Math.sqrt(n2 || 1)) * (it.w || 1);
        if (!(it.t in out) || cos > out[it.t]) { out[it.t] = cos; }
      });
      return out;
    }

    /* rank terms for one phrase. qvec and EMB are optional. */
    function rank(query, k, qvec, EMB) {
      var lx = lexical(query), sm = qvec && EMB ? semantic(qvec, EMB) : null;
      var all = {};
      Object.keys(lx).forEach(function (t) { all[t] = 1; });
      if (sm) { Object.keys(sm).forEach(function (t) { if (sm[t] > 0.3) { all[t] = 1; } }); }
      var rows = Object.keys(all).map(function (t) {
        var l = lx[t] || 0, s = sm ? Math.max(0, (sm[t] - 0.25) / 0.6) : 0;
        return { token: t, score: sm ? Math.max(l, Math.min(1, s)) + 0.15 * Math.min(l, s) : l, lexical: l, semantic: sm ? sm[t] : null };
      });
      rows.sort(function (a, b) { return b.score - a.score || (a.token < b.token ? -1 : 1); });
      return rows.slice(0, k || 3).map(function (r) {
        return { token: r.token, full_term: T[r.token].full, slot: T[r.token].slot, definition: T[r.token].def, not_to_be_confused_with: T[r.token].not,
          score: Math.min(1, Math.round(r.score * 100) / 100), how: r.semantic !== null && (r.semantic - 0.25) / 0.6 > r.lexical ? "meaning" : "wording" };
      });
    }

    /* split a description into the runs of words that the namer did not use */
    var BRIDGE = ["of", "the", "a", "an", "and", "in", "off", "to"];
    function unusedPhrases(description, unknownWords) {
      var unk = {};
      (unknownWords || []).forEach(function (w) { unk[w] = 1; });
      var out = [], cur = [];
      words(description.replace(/-/g, " ")).forEach(function (w) {
        if (unk[w]) { cur.push(w); }
        else if (cur.length && BRIDGE.indexOf(w) >= 0) { cur.push(w); }
        else { if (cur.length) { out.push(cur); } cur = []; }
      });
      if (cur.length) { out.push(cur); }
      return out.map(function (c) { while (c.length && STOPW.indexOf(c[c.length - 1]) >= 0) { c.pop(); } return c.join(" "); }).filter(Boolean);
    }

    // a fingerprint of the strings, so that stale embeddings can be detected
    var key = 0;
    strings.forEach(function (x) { for (var i = 0; i < x.s.length; i++) { key = (key * 31 + x.s.charCodeAt(i)) >>> 0; } key = (key * 31 + 7) >>> 0; });
    key = strings.length + "-" + key.toString(16);
    return { key: key, strings: strings, lexical: lexical, semantic: semantic, rank: rank, unusedPhrases: unusedPhrases, modelId: "Xenova/all-MiniLM-L6-v2" };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.NomenSuggest = api; }
})(typeof window !== "undefined" ? window : this);
