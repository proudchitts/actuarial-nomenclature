/* Rule-based namer for the open actuarial nomenclature.
 * No AI and no network calls. It matches words and phrases against the glossary,
 * puts each term in its slot, and refuses to guess when a description is vague.
 * Works in a browser (window.Nomen) and in Node (require).
 */
(function (root) {
  "use strict";

  var PRIMARY = ["CNT", "RATE", "PROB", "FORCE", "PV", "FAC", "IND", "FLG", "IDX"];
  var AGGR = ["CUM", "ACC", "FUT", "AVG"];
  var BASE = ["ANN", "MTH", "PRD"];
  var POINT = ["BOP", "MOP", "EOP", "T0", "INC"];
  var NEVER = ["GRS", "AMT"];
  var NEED_POINT = ["PV", "CUM", "ACC", "FUT", "IDX", "PROB"];
  var INSTANCE = /^[LBF][0-9]+$/;

  function has(list, x) { return list.indexOf(x) >= 0; }

  function norm(s) {
    return (" " + s + " ").toLowerCase()
      .replace(/[\u2019']/g, "")
      .replace(/[-\u2013\u2014\/]/g, " ")
      .replace(/[.;:()]/g, " , ")
      .replace(/,/g, " , ")
      .replace(/[^a-z0-9, ]/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  function create(DATA) {
    var T = DATA.terms, LX = DATA.lexicon;
    var itemCapable = function (t) { return T[t] && T[t].slot.indexOf("ITEM") >= 0; };

    // ---------- phrase table ----------
    var P = {};
    var maxWords = 1;
    function add(phrase, toks, pri) {
      var ph = norm(phrase).replace(/ ?, ?/g, " ").trim();
      if (!ph) { return; }
      var n = ph.split(" ").length;
      if (n > maxWords) { maxWords = n; }
      var key = toks.join("+");
      if (!P[ph] || pri > P[ph].pri) { P[ph] = { toks: toks, pri: pri, alts: [key] }; }
      else if (pri === P[ph].pri && P[ph].alts.indexOf(key) < 0) { P[ph].alts.push(key); }
    }
    function plural(ph) {
      var w = ph.split(" "), l = w[w.length - 1];
      if (l.length < 3 || /s$/.test(l)) { return null; }
      var p = /[^aeiou]y$/.test(l) ? l.slice(0, -1) + "ies" : /(ch|sh|x)$/.test(l) ? l + "es" : l + "s";
      return w.slice(0, -1).concat(p).join(" ");
    }
    function addBoth(phrase, toks, pri) {
      add(phrase, toks, pri);
      var p = plural(norm(phrase));
      if (p) { add(p, toks, pri - 0.5); }
    }
    var drop = {};
    LX.dropAliases.forEach(function (a) { drop[norm(a)] = 1; });
    Object.keys(T).forEach(function (tok) {
      if (has(NEVER, tok)) { return; }
      addBoth(T[tok].full, [tok], 2);
      (T[tok].also || []).forEach(function (a) {
        a = a.replace(/\(.*?\)/g, "").trim();
        if (!a || drop[norm(a)]) { return; }
        addBoth(a, [tok], 1);
      });
    });
    Object.keys(LX.phrases).forEach(function (ph) { add(ph, LX.phrases[ph], 3); });
    Object.keys(LX.special).forEach(function (ph) { add(ph, [LX.special[ph]], 3); });
    var PREP = {}, STOP = {};
    LX.preps.forEach(function (w) { PREP[w] = 1; });
    LX.stop.forEach(function (w) { STOP[w] = 1; });

    // ---------- validate a finished name ----------
    function cls(t) {
      var s = T[t].slot;
      if (s === "ITEM or KIND") { return "KIND"; }
      if (s === "ITEM or BASIS") { return "BASIS"; }
      return s;
    }
    function validate(name) {
      var out = { name: name, ok: false, problems: [], slots: [] };
      var p = out.problems;
      if (!/^[A-Z][A-Z0-9]*(_[A-Z][A-Z0-9]*)*$/.test(name)) {
        p.push("The name has characters or underscores that are not allowed.");
        return out;
      }
      if (name.length > 40) { p.push("The name is longer than 40 characters."); }
      var toks = name.split("_");
      if (toks.length > 9) { p.push("The name has more than 9 tokens."); }
      var inst = null;
      if (toks.length > 1 && INSTANCE.test(toks[toks.length - 1]) && !T[toks[toks.length - 1]]) { inst = toks.pop(); }
      for (var j = 0; j < toks.length; j++) {
        if (/^Z/.test(toks[j]) && toks[j].length >= 3) {
          out.private = true;
          out.ok = p.length === 0;
          return out;
        }
        if (!T[toks[j]]) { p.push(toks[j] + " is not in the glossary."); }
        else if (has(NEVER, toks[j])) { p.push(toks[j] + " is implied and is never written in a name."); }
      }
      if (p.length) { return out; }
      if (!itemCapable(toks[0])) { p.push("The name starts with " + toks[0] + ", which is not an ITEM."); return out; }
      var S = out.slots;
      S.push({ slot: "ITEM", tok: toks[0] });
      var rest = toks.slice(1), i = 0, kinds = [];
      while (i < rest.length && cls(rest[i]) === "KIND") { kinds.push(rest[i]); S.push({ slot: "KIND", tok: rest[i] }); i++; }
      if (kinds.length > 2) { p.push("There are more than two KIND tokens."); }
      if (kinds.length === 2) {
        var sorted = orderKinds(kinds.slice());
        if (sorted[0] !== kinds[0]) { p.push("The KIND tokens are in the wrong order. It should be " + sorted.join("_") + "."); }
      }
      ["MOVE", "PARTY", "BASIS"].forEach(function (want) {
        if (i < rest.length && cls(rest[i]) === want) { S.push({ slot: want, tok: rest[i] }); i++; }
      });
      var prim = null, aggr = null, base = null, point = null;
      if (i < rest.length && has(PRIMARY, rest[i])) { prim = rest[i]; S.push({ slot: "MEASURE", tok: prim }); i++; }
      if (i < rest.length && has(AGGR, rest[i])) { aggr = rest[i]; S.push({ slot: "MEASURE", tok: aggr }); i++; }
      if (i < rest.length && rest[i] === "PER") {
        if (i + 1 >= rest.length || !itemCapable(rest[i + 1])) { p.push("PER must be followed by one ITEM token."); return out; }
        S.push({ slot: "MEASURE", tok: "PER", arg: rest[i + 1] }); i += 2;
      }
      if (i < rest.length && has(BASE, rest[i])) { base = rest[i]; S.push({ slot: "TIME", tok: base }); i++; }
      if (i < rest.length && has(POINT, rest[i])) { point = rest[i]; S.push({ slot: "TIME", tok: point }); i++; }
      if (i < rest.length && (rest[i] === "BEF" || rest[i] === "AFT")) {
        if (i + 1 >= rest.length) { p.push(rest[i] + " must be followed by one token."); return out; }
        S.push({ slot: "TIME", tok: rest[i], arg: rest[i + 1] }); i += 2;
      }
      if (i < rest.length) { p.push("Out of slot order at " + rest[i] + " (" + T[rest[i]].slot + ")."); return out; }
      if (prim === "RATE" && !base) { p.push("A RATE must state its time base: ANN, MTH or PRD."); }
      [prim, aggr].forEach(function (m) { if (m && has(NEED_POINT, m) && !point) { p.push(m + " needs a time point: BOP, MOP, EOP, T0 or INC."); } });
      if (inst) { S.push({ slot: "INSTANCE", tok: inst }); }
      out.ok = p.length === 0;
      return out;
    }

    function orderKinds(kinds) {
      return kinds.sort(function (a, b) {
        var ra = T[a].slot === "ITEM or KIND" ? 0 : 1, rb = T[b].slot === "ITEM or KIND" ? 0 : 1;
        if (ra !== rb) { return ra - rb; }
        return a < b ? -1 : a > b ? 1 : 0;
      });
    }

    // ---------- name to English ----------
    function lc(t) {
      var f = T[t].full;
      return /^(IFRS|HIV|Solvency)/.test(f) ? f : f.charAt(0).toLowerCase() + f.slice(1);
    }
    function canonical(slots) {
      var by = function (s) { return slots.filter(function (x) { return x.slot === s; }); };
      var meas = by("MEASURE"), time = by("TIME");
      var m = meas.filter(function (x) { return x.tok !== "PER"; }).map(function (x) { return lc(x.tok); });
      var per = meas.filter(function (x) { return x.tok === "PER"; })[0];
      var head = by("KIND").map(function (x) { return lc(x.tok); }).concat(lc(by("ITEM")[0].tok)).join(" ");
      var s = m.length ? m.join(" ") + " of " + head : head;
      by("MOVE").forEach(function (x) { s += ", " + lc(x.tok); });
      by("PARTY").forEach(function (x) { s += ", " + lc(x.tok); });
      by("BASIS").forEach(function (x) { s += ", " + lc(x.tok) + " basis"; });
      if (per) { s += ", per " + lc(per.arg); }
      time.forEach(function (x) {
        if (has(BASE, x.tok)) { s += ", " + lc(x.tok); }
        else if (has(POINT, x.tok)) { s += ", at " + lc(x.tok); }
        else { s += ", " + lc(x.tok) + " " + lc(x.arg); }
      });
      by("INSTANCE").forEach(function (x) {
        var kind = { L: "life", B: "benefit", F: "fund" }[x.tok.charAt(0)];
        s += ", " + kind + " " + x.tok.slice(1);
      });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function decode(name) {
      var v = validate(String(name).trim().toUpperCase());
      if (v.ok && !v.private) { v.canonical = canonical(v.slots); }
      return v;
    }

    // ---------- English to name ----------
    function scan(text) {
      var words = norm(text).split(" ").filter(Boolean);
      var els = [], seg = 0, i = 0;
      while (i < words.length) {
        var hit = null, n;
        if (/^(life|benefit|fund)$/.test(words[i]) && /^[0-9]+$/.test(words[i + 1] || "")) {
          els.push({ k: "sp", t: "@" + words[i].charAt(0).toUpperCase() + words[i + 1], w: words[i] + " " + words[i + 1], seg: seg });
          i += 2;
          continue;
        }
        for (n = Math.min(maxWords, words.length - i); n >= 1; n--) {
          var ph = words.slice(i, i + n).join(" ");
          if (ph.indexOf(",") < 0 && P[ph]) { hit = { ph: ph, e: P[ph], n: n }; break; }
        }
        if (hit) {
          if (hit.e.alts.length > 1) { els.push({ k: "amb", w: hit.ph, alts: hit.e.alts, seg: seg }); i += hit.n; continue; }
          hit.e.toks.forEach(function (t, ti) { els.push({ k: t.charAt(0) === "@" ? "sp" : "tok", t: t, w: hit.ph, seg: seg, sub: ti > 0 }); });
          i += hit.n;
          continue;
        }
        var w = words[i];
        if (w === "," || PREP[w]) { seg++; }
        else if (!STOP[w] && !/^[0-9]+$/.test(w)) { els.push({ k: "unk", w: w, seg: seg }); }
        i++;
      }
      return els;
    }

    function vagueChecks(text) {
      var out = [];
      var t = " " + norm(text).replace(/ ?, ?/g, " ") + " ";
      LX.vague.forEach(function (r) {
        var probe = t;
        (r.unless || []).concat(LX.vague.filter(function (o) { return o !== r && o.word.indexOf(r.word) >= 0 && o.word !== r.word; }).map(function (o) { return o.word; }))
          .forEach(function (u) { probe = probe.split(" " + norm(u) + " ").join(" | "); });
        if (probe.indexOf(" " + norm(r.word) + " ") >= 0) {
          out.push({
            hard: !r.soft, text: r.question,
            options: r.options.map(function (o) { return { label: o[0], find: r.word, replace: o[1] }; })
          });
        }
      });
      return out;
    }

    function nameOf(description) {
      var res = { input: description, status: "fail", name: null, questions: [], notes: [], unknown: [], slots: [] };
      if (!norm(description)) { res.notes.push("Write a description first."); return res; }
      res.questions = vagueChecks(description);
      var els = scan(description);
      var per = null, order = null, inst = null, basis = null, party = null, move = null;
      var prim = null, aggr = null, base = null, point = null;
      var cands = [];
      var i, e, j;

      // clauses that take the next term
      for (i = 0; i < els.length; i++) {
        e = els[i];
        if (e.k !== "sp" || e.used) { continue; }
        e.used = true;
        if (e.t === "@PERPOL") { if (!per) { per = "POL"; } continue; }
        if (e.t === "@PER" || e.t === "@BEF" || e.t === "@AFT") {
          var found = null;
          for (j = i + 1; j < els.length && j <= i + 3; j++) {
            if (els[j].k === "tok" && !els[j].used && (e.t !== "@PER" || itemCapable(els[j].t))) { found = els[j]; break; }
          }
          if (!found) { res.notes.push("I could not tell what \"" + e.w + "\" refers to, so I left it out."); continue; }
          found.used = true;
          if (e.t === "@PER") {
            if (per) { res.notes.push("Only one ratio is allowed. I kept \"per " + lc(per) + "\"."); } else { per = found.t; }
          } else { order = { tok: e.t === "@BEF" ? "BEF" : "AFT", arg: found.t }; }
        } else if (e.t === "@PERPOL") {
          if (!per) { per = "POL"; }
        } else if (e.t === "@GROSS") {
          res.notes.push("Gross of reinsurance is implied, so it is not written in the name.");
        } else if (e.t === "@EVBASIS") {
          basis = "EV";
        } else if (/^@[LBF][0-9]+$/.test(e.t)) {
          inst = e.t.slice(1);
        }
      }

      function conflict(kind, a, b) {
        res.questions.push({ hard: true, text: "The description gives two " + kind + ": " + lc(a) + " and " + lc(b) + ". Keep one.", options: [] });
      }
      for (i = 0; i < els.length; i++) {
        e = els[i];
        if (e.k === "unk") { if (!has(res.unknown, e.w)) { res.unknown.push(e.w); } continue; }
        if (e.k === "amb") {
          res.questions.push({ hard: true, text: "\"" + e.w + "\" is used for more than one term. Which one?", options: e.alts.map(function (a) {
            return { label: T[a].full, find: e.w, replace: lc(a) };
          }) });
          continue;
        }
        if (e.k !== "tok" || e.used) { continue; }
        var t = e.t, s = T[t].slot;
        if (s === "MEASURE") {
          if (has(PRIMARY, t)) {
            if (!prim) { prim = t; } else if (prim !== t) { res.notes.push("I read the measure as " + lc(prim) + " and ignored \"" + e.w + "\"."); }
          } else if (has(AGGR, t)) {
            if (!aggr || t === "ACC") { aggr = t; }
          }
        } else if (s === "TIME") {
          if (has(BASE, t)) { if (!base) { base = t; } else if (base !== t) { conflict("time bases", base, t); } }
          else if (has(POINT, t)) { if (!point) { point = t; } else if (point !== t) { conflict("time points", point, t); } }
        } else if (s === "PARTY") {
          if (!party) { party = t; } else if (party !== t) { conflict("parties", party, t); }
        } else if (s === "BASIS") {
          if (!basis) { basis = t; } else if (basis !== t) { conflict("bases", basis, t); }
        } else if (s === "MOVE") {
          if (!move) { move = t; } else if (move !== t) { conflict("movements", move, t); }
        } else {
          cands.push(e);
        }
      }

      // the item is the head noun: the last item-capable term in the first phrase that has one
      var item = null, headSeg = null;
      cands.forEach(function (c) {
        if (!itemCapable(c.t) || c.sub) { return; }
        if (headSeg === null) { headSeg = c.seg; }
        if (c.seg === headSeg) { item = c; }
      });
      if (!item && res.questions.some(function (q) { return q.hard; })) { res.status = "needs"; return res; }
      if (!item) {
        res.notes.push("I could not find what the variable is about. Name the thing it measures, such as premiums, claims, a reserve or a rate of death.");
        return res;
      }
      var kinds = [];
      cands.forEach(function (c) {
        if (c === item || c.t === item.t || has(kinds, c.t)) { return; }
        var sl = T[c.t].slot;
        if (sl === "ITEM or BASIS") {
          if (!basis) { basis = c.t; } else if (basis !== c.t) { conflict("bases", basis, c.t); }
        } else if (sl === "ITEM") {
          res.warn = true;
          res.notes.push("I did not use \"" + c.w + "\" (" + c.t + "). A name has one item, and I read it as " + lc(item.t) + ". If " + lc(c.t) + " is the real subject, put it first.");
        } else { kinds.push(c.t); }
      });
      if (kinds.length > 2) {
        res.questions.push({ hard: true, text: "The description has " + kinds.length + " qualifiers (" + kinds.map(lc).join(", ") + "). A name can carry two. Remove the ones that are not needed.", options: [] });
        kinds = kinds.slice(0, 2);
      }
      orderKinds(kinds);
      if (per === "POL" && has(LX.perPolicyItems, item.t)) {
        per = null;
        res.notes.push(T[item.t].full + " is already an amount per policy, so \"per policy\" is not written.");
      }

      // points on which the description must be explicit
      if (prim === "RATE" && !base) {
        res.questions.push({ hard: true, text: "A rate must state its time base. Which one?", options: [
          { label: "Annual", append: ", annual" }, { label: "Monthly", append: ", monthly" }, { label: "Per model period", append: ", per model period" }] });
      }
      var pointOpts = [
        { label: "Start of period", append: ", at the start of the period" }, { label: "End of period", append: ", at the end of the period" },
        { label: "Valuation date", append: ", at the valuation date" }, { label: "Inception", append: ", at inception" }];
      var needs = [prim, aggr].filter(function (m) { return m && has(NEED_POINT, m); });
      var inForce = (item.t === "POL" || item.t === "LIFE") && (has(kinds, "IF") || has(kinds, "PUP")) && !move;
      var stock = has(LX.stock, item.t) && !move && (!prim || prim === "IND");
      if (!point && needs.length) {
        res.questions.push({ hard: true, text: "A " + lc(needs[0]) + " must say at which instant it is measured. Which one?", options: pointOpts });
      } else if (!point && (inForce || stock) && prim !== "FLG") {
        res.questions.push({ hard: true, text: (inForce ? "A number in force" : T[item.t].full) + " is a value at an instant. At which instant?", options: pointOpts });
      }
      if (prim === "RATE" && has(LX.decrements, item.t) && !has(kinds, "DEP") && !has(kinds, "INDP")) {
        res.questions.push({ hard: false, text: "If the model has more than one decrement, say whether this rate is dependent or independent.", options: [
          { label: "Dependent", prepend: "Dependent " }, { label: "Independent", prepend: "Independent " }] });
      }

      if (prim === "CNT" && has(LX.decrements, item.t)) {
        res.questions.push({ hard: false, text: "This counts policies that leave by this cause. On joint life, group or family business, say \"number of lives\" if lives are meant.", options: [] });
      }

      // assemble in slot order
      var toks = [item.t].concat(kinds);
      if (move) { toks.push(move); }
      if (party) { toks.push(party); }
      if (basis) { toks.push(basis); }
      if (prim) { toks.push(prim); }
      if (aggr) { toks.push(aggr); }
      if (per) { toks.push("PER", per); }
      if (base) { toks.push(base); }
      if (point) { toks.push(point); }
      if (order) { toks.push(order.tok, order.arg); }
      if (inst) { toks.push(inst); }
      var name = toks.join("_");
      var hard = res.questions.filter(function (q) { return q.hard; });
      var v = validate(name);
      res.slots = v.slots;
      if (hard.length) {
        res.status = "needs";
        res.draft = name;
        return res;
      }
      if (!v.ok) {
        res.status = "fail";
        res.draft = name;
        v.problems.forEach(function (x) { res.notes.push(x); });
        return res;
      }
      res.status = "ok";
      if (res.unknown.length) { res.warn = true; }
      res.name = name;
      res.canonical = canonical(v.slots);
      return res;
    }

    // apply the answer to a question by rewriting the description, so the description itself becomes explicit
    function applyOption(description, opt) {
      if (opt.append) { return description.replace(/[\s.,;]+$/, "") + opt.append; }
      if (opt.prepend) { return opt.prepend + description.charAt(0).toLowerCase() + description.slice(1); }
      if (opt.find) {
        var re = new RegExp("\\b" + opt.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s-]+") + "\\b", "i");
        return description.replace(re, opt.replace);
      }
      return description;
    }

    // ---------- a whole list ----------
    function batch(text) {
      var rows = [];
      text.split(/\r?\n/).forEach(function (line, idx) {
        var raw = line.trim();
        if (!raw) { return; }
        var given = null, desc = raw;
        var m = raw.match(/^([A-Za-z][A-Za-z0-9_]*)\s*(?:\t|\||,|;|=)\s*(.+)$/);
        if (m && (m[1].indexOf("_") >= 0 || T[m[1].toUpperCase()])) { given = m[1].toUpperCase(); desc = m[2].trim().replace(/^"|"$/g, ""); }
        var r = nameOf(desc);
        var row = { line: idx + 1, given: given, description: desc, result: r, flags: [] };
        if (given) {
          var v = validate(given);
          row.givenOk = v.ok;
          if (!v.ok) { row.flags.push("The given name breaks the rules: " + v.problems.join(" ")); }
          if (r.status === "ok" && r.name !== given) { row.flags.push("The description gives " + r.name + ", not " + given + "."); }
        }
        if (r.status === "needs") { row.flags.push("Too vague to name: " + r.questions.filter(function (q) { return q.hard; }).map(function (q) { return q.text; }).join(" ")); }
        if (r.status === "fail") { row.flags.push("Could not be named: " + r.notes.join(" ")); }
        rows.push(row);
      });
      var byName = {};
      rows.forEach(function (row) {
        var n = row.result.name || row.given;
        if (!n) { return; }
        (byName[n] = byName[n] || []).push(row);
      });
      Object.keys(byName).forEach(function (n) {
        var g = byName[n];
        var distinct = {};
        g.forEach(function (row) { distinct[norm(row.description)] = 1; });
        if (g.length > 1 && Object.keys(distinct).length > 1) {
          g.forEach(function (row) {
            row.duplicate = true;
            row.flags.push("Same name as line " + g.filter(function (o) { return o !== row; }).map(function (o) { return o.line; }).join(", ") + ". Either these are one variable, or one description is missing a detail.");
          });
        }
      });
      return rows;
    }

    function collisions() {
      return Object.keys(P).filter(function (k) { return P[k].alts.length > 1; }).map(function (k) { return k + " = " + P[k].alts.join(" / "); });
    }
    return { collisions: collisions, name: nameOf, decode: decode, validate: validate, batch: batch, applyOption: applyOption, terms: T, version: DATA.version };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.Nomen = api; }
})(typeof window !== "undefined" ? window : this);
