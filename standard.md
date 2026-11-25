# Open nomenclature for life insurance projection model variables

Version 0.1 (draft for review)

## 1. Purpose and scope

This standard gives every variable in a life insurance projection model one predictable name. It is for life insurance in every market.

It works in both directions. A plain English description of a variable gives exactly one name. A name can be read back into the same English description.

It covers variables in cash flow projection models for life insurance: decrements, policy counts, cash flows, policy values, reserves, IFRS 17 quantities, capital, profit and embedded value. It does not cover non-life insurance, asset models in detail, or data file layouts. A separate standard for non-life insurance may follow.

The standard has three parts.

1. This document: the grammar and the rules.
2. `glossary.md`: the controlled list of terms. A name may use only terms on that list.
3. `examples.md`: worked examples and hard cases.

## 2. The four principles

1. **The description comes first.** The description is the specification of the variable. The name is derived from it by rule. Nobody invents a name.
2. **One concept, one short form.** Each concept has exactly one short form and each short form has exactly one meaning. Words that sound alike but mean different things, such as lapse, surrender and withdrawal, are separate terms with separate definitions.
3. **The standard never guesses.** If a word in a description could mean two things, the description cannot be named. The person describing the variable must say which one they mean.
4. **Only what is said.** A name carries only what the description states. Nothing is added because a reader knows it must be true. If the description gives no time point, the name has none. The same holds for the time base of a rate, the basis, the party and every other slot. The person describing the variable decides what matters. Leaving something out is not vagueness, and the standard does not ask for it.

## 3. Characters and length

- A name is made of tokens joined by a single underscore.
- A token uses the capital letters A to Z and the digits 0 to 9. It starts with a letter. It is 2 to 6 characters long.
- A name has at most 40 characters and at most 9 tokens.
- A name has no spaces, no hyphens, no leading, trailing or double underscores, and no other symbols.
- The standard form is upper case. A platform or language that prefers lower case may write every name in lower case. Mixed case is not allowed. Two names that differ only by case are the same name.

## 4. The slot order

A name is built from seven slots, always in this order.

```
ITEM _ KIND _ MOVE _ PARTY _ BASIS _ MEASURE _ TIME
```

| No. | Slot | Question it answers | Required | Tokens allowed |
|---|---|---|---|---|
| 1 | ITEM | What is the variable about? | Always | Exactly 1 |
| 2 | KIND | Which kind of the item? | No | 0, 1 or 2 |
| 3 | MOVE | Which part of the change in a balance? | No | 0 or 1 |
| 4 | PARTY | Whose share? | No | 0 or 1 |
| 5 | BASIS | On which assumptions and rules? | No | 0 or 1 |
| 6 | MEASURE | What kind of number is it? | No | See section 6 |
| 7 | TIME | Over what span, at what instant, in what order? | No | See section 7 |

The glossary gives the slot of every token. A token can only be used in its own slot. Some terms can be an ITEM or a KIND, for example `DTH` in `DTH_CNT` (number of deaths) and in `CLM_DTH` (death claims). The first token of a name is always the ITEM, so there is never any doubt.

Because each token belongs to a known slot and the slots have a fixed order, a name can be split back into its parts by a simple program. `check.py` in this folder does that.

### 4.1 ITEM

The item is the head noun of the description: the thing that the number is an amount of, a count of, or a rate of.

- "Death claims" is an amount of claims, so the item is `CLM`.
- "Mortality rate" is a rate of death, so the item is `DTH`.
- "Claim handling expenses" is an amount of expenses, so the item is `EXP` and the name is `EXP_CLM`.
- "Rate of expense inflation" is a rate of inflation, so the item is `INFL` and the name is `INFL_EXP_RATE_ANN`.

### 4.2 KIND

A kind token narrows the item. `CLM_DTH` is the claims that arise on death. `EXP_INIT` is the expenses that arise at the start.

- If the kind is left out, the variable is the total over all kinds. `CLM` is all claims of every type.
- A second kind token is allowed. `CLM_DTH_ACCD` is death claims, and of those the accidental ones.
- When there are two kind tokens their order is fixed by a mechanical rule, so that no judgement is needed. A token that the glossary marks "ITEM or KIND" comes first. These are the events, causes and benefits. A token marked "KIND" only comes second. These are the qualifiers.
- If both tokens are of the same type, they are written in alphabetical order. `COMM_CLAW_INIT` is clawback of initial commission. `DTH_HIV_INDP_RATE_ANN` has the kinds `HIV` and `INDP` in that order.

### 4.3 MOVE

A move token turns a balance into one part of the change in that balance over the period. `CSM_EOP` is a balance. `CSM_REL` is the amount of CSM released in the period. `POL_NB_CNT` is the number of policies added by new business.

A move token can also follow a flow. `PREM_NB` is premium from new business. `PREM_EXPV` is the experience variance on premiums.

### 4.4 PARTY

| Party | Token | Meaning |
|---|---|---|
| Gross of reinsurance | none | The direct business before reinsurance. This is implied and never written. |
| Reinsurance ceded | `RI` | The reinsurers' share. |
| Net of reinsurance | `NET` | Gross less reinsurance ceded. |
| Shareholder | `SH` | The shareholders' share. |
| Policyholder | `PH` | The policyholders' share. |

A name with no party token is gross of reinsurance. The glossary defines `GRS` so that the concept has an entry, but `GRS` is never written in a name. This keeps the most common names short, and it keeps the rule of one name per description.

Reinsurance amounts are seen from the insurer's side. `PREM_RI` is the premium the insurer pays to reinsurers. `CLM_DTH_RI` is the death claim amount the insurer recovers from reinsurers. For every item, net equals gross less reinsurance.

### 4.5 BASIS

| Basis | Token |
|---|---|
| Best estimate | `BE` |
| Prudent, with margins | `PRU` |
| Pricing | `PRC` |
| IFRS 17, locked-in discount rates | `IFL` |
| IFRS 17, current discount rates | `IFC` |
| Solvency II | `SII` |
| Embedded value | `EV` |
| Risk neutral | `RN` |
| Real world | `RW` |
| SAM (ZA extension) | `SAM` |
| Financial soundness valuation (ZA extension) | `FSV` |

The rule is simple. If the description states a basis, the name carries the basis token. If the description states no basis, the name carries none, and the variable takes whatever basis the model run is on.

This fits how models are used. Most models run on one basis at a time, and the basis belongs to the run and not to the variable. A basis token is needed when one run holds the same quantity on two bases side by side. The usual cases are IFRS 17 locked-in and current discount rates, a pricing basis kept for comparison, and embedded value results built on top of a reserving basis.

A stress or scenario is not a basis. See section 8.

## 5. Sign and units

- Every amount is stored as a positive number in its natural direction. Premiums are positive income. Claims and expenses are positive outgo.
- Items that are a difference, such as `NCF` and `PROF`, are income less outgo.
- Names carry no sign, no unit and no currency. Whether a rate is held as 0.05 or as 5 is a matter for the model's metadata, not for the name.
- There is one exception. A length of time or an age says whether it is in years or in months, because models often hold both side by side. `DUR_MTHS_EOP` is the policy duration in months and `TERM_YRS` is the policy term in years.

## 6. The MEASURE slot

The measure says what kind of number the variable holds. With no measure token the variable is an amount.

| Measure | Token | Notes |
|---|---|---|
| Amount | none | Implied. `AMT` is defined in the glossary and never written. |
| Count | `CNT` | Number of policies, lives, events or units. |
| Rate | `RATE` | Takes a time base when the description gives one. See section 7. |
| Probability | `PROB` | Probability of a state at a time point. No time base. |
| Force | `FORCE` | Instantaneous annual rate. |
| Present value | `PV` | Measured at the start of the period. Never takes a time point. |
| Factor | `FAC` | A multiplier with no units. |
| Indicator | `IND` | 1 or 0, calculated by the model, can vary with time. |
| Flag | `FLG` | A setting fixed for the run. |
| Index | `IDX` | Level of an index. |
| In years | `YRS` | Only for lengths of time and ages. |
| In months | `MTHS` | Only for lengths of time and ages. |

The slot can hold up to three parts, in this order.

1. One measure token from the table above.
2. One aggregation token: `CUM` (sum to date, no interest), `ACC` (sum to date with interest), `FUT` (sum of future periods, not discounted) or `AVG` (average over the period). `CUM`, `ACC` and `FUT` carry their own time point and never take one. See section 7.1.
3. One ratio clause: `PER` followed by exactly one item token, which is the denominator.

### 6.1 Counts

A count takes the thing counted as its item. `POL_IF_CNT_EOP` is the number of policies in force at the end of the period. `DTH_CNT` is the number of deaths in the period.

A count of a decrement counts policies leaving by that decrement. If lives are meant, the description must say so and the item is `LIFE`.

### 6.2 Rates

A rate of an event is the probability that the event happens within the time base. A rate of interest, inflation or growth is the effective rate over the time base. The time base is written when the description gives it: `LPS_DEP_RATE_MTH`, `DISC_FWD_RATE_ANN`. A description that says only "lapse rate" in the strict sense gives `LPS_RATE`.

In a model with more than one decrement, a description can say whether the rate is dependent (`DEP`) or independent (`INDP`). That too is written only when it is said.

### 6.3 Ratios

Any ratio of one item to another uses `PER`. This replaces separate tokens for "per policy", "percentage of premium", "per mille of sum at risk" and so on.

- `EXP_REN_PER_POL_ANN` is renewal expense per policy per year.
- `COMM_INIT_PER_PREM` is initial commission as a proportion of premium.
- `PREM_RI_PER_SAR_ANN` is the annual reinsurance premium per unit of sum at risk.

The denominator is one item token with no qualifiers. Whether the ratio is held per 1, per 100 or per 1000 is metadata.

### 6.4 Present values

`PV` is the discounted, probability-weighted value of the future amounts of the item, as seen from the start of the period. `PREM_BE_PV` is the present value of future premiums on the best estimate basis.

Where a framework defines a named present value, use the named item and not a built name. The best estimate liability is `BEL_EOP`, not a present value of claims less premiums.

### 6.5 Indicators and flags

An indicator is calculated by the model and may change from period to period: `POL_IF_IND_BOP`, `ONER_IND`. A flag is chosen by the user for the whole run. Both are named after the condition or feature they refer to.

## 7. The TIME slot

The slot can hold up to three parts, in this order.

1. **Time base**: `ANN` (per year), `MTH` (per month) or `PRD` (per model period).
2. **Time point**: `BOP` (start of period), `MOP` (middle of period), `EOP` (end of period) or `INC` (policy inception). There is no valuation date token. The value at the valuation date is the value at the first time step.
3. **Order clause**: `BEF` or `AFT` followed by exactly one token.

### 7.1 When a time point is written

- A time point is written only when the description states one. The standard never asks for it and never adds one. The person describing the variable knows whether the instant matters. `BEL` is the best estimate liability. `BEL_EOP` is the best estimate liability at the end of the period. Both are valid names, and they are different variables only if the model holds both.
- A value whose instant is fixed by its definition needs no time point. The value of new business and the value of in-force are present values at the valuation date, so they are `VNB` and `VIF`.
- Some measures carry their own time point, and never take one. A present value (`PV`) and a future total (`FUT`) look forward from the start of the period. An accumulated value (`ACC`) and a cumulative total (`CUM`) look back from the end of it. `PREM_PV` is the present value of future premiums at the start of each period, and at the first time step that is the valuation date.
- A flow is a total over the model period and has no time point. `PREM` is the premium of the period. When within the period it is assumed to be paid is a model assumption and not part of the name.
- A constant that does not change through the projection has no time point. Examples are a retention limit, a flag and a policy term.

### 7.2 Time base

A rate has a time base when the description gives one. An amount has a time base only when the description says it is expressed per year or per month. `PREM_PER_POL_ANN` is the annualised premium per policy.

### 7.3 Order clause

Many things can happen at the same instant, and the order matters. `POL_IF_CNT_EOP_BEF_MAT` is the number in force at the end of the period before maturities are taken off. `FV_EOP_BEF_CHRG` is the fund value at the end of the period before charges are deducted.

The same clause handles "before tax" and "after tax". `PROF_AFT_TAX` is profit after tax.

## 8. What a name does not carry

A name says what a variable means. It does not say where the variable lives or how it is stored. The following are never part of a name.

- Product, fund, portfolio or cohort.
- Scenario, stress, sensitivity or run number. A stress is a run. Results under a stress keep the same names, and the run carries the stress label.
- Units, currency, sign and data type. The only unit a name carries is years or months on a length of time.
- Whether the variable is an input, an output or an intermediate step.
- Array dimensions and time subscripts.

### 8.1 Tables and assumption sets

A model reads tables as well as calculating variables. A table is named with `TBL` as the first token, followed by the full name of the variable that the table holds. The part after `TBL` must be a valid name by itself.

- `TBL_DTH` is a mortality table.
- `TBL_LPS_INDP_RATE_ANN` is a table of independent annual lapse rates. The variable read from it is `LPS_INDP_RATE_ANN`.
- `TBL_ASM_ECON` is the table of economic assumptions. `ASM_DEMOG` is the demographic assumption set.

As a kind, in any later position, the same token means a value read from a base table before adjustment: `DTH_TBL_INDP_RATE_ANN`.

What a table is indexed by, such as age, sex or duration, is not part of its name.

### 8.2 Instances

Some platforms cannot hold a dimension and need separate variables for the first and second life, or for each benefit. For this one case a name may end with an instance token after the TIME slot.

- `L` and a number for a life: `DTH_INDP_RATE_ANN_L2` is the rate for the second life.
- `B` and a number for a benefit.
- `F` and a number for a fund.

No glossary token has the form of an instance token.

## 9. What stops a name, and what does not

Only one thing stops a name: a word with two meanings. Points 1 and 2 below are the common cases, and the namer asks which meaning is meant.

The other points are things a description can say when they matter to the model. The standard never asks for them and never adds them. If a model holds two variables that differ on one of these points, their two descriptions must differ on it, or they will get the same name.

1. **How a policy ends.** Lapse, surrender, partial withdrawal, paid-up, maturity and expiry are six different things. "Withdrawal" on its own is not enough. Say which one, or say discontinuance (`DCON`) if lapse and surrender together are meant.
2. **Gross of what.** "Gross" and "net" must say gross or net of reinsurance, or before or after tax. "Gross premium" in the sense of the premium charged to the policyholder is the office premium.
3. **Dependent or independent.** For a decrement rate in a model with several decrements.
4. **The time base of a rate.** Annual, monthly or per model period, when it matters.
5. **The time point of a value, where it matters.** A name carries a time point only if the description states one. If a model holds the same value at the start and at the end of the period, the two descriptions must say which is which. If events happen at the same instant, say before or after which of them.
6. **Policies or lives.** For any count on joint life, group or family business.
7. **The basis.** Whenever more than one basis exists in the same run.
8. **The event or the risk.** Death and lapse are events. Mortality risk and lapse risk are capital risks with wider regulatory meanings, and they have their own tokens.
9. **Level or expected amount.** The benefit that would be paid (`BEN`, `SV`, `SA`) is different from the expected payment in the period (`CLM`).
10. **Timing or purpose.** Initial and renewal are defined by when a cost arises. Acquisition and maintenance are defined by what it is for.

## 10. The canonical description

Every name has one canonical description, built from the full terms in the glossary in this pattern.

```
[measure] of [kinds] [item] [move], [party], [basis], [time base], [time point], [order clause]
```

Example: `CLM_DTH_RI_BE_PV` reads "Present value of death claims, reinsurance ceded, best estimate".

A user may write a description in any natural wording. It is acceptable when it maps to exactly one canonical description.

### 10.1 From description to name

1. Find the head noun. That is the ITEM.
2. Find the words that narrow the item. Those are the KIND tokens, at most two, ordered by section 4.2.
3. If the variable is part of the change in a balance, add the MOVE token.
4. If it is a reinsurance, net, shareholder or policyholder share, add the PARTY token.
5. If the description states a basis, add the BASIS token.
6. Add the MEASURE parts, unless it is a plain amount.
7. Add the TIME parts required by section 7.
8. Look up every token in the glossary and read its "not to be confused with" note. If a note raises a doubt, go back to the description and make it explicit.

### 10.2 From name to description

1. Split the name at the underscores.
2. The first token is the item.
3. Look up each later token in the glossary to find its slot.
4. Read the measure first, then the kinds and the item, then the move, party, basis and time.

## 11. Extensions

The core list cannot cover every market and every company. Extensions add tokens without changing the core.

### 11.1 Registered extension sets

The core is for every market. A registered set holds the terms that only one market uses, such as a local tax fund or a local solvency basis. It has a two letter code. The first registered set is **ZA** for South Africa, because that is where the work started. Sets for other markets are welcome and are added in the same way.

- Tokens in a registered set are unique across the core and all registered sets.
- A model states the sets it uses, for example "Nomenclature 0.1 with ZA".

### 11.2 Private tokens

A company may add its own tokens for concepts that no published list covers.

- A private token starts with the letter Z and is 3 to 6 characters long, for example `ZLOY` for a company's own loyalty bonus. No core or registered token starts with Z.
- Each private token has an entry in a local glossary file in the same format as `glossary.md`, including its slot, definition and related terms.

### 11.3 What an extension may not do

- It may not change the slot order or add a slot.
- It may not redefine a core token or give a core concept a second short form.
- It may not add a token for a product name, a system name or a person's name.

A private token that proves useful to others can be proposed for a registered set or for the core. When it is accepted it gets a new short form without the Z, and the old one is retired.

## 12. Conformance

A model conforms to version 0.1 when all of these hold.

1. Every variable name passes the character and length rules of section 3.
2. Every token is in the core glossary, in a declared registered set, or in the model's local glossary of private tokens.
3. Every name has its tokens in slot order, within the limits of sections 4, 6 and 7.
4. Every variable has a description that maps to its name by section 10.

`check.py` tests points 1 to 3 for every name in `examples.md` and can be pointed at any list of names. The rule-based namer in `docs/` applies section 10.1 by program: it builds the name from a description, asks when the description is vague, and reads every name back.

## 13. Versioning

- A short form is never reused for a different concept. A retired short form stays retired.
- A minor version may add tokens. Only a major version may change the slot order or a definition.
- Version 0.1 is a draft. Everything in it is open to change after review.

## 14. Groups

A model with hundreds of variables needs them sorted into a few groups for browsing. Every name falls in exactly one group. The group is worked out from the tokens of the name, so nobody chooses it and two people cannot file the same variable in different places.

The thirteen groups are: Time and policy data. Assumptions and tables. Decrements. Policy counts. Premiums and benefits. Commission and expenses. Unit funds and bonuses. Investment and tax. Reinsurance. Reserving and capital. IFRS 17. Profit, EV and VNB. Indicators and flags.

The rules are applied in this order, and the first one that fits decides.

1. A name that starts with `TBL` is in Assumptions and tables.
2. A name whose measure is `IND` or `FLG` is in Indicators and flags.
3. A name whose item is an IFRS 17 term, or whose basis is `IFL` or `IFC`, is in IFRS 17.
4. A name with the party `RI` is in Reinsurance.
5. A count of a decrement, such as `DTH_CNT`, is in Policy counts.
6. Otherwise the group is the group of the item. `tools/groups.json` lists the group of every item.

A group says what a variable is about. It does not say what the variable is used for. Roles such as output, data check or alternative basis depend on the model and are not part of this standard. A platform can add them as its own tags.
