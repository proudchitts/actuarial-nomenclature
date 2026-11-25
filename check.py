#!/usr/bin/env python3
"""Consistency checks for the nomenclature draft.

Run from this folder:  python3 check.py
Check your own names:  python3 check.py NAME1 NAME2 ...

It reads glossary.md, examples.md, standard.md and README.md and tests:
  1. no two glossary entries share a short form, and every entry is complete
  2. every related-term link points to an entry that exists and links back
  3. every name in examples.md uses only glossary tokens
  4. every name obeys the character, length and slot order rules
  5. the example counts asked for in the brief are met
  6. the prose has no dashes or semicolons
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
errors = []


def err(msg):
    errors.append(msg)


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()


# ---------- glossary ----------
gloss_text = read("glossary.md")
entries = {}
order = []
cur = None
for line in gloss_text.split("\n"):
    m = re.match(r"^### (\S+)\s*$", line)
    if m:
        cur = m.group(1)
        order.append(cur)
        if cur in entries:
            err("glossary: short form defined twice: " + cur)
        entries[cur] = {}
        continue
    if line.startswith("## "):
        cur = None
        continue
    m = re.match(r"^- \*\*(.+?):\*\* (.*)$", line)
    if m and cur:
        entries[cur][m.group(1)] = m.group(2).strip()

NEEDED = ["Full term", "Slot", "Definition", "Not to be confused with", "Related terms"]
SLOTS = {"ITEM", "KIND", "ITEM or KIND", "MOVE", "PARTY", "BASIS", "ITEM or BASIS", "MEASURE", "TIME"}
INSTANCE = re.compile(r"^[LBF][0-9]+$")
related = {}
fulls = {}
for tok, e in entries.items():
    for field in NEEDED:
        if not e.get(field):
            err("glossary: %s has no '%s'" % (tok, field))
    if e.get("Slot") not in SLOTS:
        err("glossary: %s has unknown slot %r" % (tok, e.get("Slot")))
    if not re.match(r"^[A-Z][A-Z0-9]{1,5}$", tok):
        err("glossary: %s breaks the token rules (2 to 6 characters, A-Z and 0-9)" % tok)
    if tok.startswith("Z"):
        err("glossary: %s starts with Z, which is kept for private tokens" % tok)
    if INSTANCE.match(tok):
        err("glossary: %s looks like an instance token" % tok)
    links = re.findall(r"\[([A-Z0-9]+)\]\(#([a-z0-9]+)\)", e.get("Related terms", ""))
    related[tok] = [a for a, b in links]
    for a, b in links:
        if a.lower() != b:
            err("glossary: %s link text %s does not match its anchor %s" % (tok, a, b))
    if len(set(related[tok])) != len(related[tok]):
        err("glossary: %s lists a related term twice" % tok)
    full = e.get("Full term", "").lower()
    if full in fulls:
        err("glossary: full term '%s' used by both %s and %s" % (full, fulls[full], tok))
    fulls[full] = tok

for tok, rel in related.items():
    for r in rel:
        if r == tok:
            err("glossary: %s links to itself" % tok)
        elif r not in entries:
            err("glossary: %s links to %s, which has no entry" % (tok, r))
        elif tok not in related[r]:
            err("glossary: %s links to %s but %s does not link back" % (tok, r, r))

# every entry must appear in the family index and the alphabetical index
for tok in entries:
    if gloss_text.count("[%s](#%s)" % (tok, tok.lower())) < 2:
        err("glossary: %s is missing from an index" % tok)

slot = {t: e.get("Slot", "") for t, e in entries.items()}

# ---------- grammar ----------
PRIMARY = {"CNT", "RATE", "PROB", "FORCE", "PV", "FAC", "IND", "FLG", "IDX", "ID", "CLS", "YRS", "MTHS"}
AGGR = {"CUM", "ACC", "FUT", "AVG", "MAX", "MIN"}
BASE = {"ANN", "MTH", "PRD"}
POINT = {"BOP", "MOP", "EOP", "INC"}
ORDER = {"BEF", "AFT"}
NEVER = {"GRS", "AMT"}
# A time point is never required. It is written only when the description states one.
# These measures carry their own time point: PV and FUT look forward from the start of the period,
# ACC and CUM look back from the end of it. They never take a time point.
OWN_POINT = {"PV", "FUT", "ACC", "CUM"}


def check_name(name, where):
    """Return a list of problems with one name."""
    p = []
    if not re.match(r"^[A-Z][A-Z0-9]*(_[A-Z][A-Z0-9]*)*$", name):
        return ["%s: %s has characters or underscores that are not allowed" % (where, name)]
    if len(name) > 40:
        p.append("%s: %s is longer than 40 characters" % (where, name))
    toks = name.split("_")
    if len(toks) > 9:
        p.append("%s: %s has more than 9 tokens" % (where, name))
    if len(toks) > 1 and INSTANCE.match(toks[-1]) and toks[-1] not in entries:
        toks = toks[:-1]
    for t in toks:
        if t.startswith("Z") and 3 <= len(t) <= 6:
            return p  # private token: slot is in the local glossary, cannot check further
        if t not in entries:
            p.append("%s: %s uses %s, which is not in the glossary" % (where, name, t))
        if t in NEVER:
            p.append("%s: %s writes %s, which is implied and never written" % (where, name, t))
    if p:
        return p
    if toks[0] == "MOD" and len(toks) > 1:
        # a compute module is named MOD plus the name of what it produces
        return [x for x in check_name("_".join(name.split("_")[1:]), where) if "longer than" not in x and "more than 9" not in x]
    if toks[0] == "TBL" and len(toks) > 1:
        # a table is named TBL plus the name of the variable it holds
        return [x for x in check_name("_".join(name.split("_")[1:]), where) if "longer than" not in x and "more than 9" not in x]
    if "ITEM" not in slot[toks[0]]:
        return ["%s: %s starts with %s, which is not an ITEM" % (where, name, toks[0])]
    rest = toks[1:]
    i = 0

    def cls(t):
        s = slot[t]
        if s == "ITEM or KIND":
            return "KIND"
        if s == "ITEM or BASIS":
            return "BASIS"
        return s

    kinds = []
    while i < len(rest) and cls(rest[i]) == "KIND":
        kinds.append(rest[i])
        i += 1
    if len(kinds) > 2:
        p.append("%s: %s has more than two KIND tokens" % (where, name))
    if len(kinds) == 2:
        # events and benefits first, plain qualifiers second, the direction of a shock last
        subject = ["MORT", "LONG", "MORB", "LPSR", "LUW", "CAT", "MKT", "SPRD", "FX", "CPTY", "OPR", "CONC", "REVN", "DIV", "LAC", "EQ", "PROP", "GOVB", "CORPB", "CASH"]  # capital risks and asset classes
        rank = [(2 if k in ("UP", "DOWN", "MASS") else 0 if slot[k] == "ITEM or KIND" or k in subject else 1, k) for k in kinds]
        if rank != sorted(rank):
            p.append("%s: %s has its KIND tokens in the wrong order" % (where, name))
    for want in ("MOVE", "PARTY", "BASIS"):
        if i < len(rest) and cls(rest[i]) == want:
            i += 1
    prim = None
    aggr = None
    if i < len(rest) and rest[i] in PRIMARY:
        prim = rest[i]
        i += 1
    if i < len(rest) and rest[i] in AGGR:
        aggr = rest[i]
        i += 1
    if i < len(rest) and rest[i] == "PER":
        if i + 1 >= len(rest) or "ITEM" not in slot[rest[i + 1]]:
            p.append("%s: %s has PER without an ITEM token after it" % (where, name))
            return p
        i += 2
    base = point = None
    if i < len(rest) and rest[i] in BASE:
        base = rest[i]
        i += 1
    if i < len(rest) and rest[i] in POINT:
        point = rest[i]
        i += 1
    if i < len(rest) and rest[i] in ORDER:
        if i + 1 >= len(rest):
            p.append("%s: %s has %s with nothing after it" % (where, name, rest[i]))
            return p
        i += 2
    if i < len(rest):
        p.append("%s: %s is out of slot order at %s (%s)" % (where, name, rest[i], slot[rest[i]]))
        return p
    for m in (prim, aggr):
        if m in OWN_POINT and point:
            p.append("%s: %s uses %s, which carries its own time point, so %s must go" % (where, name, m, point))
    return p


def inline_code(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.findall(r"`([^`\n]+)`", text)


if len(sys.argv) > 1:
    for n in sys.argv[1:]:
        probs = check_name(n.upper(), "command line")
        print(n.upper(), "OK" if not probs else "FAIL")
        for x in probs:
            print("   ", x)
    sys.exit(0)

# ---------- examples ----------
ex = read("examples.md")
names = [c for c in inline_code(ex) if re.match(r"^[A-Z][A-Z0-9_]*$", c)]
used = set()
for n in names:
    errors.extend(check_name(n, "examples.md"))
    for t in n.split("_"):
        if t in entries:
            used.add(t)

part_a = ex.split("## Part A")[1].split("## Part B")[0]
part_b = ex.split("## Part B")[1].split("## Part C")[0]
part_c = ex.split("## Part C")[1]
rows_a = re.findall(r"^\| (\d+) \| (.+?) \| `([A-Z0-9_]+)` \|$", part_a, flags=re.M)
rows_b = re.findall(r"^\| \d+ \| `([A-Z0-9_]+)` \|", part_b, flags=re.M)
cases_c = re.findall(r"^### C\d+", part_c, flags=re.M)
if len(rows_a) < 60:
    err("examples.md: only %d worked examples in Part A, 60 needed" % len(rows_a))
if len(rows_b) < 10:
    err("examples.md: only %d decoded names in Part B, 10 needed" % len(rows_b))
if len(cases_c) < 5:
    err("examples.md: only %d vague cases in Part C, 5 needed" % len(cases_c))
nums = [int(r[0]) for r in rows_a]
if nums != list(range(1, len(nums) + 1)):
    err("examples.md: Part A numbering is not 1, 2, 3 ...")
seen = {}
for num, desc, name in rows_a:
    if name in seen:
        err("examples.md: name %s is given to two descriptions (%s and %s)" % (name, seen[name], num))
    seen[name] = num

# ---------- standard and README ----------
for fname in ("standard.md", "README.md"):
    for c in inline_code(read(fname)):
        if re.match(r"^[A-Z][A-Z0-9_]*$", c):
            if "_" in c:
                errors.extend(check_name(c, fname))
            elif c not in entries and not (c.startswith("Z") and len(c) >= 3):
                if not (len(c) == 1 and c in "LBF"):
                    err("%s: token %s is not in the glossary" % (fname, c))

# ---------- prose style ----------
for fname in ("standard.md", "glossary.md", "examples.md", "README.md"):
    body = re.sub(r"```.*?```", "", read(fname), flags=re.S)
    for ch, label in (("—", "em dash"), ("–", "en dash"), (";", "semicolon"), (" - ", "spaced hyphen")):
        for ln, line in enumerate(body.split("\n"), 1):
            if ch in line.lstrip("- "):
                err("%s: %s in prose near: %s" % (fname, label, line.strip()[:60]))

# ---------- report ----------
print("Glossary entries:        %d" % len(entries))
print("Related links:           %d (all checked both ways)" % sum(len(v) for v in related.values()))
print("Names in examples.md:    %d (%d distinct)" % (len(names), len(set(names))))
print("Part A / B / C:          %d / %d / %d" % (len(rows_a), len(rows_b), len(cases_c)))
print("Glossary tokens used in examples: %d of %d" % (len(used), len(entries)))
unused = sorted(set(entries) - used - NEVER)
print("Tokens with no example yet (%d): %s" % (len(unused), " ".join(unused)))
print("Longest example name:    %d characters" % max(len(n) for n in names))
if errors:
    print("\nFAILED: %d problem(s)" % len(errors))
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("\nAll checks passed.")
