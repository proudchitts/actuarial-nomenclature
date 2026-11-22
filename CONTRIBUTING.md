# How to take part

This standard is only as good as the actuaries who test it. If you build or review projection models, your corrections are wanted. You do not need to write code, and you do not need to agree with what is here.

Every change is reviewed and approved by the maintainer before it goes in.

## What helps most

1. **A definition that is not exact.** Many definitions were written from general knowledge and have not been reviewed by a second actuary. If one is loose, wrong for your market, or mixes two ideas, say so.
2. **A missing term.** A variable in your model that the glossary cannot name.
3. **A description the namer gets wrong.** Type a description on the [web page](https://proudchitts.github.io/actuarial-nomenclature/). If the name is wrong, or it refuses something that is clear, report the description and what you expected.
4. **A view on an open question.** The README lists them. The slot order, the defaults and the rules can all still change.

## The easy way: open an issue

Choose a form on the [new issue page](https://github.com/proudchitts/actuarial-nomenclature/issues/new/choose). Each form asks only for what is needed. For a longer conversation, use Discussions.

## The direct way: a pull request

1. Edit `glossary.md`. Add or change an entry under its family heading, in this shape:

```
### LPS

- **Full term:** Lapse
- **Slot:** ITEM or KIND
- **Also called:** forfeiture
- **Definition:** The policy ends because premiums due were not paid, and no value is paid to the policyholder.
- **Not to be confused with:** Not SUR, where a value is paid.
- **Source checked:** The public text you checked it against, if there is one.
- **Related terms:** SUR, PUP, WDL
```

   In the related terms line you only need to write the short forms.

2. Run the tidy script. It makes every related link go both ways and rebuilds the indexes.

```bash
python3 tools/format_glossary.py
```

3. Add a worked example to `examples.md` if you added a term, and an everyday phrase to `tools/lexicon.json` if people say it in a way the namer will not know.

4. Rebuild and test.

```bash
python3 tools/build.py
python3 check.py
node tools/test.js
node tools/test_api.js
```

   You do not need to rebuild `docs/embeddings.js`. The maintainer does that before a release.

## Rules for a term

- **One concept, one short form.** If the concept is already in the glossary under another name, add your word to its "also called" line. Do not add a second short form.
- **A short form** is 2 to 6 capital letters or digits, starts with a letter, does not start with Z, and is not already used.
- **A definition** is one or two plain sentences that a second actuary would read the same way. Say what the thing is, not how one model calculates it.
- **Say what it is not.** Name the terms it is most often confused with.
- **General, not local to one company.** Product names, system names and house codes do not belong here. A term used in one market only goes in that market's extension set.

## Rules for sources

- Write definitions in your own words. Do not paste text from standards, regulations, textbooks, course notes or software documentation.
- Do not copy variable lists, names or descriptions from any modelling product or from any company's model. This standard must stay independent of every vendor.
- Naming the public text you checked a definition against is welcome: the standard, the paragraph, the version.

## Style

British spelling. Plain words. Short sentences. No dashes or semicolons in prose. `check.py` enforces the last one.

## Licence

By contributing you agree that your text is released under CC BY 4.0 and your code under the MIT licence, the same as the rest of the repository.
