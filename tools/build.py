#!/usr/bin/env python3
"""Build docs/data.js from glossary.md and tools/lexicon.json.

Run from the repository root:  python3 tools/build.py
glossary.md is the master. Never edit docs/data.js by hand.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
text = open(os.path.join(ROOT, "glossary.md"), encoding="utf-8").read()
lex = json.load(open(os.path.join(ROOT, "tools", "lexicon.json"), encoding="utf-8"))

terms = {}
family = None
cur = None
for line in text.split("\n"):
    if line.startswith("## "):
        family = line[3:].strip()
        cur = None
        continue
    m = re.match(r"^### (\S+)\s*$", line)
    if m:
        cur = m.group(1)
        terms[cur] = {"family": family}
        continue
    m = re.match(r"^- \*\*(.+?):\*\* (.*)$", line)
    if m and cur:
        key, val = m.group(1), m.group(2).strip()
        if key == "Full term":
            terms[cur]["full"] = val
        elif key == "Slot":
            terms[cur]["slot"] = val
        elif key == "Also called":
            terms[cur]["also"] = [a.strip() for a in val.split(",") if a.strip()]
        elif key == "Definition":
            terms[cur]["def"] = val
        elif key == "Not to be confused with":
            terms[cur]["not"] = val
        elif key == "Source checked":
            terms[cur]["source"] = val
        elif key == "Related terms":
            terms[cur]["related"] = re.findall(r"\[([A-Z0-9]+)\]\(#", val)

for t in terms.values():
    t.setdefault("also", [])
    t["ext"] = t["family"].split(" extension: ")[0] if " extension: " in t["family"] else ""

grp = json.load(open(os.path.join(ROOT, "tools", "groups.json"), encoding="utf-8"))
item_group = {}
for tok, t in terms.items():
    if "ITEM" in t["slot"]:
        g = grp["items"].get(tok) or grp["families"].get(t["family"])
        if not g:
            raise SystemExit("No group for item %s (family %s). Add it to tools/groups.json." % (tok, t["family"]))
        if g not in grp["order"]:
            raise SystemExit("Group %r for %s is not in the order list." % (g, tok))
        item_group[tok] = g
data = {"version": "0.1", "terms": terms, "lexicon": lex, "groups": {"order": grp["order"], "items": item_group}}
out = os.path.join(ROOT, "docs", "data.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// Built by tools/build.py from glossary.md. Do not edit by hand.\n")
    f.write("var NOMEN_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    f.write("if (typeof module !== 'undefined') { module.exports = NOMEN_DATA; }\n")
print("Wrote docs/data.js with %d terms and %d extra phrases" % (len(terms), len(lex["phrases"])))
