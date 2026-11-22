# An open nomenclature for life insurance projection models

Version 0.1. A draft for review.

**Try it:** [proudchitts.github.io/actuarial-nomenclature](https://proudchitts.github.io/actuarial-nomenclature/). Describe a variable in plain English and get its standard name.

## The problem

Every actuarial modelling platform has its own habits for naming variables. An actuary who moves from one platform to another has to learn a new vocabulary for the same ideas. Inside one company, two teams often give the same quantity two names, or give two quantities the same name.

There is a shared notation for the mathematics, the International Actuarial Notation. There are shared definitions in standards such as IFRS 17 and Solvency II. There is no open, shared standard for naming the variables of a projection model.

## What this standard does

It gives a rule that turns a plain English description of a variable into one predictable name, and turns a name back into English.

- "Present value at the end of the period of future death claims recovered from reinsurers, best estimate" becomes `CLM_DTH_RI_BE_PV_EOP`.
- `LPS_DEP_RATE_MTH` reads as "dependent monthly rate of lapse".

It also gives a controlled list of terms. Each term has one short form, one precise definition, a note on what it is often confused with, and links to its related terms.

## What it is for

1. **Search any variable by meaning.** If you know what you are looking for in words, you can work out its name and search for it. If you find one term in the glossary, its related terms lead you to the others.
2. **Read unfamiliar model code.** A reader who knows the slot order and the glossary can read a formula with many variables without asking the author.
3. **Move models between platforms.** A model written to an open naming standard is not tied to one vendor's vocabulary. A mapping from old names to standard names needs to be done once.
4. **Make AI tools reliable.** A language model that writes or reviews model code makes fewer mistakes when every name has one meaning and that meaning is written down. The check scripts can test what the tool produces.
5. **Stay independent of any vendor.** The standard is original. It does not copy the variable lists or libraries of any product. It uses only widely known actuarial terms and public standards.

## The namer

The web page has four parts.

| Part | What it does |
|---|---|
| Name a variable | You write a description. It gives the name, reads the name back in standard wording, and shows which word went into which slot. |
| Read a name | You type a name. It reads it back in English and tells you if it breaks a rule. |
| Check a list | You paste many descriptions, or names with descriptions. It flags vague descriptions, names that break the rules, names that do not match their description, and two different descriptions that end up with the same name. |
| Glossary | Search all terms by short form, full term, everyday word or definition. |

### How it works

The namer uses fixed rules. It does not use AI, it does not call any server, and nothing you type leaves your browser.

1. It looks for words and phrases it knows. These are the full terms in the glossary, the "also called" words, and a list of everyday phrases in `tools/lexicon.json`. It does not need your wording to match a definition. It needs your wording to contain terms it knows.
2. It puts each term in its slot. The head noun becomes the item. Words such as "rate of", "number of" and "present value" become the measure. Words such as "reinsurance", "best estimate" and "end of the period" fill the party, basis and time.
3. It refuses to guess. If a word has two meanings, such as withdrawal or gross premium, it asks which one. If a rate has no time base or a balance has no time point, it asks. Each answer rewrites your description, so the description itself becomes exact.
4. It shows what it did not use. Words it does not know are listed under the name. The name ignores them, so you can see at once if something that matters was lost.
5. It reads the name back. If the reading is not what you meant, the description needs another word.

### How we know one name is not given to two meanings

- Each short form has one definition. `check.py` fails if two entries share a short form or a full term.
- Each token has one slot and the slots have one order. So a name can be read back in exactly one way. `tools/test.js` checks that all 193 example names read back to a description that gives the same name again.
- Two different descriptions that give the same name are either the same variable in different words, or one of them left out a detail. "Check a list" flags every such pair for a person to decide.

### What it cannot do

It does not understand free English the way a person does. It will miss an idea that is said with no glossary term or known phrase. A sentence such as "what we expect to pay out when people die" will not work. "Death claims in the period" will.

An AI assistant can sit in front, to turn loose wording into a description in glossary terms. The MCP server and the API below exist for that. The rule-based namer still builds and checks the name, so the AI can never invent one.

## Use it from an AI tool or a modelling platform

The same rule-based namer is offered three more ways, so that an AI assistant or a platform can pass in a description and get the name back. All three give the same answer as the web page. None of them uses AI or calls another service. They need Node 16 or later and have no other dependencies.

Every route returns the same JSON. The `status` field is `ok`, `needs_detail` or `failed`. With `ok` the `name` field holds the name and `reads_as` reads it back. With `needs_detail` the name is empty and `questions` lists what is missing. Each option carries a `revised_description` to send back. A caller must never invent a name when the status is not `ok`.

### 1. MCP server, for AI tools

Add this to the MCP settings of the AI tool.

```json
{
  "mcpServers": {
    "actuarial-nomenclature": {
      "command": "npx",
      "args": ["-y", "github:proudchitts/actuarial-nomenclature", "mcp"]
    }
  }
}
```

The server offers five tools.

| Tool | What it does |
|---|---|
| `name_variable` | Description to name. Refuses to guess and returns questions when the description is vague. |
| `read_name` | Name to English, with a check against the rules. |
| `check_list` | Many variables at once. Flags vague lines, names that break the rules, names that do not match their description, and different descriptions that share a name. |
| `search_glossary` | Look up terms by short form, full term, everyday word or definition. |
| `naming_rules` | The grammar in short, for the AI to read. |

### 2. Command line

```bash
npx -y github:proudchitts/actuarial-nomenclature name "Death claims in the period"
npx -y github:proudchitts/actuarial-nomenclature read CLM_DTH_RI_BE_PV_EOP
npx -y github:proudchitts/actuarial-nomenclature check variables.txt
```

The exit code is 0 when the name is good and 2 when more detail is needed, so a build script can stop on a vague description.

### 3. HTTP API, to run on your own machine or server

```bash
npx -y github:proudchitts/actuarial-nomenclature serve --port 8787
curl -s localhost:8787/name -d '{"description": "Number of policies in force at the end of the period"}'
```

| Route | Input | Output |
|---|---|---|
| `POST /name` or `GET /name?description=` | A description | The name, or questions |
| `POST /read` or `GET /read?name=` | A name | The English reading and any rule broken |
| `POST /check` | A list of items, each with a description and an optional name | One result per line, with shared names flagged |
| `GET /glossary?q=` | A word | Matching terms |
| `GET /rules` | Nothing | The grammar in short |

There is no public hosted API. The server listens on your own machine by default. A platform written in JavaScript can also load `docs/namer.js` and `docs/data.js` directly and call the namer in process.

## The files

| File | What it holds |
|---|---|
| `standard.md` | The grammar: characters, length, the seven slots, measures, time, bases, parties, extensions |
| `glossary.md` | The controlled word list: 259 terms in 22 families, 244 in the core and 15 in the South African extension set. This file is the master. |
| `examples.md` | 193 descriptions turned into names, 10 names read back into English, 8 descriptions that are too vague to name |
| `docs/` | The web page: `index.html`, the namer `namer.js`, and `data.js` which is built from the glossary |
| `tools/lexicon.json` | Everyday phrases and vague words for the namer |
| `tools/build.py` | Builds `docs/data.js` from `glossary.md` and the lexicon |
| `tools/test.js` | Runs every example through the namer |
| `check.py` | Tests the glossary and every example name against the rules |
| `lib/api.js` | One shared interface that the command line, the HTTP API and the MCP server all call |
| `bin/cli.js`, `bin/mcp.js` | The command line with the HTTP API, and the MCP server |
| `tools/test_api.js` | Tests the command line, the HTTP API and the MCP server |

## How to use it by hand

### To name a variable

1. Write one sentence that says exactly what the variable is.
2. Follow the steps in section 10.1 of `standard.md`.
3. If you cannot choose between two terms, read their "not to be confused with" notes in the glossary. If the sentence still fits both, the sentence is too vague. Make it explicit. The standard never guesses.

### To read a name

1. Split it at the underscores.
2. Look up each token in the alphabetical index at the end of `glossary.md`.
3. Read it in the order given in section 10.2 of `standard.md`.

## The slot order in one line

```
ITEM _ KIND _ MOVE _ PARTY _ BASIS _ MEASURE _ TIME
```

Only the item is always required. Gross of reinsurance and plain amounts are implied and never written.

## To change the standard

1. Edit `glossary.md`, `examples.md` or `tools/lexicon.json`.
2. Run `python3 tools/build.py` to rebuild the data for the web page.
3. Run `python3 check.py`, `node tools/test.js` and `node tools/test_api.js`. All three must pass.

`check.py` tests that no two entries share a short form, that every related link goes both ways, that every example name uses only glossary terms and obeys the slot order, and that the prose has no dashes or semicolons. `tools/test.js` tests that every example description gives exactly the expected name, that every name reads back, and that every vague case is refused.

## What the definitions were checked against

92 of the 259 entries carry a "source checked" line that names the public text the definition was compared with. Definitions are written in this standard's own words and do not quote the sources.

| Source | What was read | Result |
|---|---|---|
| IFRS 17 | The EU endorsed text in Commission Regulation (EU) 2021/2036, with the 2020 amendments | 27 entries checked. 17 tightened, none badly wrong. The locked-in basis was the main correction: balance sheet cash flows are always at current rates. |
| Solvency II | Directive 2009/138/EC (consolidated January 2025), Directive (EU) 2025/2, and Delegated Regulation (EU) 2015/35 in its original 2015 form | 25 entries checked. 11 tightened. Lapse risk was found to be far wider than lapse, so it has its own term. |
| South African solvency standards | Prudential Standards FSI 1, 2.2, 3 and 4.2 (2018 versions, read from a law reference site), the Insurance Act 2017 Schedule 2, Income Tax Act section 29A and SARS Interpretation Note 102 | 21 entries checked. 11 tightened. The corporate fund was added: section 29A has five funds and not four. |
| Actuarial Society of South Africa | APN 105, APN 107, APN 110, APN 116 from the Society's site. SAP 104 version 9 (formerly PGN 104) from a text copy, because the Society's copy is a scan | 29 entries checked. 14 tightened. Embedded value terms now follow APN 107. |

Points to know about the South African guidance. PGNs were renamed SAPs and APNs. SAP 104 was withdrawn at the end of 2023 and APN 103 in 2018, so the financial soundness valuation terms are historic. APN 105 is archived.

## Limits of this draft

- The glossary is not a complete list of life insurance terms. It grows as real variable lists are run through it. Every failure in "Check a list" is a missing term or phrase, and a company can cover a gap at once with a private token that starts with Z.

- The check scripts test form. They cannot test that a definition is right. That needs actuarial review.
- The checks against published texts were done by AI research and spot-checked. They have not been reviewed by a second actuary.
- Not confirmed from a primary source: later amendments to the Delegated Regulation and to the South African standards since 2018, the current rand cap on funeral cover, the annual premium equivalent formula (a market convention), and any formal definition of paid-up, partial withdrawal and not taken up.
- The 167 entries with no source line are general actuarial terms that these texts do not define.
- The namer passes all 193 examples, but those examples were also used to build its phrase list. On 30 everyday descriptions it had not seen, about two thirds gave a clean name at the first try. The rest gave a name with a warning, or a question.
- No name has yet been tried in a real model on a real platform.

## Where the grammar strained during testing, and what changed

The starting point was a six slot order: quantity, cause or benefit, party, basis, measure, timing. Testing it against the examples led to these changes.

1. **One "cause or benefit" slot was not enough.** Names such as accidental death claims and attributable acquisition expenses need two qualifiers. The slot became KIND with up to two tokens.
2. **The order of two kind tokens needed a mechanical rule.** "Put the broader one first" needs judgement, and two people would disagree. The rule is now fixed by the glossary: event and benefit tokens first, pure qualifiers second, alphabetical within each type. The cost is that a few names read a little less naturally, such as `COMM_CLAW_INIT`.
3. **Movements in a balance needed their own slot.** New business, release, accretion, unwind and change in estimates turn a balance into a flow. They are not kinds of the balance. MOVE was added as slot 3.
4. **Measure stays after basis, not at the front.** Putting present value first reads well in English. It was rejected because a sorted list would then split premiums from the present value of premiums. Keeping the item first keeps each family together.
5. **Ratios needed a general device.** Per policy, percentage of premium and per mille of sum at risk would each have needed a token. The clause `PER` plus one item replaced them all. Its limit is that the denominator is a single item with no qualifiers. The quota share proportion comes out as the awkward `SA_RI_PER_SA`.
6. **Timing needed three parts.** A time base for rates, a time point for values, and an order clause for events at the same instant, as in `POL_IF_CNT_EOP_BEF_MAT`. The order clause also handles before and after tax.
7. **Defaults are implied, not written.** Gross of reinsurance and amount are never written. This keeps common names short and keeps one name per description. The cost is that a reader must know the two defaults.
8. **Basis is written only when the description states it.** Stresses and scenarios were kept out of names altogether, because a stress is a run and not a variable. A model that must store a base and a stressed value side by side has no core way to name the second one.
9. **Mortality and death, lapse and lapse risk.** "Mortality rate" is the rate of death, so it uses the death token. The mortality token is kept for the capital risk. The same split was needed for lapse after the check against Solvency II and the South African standards: regulatory lapse risk covers every policyholder option, so it has its own token and the lapse token keeps its narrow meaning.
10. **Withdrawal.** The word is pinned to partial withdrawal. A new term, discontinuance, was needed for lapse and surrender together.
11. **Same concept, two local names.** Dread disease and critical illness are one concept, so they cannot have two short forms. The glossary gained an "also called" field and a table of everyday words. It also gained a "slot" field so that names can be checked by a program.
12. **Short forms that clashed.** Annual and annuity, accumulated and accident and accretion, inception and income and initial, change and charge, indicator and independent. Each pair was given clearly different short forms. Excess of loss took the short form that starts with X, so private tokens use Z.
13. **Embedded value is both an item and a basis.** It is one concept, so it has one short form that may sit in either slot. The first token of a name is always the item, so there is no doubt when reading.
14. **Time lengths needed a unit.** The first draft said names carry no units. That broke on policy duration, which models hold in months and in years side by side. Lengths of time and ages now say years or months. Nothing else carries a unit.
15. **Tables needed a name of their own.** A mortality table is not a variable, so the slot order had no place for it. A table is now the table token followed by the name of the variable it holds, as in `TBL_LPS_INDP_RATE_ANN`.
16. **Things the grammar cannot yet say.** Persistency at a stated duration, such as 13 months, because names carry no numbers. Select periods of a stated length. Anything indexed by fund, benefit or life beyond the simple instance suffix.

## Open questions for reviewers

1. Is seven slots the right number? Could MOVE be folded into KIND without losing the ability to check names by program?
2. Is the mechanical order for two kind tokens acceptable, or should a small table of preferred orders replace it?
3. Should gross of reinsurance be written out after all, for safety in reinsurance heavy models?
4. Should a time point be required on every balance, or should end of period be the default?
5. Is 40 characters the right limit? Some platforms allow fewer. The longest example is 26.
6. How should stressed and scenario results be named when they must sit beside the base result?
7. Should the denominator of a ratio be allowed to carry qualifiers?
8. Are the definitions of lapse, surrender, partial withdrawal, discontinuance, paid-up, maturity and expiry right for every market?
9. Are initial and acquisition, and renewal and maintenance, usefully different, or does the split cause more trouble than it saves?
10. Which terms are missing? 59 glossary terms have no worked example yet. Group business, pensions, health, asset modelling and deferred tax are thin or absent.
11. Should the solvency capital terms be in the core, as now, because Solvency II and South Africa share them? Should the five tax funds stay in the extension?
12. Embedded value: the glossary follows APN 107, where the value of in-force is before the cost of required capital. Other frameworks quote it after. Is one fixed meaning right for an international standard?
13. The namer keeps its own list of items that are balances, so that it can ask for a time point. Should that tag move into the glossary?
14. Should a public hosted API be offered, and who would run it?

## How to take part

Open an issue on this repository for a wrong definition, a missing term, a description the namer gets wrong, or a view on any open question. A proposal for a new term should give the short form, the full term, a one or two sentence definition, what it is not to be confused with, and its related terms.

## Licence

The standard, the glossary and the examples are under the Creative Commons Attribution 4.0 International licence (CC BY 4.0). Anyone may use and adapt them, including in commercial products, if they credit the source. See `LICENSE-TEXT.md`.

The code (`check.py`, `tools/`, `docs/`, `lib/` and `bin/`) is under the MIT licence. See the LICENSE file.
