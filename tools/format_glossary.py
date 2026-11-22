#!/usr/bin/env python3
"""Tidy glossary.md after a hand edit.

Run from the repository root:  python3 tools/format_glossary.py

You add or change an entry under its family heading. This script then:
  - makes every related-term link go both ways
  - turns plain short forms in a "Related terms" line (LPS, SUR) into proper links
  - rebuilds the family index, the alphabetical index and the table of everyday words
  - updates the term count at the top

It changes nothing else. Run python3 check.py afterwards.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "glossary.md")
text = open(PATH, encoding="utf-8").read()

START = "## Index of term families"
END = "## Alphabetical index"
if START not in text or END not in text:
    sys.exit("glossary.md has lost its index headings. Restore them before formatting.")
head = text.split(START)[0]
body = text.split(START)[1].split(END)[0]

fams = []      # [title, blurb, [tokens]]
ents = {}
cur = None
lines = body.split("\n")
i = 0
while i < len(lines):
    line = lines[i]
    m = re.match(r"^## (.+?)\s*$", line)
    if m:
        blurb = []
        i += 1
        while i < len(lines) and not lines[i].startswith("#"):
            if lines[i].strip():
                blurb.append(lines[i].strip())
            i += 1
        fams.append([m.group(1), " ".join(blurb), []])
        cur = None
        continue
    m = re.match(r"^### (\S+)\s*$", line)
    if m:
        cur = m.group(1)
        if cur in ents:
            sys.exit("Short form %s is defined twice." % cur)
        if not fams:
            sys.exit("Entry %s is not under a family heading." % cur)
        ents[cur] = {"fam": fams[-1][0], "fields": {}}
        fams[-1][2].append(cur)
        i += 1
        continue
    m = re.match(r"^- \*\*(.+?):\*\* (.*)$", line)
    if m and cur:
        ents[cur]["fields"][m.group(1)] = m.group(2).strip()
    i += 1

ORDER = ["Full term", "Slot", "Also called", "Definition", "Not to be confused with", "Source checked"]
problems = []
for tok, e in ents.items():
    f = e["fields"]
    for need in ("Full term", "Slot", "Definition", "Not to be confused with", "Related terms"):
        if not f.get(need):
            problems.append("%s has no '%s' line." % (tok, need))
    for k in f:
        if k not in ORDER and k != "Related terms":
            problems.append("%s has an unknown line '%s'." % (tok, k))
    rel = f.get("Related terms", "")
    linked = re.findall(r"\[([A-Z0-9]+)\]\(#", rel)
    plain = re.findall(r"\b[A-Z][A-Z0-9]{1,5}\b", re.sub(r"\[[A-Z0-9]+\]\(#[a-z0-9]+\)[^,]*", "", rel))
    e["rel"] = []
    for r in linked + plain:
        if r not in e["rel"] and r != tok:
            e["rel"].append(r)
for tok, e in ents.items():
    for r in e["rel"]:
        if r not in ents:
            problems.append("%s lists %s as related, but %s has no entry." % (tok, r, r))
if problems:
    sys.exit("Fix these first:\n - " + "\n - ".join(problems))

added = 0
for tok, e in list(ents.items()):
    for r in e["rel"]:
        if tok not in ents[r]["rel"]:
            ents[r]["rel"].append(tok)
            added += 1


def anchor(s):
    return re.sub(r"[^a-z0-9 -]", "", s.lower()).replace(" ", "-")


def shown(tok):
    full = ents[tok]["fields"]["Full term"]
    return full if full.startswith(("IFRS", "HIV", "Solvency")) else full.lower()


ext = [f for f in fams if f[0].startswith("ZA extension")]
n_ext = sum(len(f[2]) for f in ext)
head = re.sub(r"There are \d+ terms: \d+ in the core and \d+ in the South African extension set\.",
              "There are %d terms: %d in the core and %d in the South African extension set." % (len(ents), len(ents) - n_ext, n_ext), head)

o = [head.rstrip("\n"), "", START, "", "| Family | Terms |", "|---|---|"]
for title, blurb, toks in fams:
    o.append("| [%s](#%s) | %s |" % (title, anchor(title), " ".join("[%s](#%s)" % (k, k.lower()) for k in toks)))
o.append("")
for title, blurb, toks in fams:
    o += ["## %s" % title, "", blurb, ""]
    for k in toks:
        f = ents[k]["fields"]
        o += ["### %s" % k, ""]
        for key in ORDER:
            if f.get(key):
                o.append("- **%s:** %s" % (key, f[key]))
        o.append("- **Related terms:** %s" % ", ".join("[%s](#%s) %s" % (r, r.lower(), shown(r)) for r in ents[k]["rel"]))
        o.append("")
o += [END, "", "| Short form | Full term | Slot | Family |", "|---|---|---|---|"]
for k in sorted(ents):
    f = ents[k]["fields"]
    o.append("| [%s](#%s) | %s | %s | %s |" % (k, k.lower(), f["Full term"], f["Slot"], ents[k]["fam"]))
o += ["", "## Words in everyday use and where to find them", "", "| If you are looking for | Use |", "|---|---|"]
words = []
for k, e in ents.items():
    for a in e["fields"].get("Also called", "").split(","):
        a = a.strip()
        if a:
            words.append((a.lower(), a, k))
for _, a, k in sorted(words):
    o.append("| %s | [%s](#%s) |" % (a, k, k.lower()))
new = "\n".join(o) + "\n"
if new == text:
    print("glossary.md is already tidy: %d terms." % len(ents))
else:
    open(PATH, "w", encoding="utf-8").write(new)
    print("Tidied glossary.md: %d terms, %d back-links added." % (len(ents), added))
