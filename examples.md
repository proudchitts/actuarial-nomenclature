# Worked examples, version 0.1 (draft)

Part A turns descriptions into names. Part B reads names back into English. Part C shows descriptions that cannot be named until the user says more.

Every name on this page is tested by `check.py` against the glossary and the slot order. Every description in Part A is also run through the rule-based namer by `tools/test.js`, and must give exactly the name shown.

Reminders from `standard.md`:

- Slot order: ITEM, KIND, MOVE, PARTY, BASIS, MEASURE, TIME.
- No party token means gross of reinsurance. No measure token means an amount. No basis token means the basis of the run.
- A time point is written only when the description states one. The standard never asks for it.

## Part A. Description to name

### A1. Decrements

| No. | Description | Name |
|---|---|---|
| 1 | Independent annual rate of death | `DTH_INDP_RATE_ANN` |
| 2 | Dependent monthly rate of death | `DTH_DEP_RATE_MTH` |
| 3 | Independent annual rate of death read from the base table | `DTH_TBL_INDP_RATE_ANN` |
| 4 | Adjustment factor applied to rates of death | `DTH_ADJ_FAC` |
| 5 | Annual rate of mortality improvement | `DTH_IMP_RATE_ANN` |
| 6 | Dependent monthly rate of lapse | `LPS_DEP_RATE_MTH` |
| 7 | Independent annual rate of surrender, best estimate | `SUR_INDP_BE_RATE_ANN` |
| 8 | Independent annual rate at which policies become paid-up | `PUP_INDP_RATE_ANN` |
| 9 | Independent annual rate of becoming disabled | `DIS_INDP_RATE_ANN` |
| 10 | Monthly rate of recovery from disability | `REC_RATE_MTH` |
| 11 | Independent annual rate of critical illness | `CI_INDP_RATE_ANN` |
| 12 | Independent annual rate of death for the second life | `DTH_INDP_RATE_ANN_L2` |
| 13 | Force of mortality | `DTH_FORCE` |

### A2. Policy counts

| No. | Description | Name |
|---|---|---|
| 14 | Number of policies in force at the start of the period | `POL_IF_CNT_BOP` |
| 15 | Number of policies in force at the end of the period, before maturities are taken off | `POL_IF_CNT_EOP_BEF_MAT` |
| 16 | Number of paid-up policies at the end of the period | `POL_PUP_CNT_EOP` |
| 17 | Number of new policies added in the period | `POL_NB_CNT` |
| 18 | Number of deaths in the period | `DTH_CNT` |
| 19 | Number of lapses in the period | `LPS_CNT` |
| 20 | Number of surrenders in the period | `SUR_CNT` |
| 21 | Number of policies that become paid-up in the period | `PUP_CNT` |
| 22 | Number of reinstatements in the period | `RINST_CNT` |
| 23 | Number of lives in force at the end of the period | `LIFE_IF_CNT_EOP` |
| 24 | Probability that the policy is in force at the end of the period | `POL_IF_PROB_EOP` |
| 25 | Indicator that the policy is in force at the start of the period | `POL_IF_IND_BOP` |

### A3. Premiums

| No. | Description | Name |
|---|---|---|
| 26 | Premiums in the period | `PREM` |
| 27 | Single premiums in the period | `PREM_SGL` |
| 28 | Regular premiums from new business in the period | `PREM_REG_NB` |
| 29 | Annualised premium per policy | `PREM_PER_POL_ANN` |
| 30 | Risk premium in the period | `PREM_RISK` |
| 31 | Present value at the start of the period of future premiums, best estimate | `PREM_BE_PV` |
| 32 | Annual rate of premium escalation | `ESC_PREM_RATE_ANN` |
| 33 | Premium allocated to the unit fund in the period | `PREM_ALLOC` |
| 34 | Allocated premium as a proportion of premium | `PREM_ALLOC_PER_PREM` |
| 35 | Total premiums paid to date at the end of the period, without interest | `PREM_CUM` |

### A4. Claims and benefits

| No. | Description | Name |
|---|---|---|
| 36 | All claims in the period | `CLM` |
| 37 | Death claims in the period | `CLM_DTH` |
| 38 | Accidental death claims in the period | `CLM_DTH_ACCD` |
| 39 | Surrender payments in the period | `CLM_SUR` |
| 40 | Partial withdrawal payments in the period | `CLM_WDL` |
| 41 | Maturity payments in the period | `CLM_MAT` |
| 42 | Annuity payments in the period | `CLM_ANTY` |
| 43 | Disability income claims in the period | `CLM_DIS_INCM` |
| 44 | Lump sum critical illness claims in the period | `CLM_CI_LS` |
| 45 | Death benefit per policy at the end of the period | `BEN_DTH_EOP` |
| 46 | Sum assured at inception | `SA_INC` |
| 47 | Sum at risk at the start of the period | `SAR_BOP` |
| 48 | Surrender value per policy at the end of the period | `SV_EOP` |
| 49 | Present value at the valuation date of future death claims, net of reinsurance | `CLM_DTH_NET_PV` |

### A5. Expenses and commission

| No. | Description | Name |
|---|---|---|
| 50 | Initial expenses in the period | `EXP_INIT` |
| 51 | Renewal expense per policy per year | `EXP_REN_PER_POL_ANN` |
| 52 | Directly attributable acquisition expenses in the period | `EXP_ACQ_ATTR` |
| 53 | Claim handling expenses in the period | `EXP_CLM` |
| 54 | Annual investment expense as a proportion of fund value | `EXP_INV_PER_FV_ANN` |
| 55 | Annual rate of expense inflation | `INFL_EXP_RATE_ANN` |
| 56 | Expense inflation index at the end of the period | `INFL_EXP_IDX_EOP` |
| 57 | Initial commission in the period | `COMM_INIT` |
| 58 | Initial commission as a proportion of premium | `COMM_INIT_PER_PREM` |
| 59 | Clawback of initial commission in the period | `COMM_CLAW_INIT` |
| 60 | Flag that turns commission clawback on or off | `COMM_CLAW_FLG` |

### A6. Reinsurance

| No. | Description | Name |
|---|---|---|
| 61 | Reinsurance premiums in the period | `PREM_RI` |
| 62 | Premiums net of reinsurance in the period | `PREM_NET` |
| 63 | Annual reinsurance premium per unit of sum at risk | `PREM_RI_PER_SAR_ANN` |
| 64 | Death claims recovered from reinsurers in the period | `CLM_DTH_RI` |
| 65 | Reinsurance commission in the period | `COMM_RI` |
| 66 | Reinsured sum at risk at the start of the period | `SAR_RI_BOP` |
| 67 | Reinsured sum assured as a proportion of sum assured | `SA_RI_PER_SA` |
| 68 | Retention limit | `RET` |

### A7. Reserves, BEL and policy values

| No. | Description | Name |
|---|---|---|
| 69 | Best estimate liability at the end of the period | `BEL_EOP` |
| 70 | Reinsurers' share of the best estimate liability at the end of the period | `BEL_RI_EOP` |
| 71 | Unwind of discount on the best estimate liability in the period | `BEL_UNW` |
| 72 | Reserve on the pricing basis at the end of the period | `RES_PRC_EOP` |
| 73 | Non-unit reserve at the end of the period | `RES_NUNIT_EOP` |
| 74 | Change in reserve over the period | `RES_CHG` |
| 75 | Incurred but not reported reserve at the end of the period | `IBNR_EOP` |
| 76 | Fund value at the end of the period before charges | `FV_EOP_BEF_CHRG` |
| 77 | Fund management charges in the period | `CHRG_FMC` |
| 78 | Reversionary bonus added in the period | `BON_RVS` |
| 79 | Time value of options and guarantees at the valuation date, risk neutral | `TVOG_RN_BOP` |

### A8. IFRS 17

| No. | Description | Name |
|---|---|---|
| 80 | Contractual service margin at the end of the period | `CSM_EOP` |
| 81 | Contractual service margin added by new business in the period | `CSM_NB` |
| 82 | Interest accreted on the contractual service margin in the period | `CSM_ACCR` |
| 83 | Contractual service margin released in the period | `CSM_REL` |
| 84 | Change in estimates that adjusts the contractual service margin | `CSM_ESTCH` |
| 85 | Risk adjustment at the end of the period | `RA_EOP` |
| 86 | Risk adjustment released in the period | `RA_REL` |
| 87 | Reinsurers' share of the risk adjustment at the end of the period | `RA_RI_EOP` |
| 88 | Coverage units provided in the period | `CU` |
| 89 | Coverage units of all future periods, as at the end of the period | `CU_FUT` |
| 90 | Insurance acquisition cash flows in the period | `IACF` |
| 91 | Insurance finance expense presented in profit or loss | `IFE_PL` |
| 92 | Insurance finance expense presented in other comprehensive income | `IFE_OCI` |
| 93 | Annual forward discount rate, IFRS 17 locked-in | `DISC_FWD_IFL_RATE_ANN` |
| 94 | Fulfilment cash flows at current rates at the end of the period | `FCF_IFC_EOP` |
| 95 | Best estimate liability at locked-in rates at the end of the period | `BEL_IFL_EOP` |
| 96 | Loss component at the end of the period | `LC_EOP` |
| 97 | Indicator that the group of contracts is onerous | `ONER_IND` |
| 98 | Insurance revenue in the period | `IREV` |
| 99 | Insurance service result in the period | `ISR` |
| 100 | Liability for remaining coverage at the end of the period | `LRC_EOP` |
| 101 | Experience variance on premiums in the period | `PREM_EXPV` |
| 102 | Claims in the period that are repayments of investment components | `CLM_INVC` |

### A9. Capital

| No. | Description | Name |
|---|---|---|
| 103 | Solvency capital requirement at the end of the period | `SCR_EOP` |
| 104 | Solvency capital requirement for mortality risk at the end of the period | `SCR_MORT_EOP` |
| 105 | Solvency capital requirement for lapse risk, up shock, at the end of the period | `SCR_LPSR_UP_EOP` |
| 106 | Diversification benefit within the solvency capital requirement at the end of the period | `SCR_DIV_EOP` |
| 107 | Minimum capital requirement at the end of the period | `MCR_EOP` |
| 108 | Own funds at the end of the period | `OF_EOP` |
| 109 | Risk margin at the end of the period | `RM_EOP` |
| 110 | Shock size for mass lapse risk | `SHK_LPSR_MASS` |
| 111 | Required capital at the end of the period | `RCAP_EOP` |
| 112 | Annual cost of capital rate | `COC_RATE_ANN` |

### A10. Profit, embedded value and value of new business

| No. | Description | Name |
|---|---|---|
| 113 | Net cash flow in the period | `NCF` |
| 114 | Profit before tax in the period | `PROF_BEF_TAX` |
| 115 | Profit after tax in the period | `PROF_AFT_TAX` |
| 116 | Transfer to shareholders in the period | `TRF_SH` |
| 117 | Distributable earnings in the period | `DISTE` |
| 118 | Present value at the valuation date of future profits after tax, embedded value basis | `PROF_EV_PV_AFT_TAX` |
| 119 | Value of in-force at the valuation date | `VIF_BOP` |
| 120 | Adjusted net worth at the valuation date | `ANW_BOP` |
| 121 | Embedded value at the valuation date | `EV_BOP` |
| 122 | Value of new business written in the period | `VNB` |
| 123 | Annual premium equivalent in the period | `APE` |
| 124 | Value of new business as a proportion of annual premium equivalent | `VNB_PER_APE` |
| 125 | Annual discount rate on the embedded value basis | `DISC_EV_RATE_ANN` |
| 126 | Investment return in the period | `INVR` |
| 127 | Tax borne by policyholders in the period | `TAX_PH` |
| 128 | Present value of new business premiums | `PVNBP` |
| 129 | Cost of required capital at the valuation date, embedded value basis | `COC_EV_BOP` |
| 130 | Solvency capital requirement for interest rate risk at the end of the period | `SCR_INT_EOP` |
| 131 | Solvency capital requirement for revision risk at the end of the period | `SCR_REVN_EOP` |
| 132 | Loss-absorbing capacity within the solvency capital requirement at the end of the period | `SCR_LAC_EOP` |
| 133 | Indicator that the group is measured under the variable fee approach | `VFA_IND` |
| 134 | Value of underlying items at the end of the period | `UNDL_EOP` |

### A11. South African extension (ZA)

These names are valid only in a model that declares the ZA set.

| No. | Description | Name |
|---|---|---|
| 135 | Best estimate liability on the SAM basis at the end of the period | `BEL_SAM_EOP` |
| 136 | Reserve on the financial soundness valuation basis at the end of the period | `RES_FSV_EOP` |
| 137 | Funeral cover claims in the period | `CLM_FUN` |
| 138 | Sum assured for funeral cover at the start of the period | `SA_FUN_BOP` |
| 139 | Number of lives per policy | `LIFE_CNT_PER_POL` |
| 140 | Independent annual rate of death from HIV and AIDS | `DTH_HIV_INDP_RATE_ANN` |
| 141 | Loading for death from HIV and AIDS | `LOAD_DTH_HIV` |
| 142 | Retrenchment claims in the period | `CLM_RETR` |
| 143 | Tax in the individual policyholder fund in the period | `TAX_IPF` |
| 144 | Bonus stabilisation reserve at the end of the period | `BSR_EOP` |
| 145 | Tax in the corporate fund in the period | `TAX_CORF` |
| 146 | Compulsory margin on lapse | `MGN_LPS_COMP` |
| 147 | Credit life claims on retrenchment in the period | `CLM_RETR_CRDL` |
| 148 | Capital adequacy requirement at the end of the period | `CAR_EOP` |

Dread disease is the South African name for critical illness. It is the same concept, so it uses the core token. A dread disease claim is `CLM_CI`.

### A12. Further core terms

| No. | Description | Name |
|---|---|---|
| 149 | Extra premiums in the period | `PREM_EXTRA` |
| 150 | Policy fees in the period | `CHRG_POLF` |
| 151 | Bid price at the end of the period | `UPRC_BID_EOP` |
| 152 | Surplus on the prudent basis at the end of the period | `SURP_PRU_EOP` |
| 153 | New business strain in the period | `NBS` |
| 154 | Market value reduction in the period | `MVR` |
| 155 | Internal rate of return | `IRR` |
| 156 | Deferred period | `DEFP` |
| 157 | Overhead expenses in the period | `EXP_OH` |
| 158 | Maturity payments on with-profits business in the period | `CLM_MAT_WP` |

### A13. Time and policy data

A length of time or an age says its unit. This is the one place where a name carries a unit.

| No. | Description | Name |
|---|---|---|
| 159 | Policy duration in months at the end of the period | `DUR_MTHS_EOP` |
| 160 | Policy term in years | `TERM_YRS` |
| 161 | Premium payment term in years | `TERM_PREM_YRS` |
| 162 | Remaining policy term in months at the start of the period | `TERM_REM_MTHS_BOP` |
| 163 | Projection time in months | `TIME_MTHS` |
| 164 | Policy year at the start of the period | `POLYR_BOP` |
| 165 | Indicator that the period contains a policy anniversary | `ANNIV_IND` |
| 166 | Inception date | `DATE_INC` |
| 167 | Maturity date | `DATE_MAT` |
| 168 | Date of birth | `DOB` |
| 169 | Calendar year at the end of the period | `CALYR_EOP` |
| 170 | Age last birthday at inception | `AGE_ALB_INC` |
| 171 | Sex | `SEX` |
| 172 | Smoker status | `SMK` |
| 173 | Premium frequency | `FREQ_PREM` |

### A14. Tables, assumptions and model data

A table is named with the table token first, followed by the name of the variable it holds.

| No. | Description | Name |
|---|---|---|
| 174 | Mortality table | `TBL_DTH` |
| 175 | Select mortality table | `TBL_DTH_SEL` |
| 176 | Table of independent annual lapse rates | `TBL_LPS_INDP_RATE_ANN` |
| 177 | Economic assumption table | `TBL_ASM_ECON` |
| 178 | Demographic assumption set | `ASM_DEMOG` |
| 179 | Expense assumption table | `TBL_ASM_EXP` |
| 180 | Table of initial commission as a proportion of premium | `TBL_COMM_INIT_PER_PREM` |
| 181 | Table of annual spot discount rates | `TBL_DISC_SPOT_RATE_ANN` |
| 182 | Number of model points | `MPT_CNT` |
| 183 | Scenario | `SCEN` |

### A15. Unit pricing, reserves and value

| No. | Description | Name |
|---|---|---|
| 184 | Appropriation price at the end of the period | `UPRC_APPR_EOP` |
| 185 | Expropriation price at the end of the period | `UPRC_EXPR_EOP` |
| 186 | Negative non-unit reserve at the end of the period | `RES_NEG_NUNIT_EOP` |
| 187 | Mismatching reserve at the end of the period | `RES_MISM_EOP` |
| 188 | Reserve on the fair value basis at the end of the period | `RES_FAIR_EOP` |
| 189 | Bonus earning capacity | `BEC` |
| 190 | Appraisal value at the valuation date | `APV_BOP` |
| 191 | Aggregate asset share at the end of the period | `ASHR_AGG_EOP` |
| 192 | Financial reinsurance premiums in the period | `PREM_FINRE` |
| 193 | Requirement for capital at inception | `CAPRQ_INC` |

### A16. Actuarial funding and special reserves

| No. | Description | Name |
|---|---|---|
| 194 | Actuarially funded fund value at the end of the period | `FV_FND_EOP` |
| 195 | Unfunded fund value at the end of the period | `FV_UNFND_EOP` |
| 196 | Nominal fund value at the end of the period | `FV_NOML_EOP` |
| 197 | Actuarial funding factor | `ACTF_FAC` |
| 198 | Number of capital units at the end of the period | `UNIT_CAPU_CNT_EOP` |
| 199 | Mortality fluctuation reserve at the end of the period | `RES_DTH_FLUC_EOP` |
| 200 | Contingency reserve at the end of the period | `RES_CTGY_EOP` |
| 201 | Expense overrun reserve at the end of the period | `RES_OVRN_EOP` |

### A17. Expense bases for value of new business

| No. | Description | Name |
|---|---|---|
| 202 | Marginal cost value of new business in the period | `VNB_MARG` |
| 203 | Full cost value of new business in the period | `VNB_FULL` |
| 204 | Zero acquisition cost value of new business in the period | `VNB_NOACQ` |
| 205 | Fully allocated acquisition expenses in the period | `EXP_ACQ_FULL` |
| 206 | Value of new business as a proportion of present value of new business premiums | `VNB_PER_PVNBP` |

### A18. Further terms found by testing on a real model

| No. | Description | Name |
|---|---|---|
| 207 | Fixed renewal expenses in the period | `EXP_FIX_REN` |
| 208 | VAT on initial commission in the period | `COMM_INIT_VAT` |
| 209 | Top-up premiums in the period | `PREM_TOPUP` |
| 210 | Savings premiums in the period | `PREM_SAV` |
| 211 | Loyalty bonus added in the period | `BON_LOY` |
| 212 | Policy loan at the end of the period | `LOAN_EOP` |
| 213 | Capital gains in the period | `GAIN` |
| 214 | Deferred acquisition costs at the end of the period | `DAC_EOP` |
| 215 | Number of fund switches in the period | `SWCH_CNT` |
| 216 | Number of policy alterations in the period | `ALTR_CNT` |
| 217 | Actual premiums in the period | `PREM_ACTL` |
| 218 | Maximum fund management charge | `CHRG_FMC_MAX` |
| 219 | Reserve on the valuation basis at the end of the period | `RES_VAL_EOP` |
| 220 | Cohort | `COH` |
| 221 | Taxable profit in the period | `PROF_TXBL` |

### A19. A name carries only what the description gives

| No. | Description | Name |
|---|---|---|
| 222 | Best estimate liability | `BEL` |
| 223 | Number of policies in force | `POL_IF_CNT` |
| 224 | Value of in-force | `VIF` |
| 225 | Rate of lapse | `LPS_RATE` |
| 226 | Discount rate | `DISC_RATE` |

### A20. Tables with several columns, and compute modules

The table is named after what its columns share, so `DISC_FAC_BOP` is found in `TBL_DISC`.

| No. | Description | Name |
|---|---|---|
| 227 | Yield curve | `TBL_DISC` |
| 228 | Annual spot discount rate | `DISC_SPOT_RATE_ANN` |
| 229 | Discount factor at the start of the period | `DISC_FAC_BOP` |
| 230 | Monthly forward discount rate | `DISC_FWD_RATE_MTH` |
| 231 | Yield curve, up shock | `TBL_DISC_UP` |
| 232 | Module that produces economic scenarios | `MOD_SCEN_ECON` |
| 233 | Compute module for the best estimate liability | `MOD_BEL` |

## Part B. Name to description

Each name is split into its slots and then read measure first.

| No. | Name | Slots | Reads as |
|---|---|---|---|
| 1 | `CLM_DTH_RI_BE_PV` | item claim, kind death, party reinsurance, basis best estimate, measure present value, time end of period | Present value of future death claims recovered from reinsurers, on the best estimate basis |
| 2 | `LPS_INDP_PRC_RATE_ANN` | item lapse, kind independent, basis pricing, measure rate, time base annual | Independent annual rate of lapse on the pricing basis |
| 3 | `EXP_ATTR_MAINT_PER_POL_ANN` | item expense, kinds directly attributable then maintenance, measure per policy, time base annual | Directly attributable maintenance expense per policy per year |
| 4 | `CSM_ESTCH_RI` | item contractual service margin, move change in estimates, party reinsurance | Change in estimates that adjusts the contractual service margin on reinsurance held, in the period |
| 5 | `DISC_SPOT_IFC_RATE_ANN` | item discount, kind spot, basis IFRS 17 current, measure rate, time base annual | Annual spot discount rate at current IFRS 17 rates |
| 6 | `DTH_CNT_CUM` | item death, measure count then cumulative | Number of deaths from the valuation date to the end of the period |
| 7 | `SCR_LPSR_MASS_EOP` | item solvency capital requirement, kinds lapse risk then mass, time end of period | Solvency capital requirement for the mass shock for lapse risk at the end of the period |
| 8 | `PROF_SH_EV_PV_AFT_TAX` | item profit, party shareholder, basis embedded value, measure present value, order after tax | Present value at the valuation date of future shareholder profits after tax, on the embedded value basis |
| 9 | `SAR_NET_BOP` | item sum at risk, party net, time start of period | Sum at risk net of reinsurance at the start of the period |
| 10 | `PREM_WAIV_ACC` | item premium, kind waiver, measure accumulated, time end of period | Waived premiums to date, accumulated with interest to the end of the period |

## Part C. Descriptions that cannot be named yet

The rule: when a description is ambiguous, the user must be explicit. The standard never guesses.

### C1. "The lapse rate"

One word has two meanings. Does "lapse" mean lapse in the strict sense (the policy ends through non-payment and nothing is paid), or does it include surrenders? If both are meant, the term is discontinuance.

Once the user answers, the name follows: `LPS_RATE` or `DCON_RATE`.

Whether the rate is dependent or independent, and whether it is annual or monthly, is written only if the user says it. Two fuller descriptions give `LPS_INDP_RATE_ANN` and `DCON_DEP_RATE_MTH`.

### C2. "Gross premium"

"Gross" has two meanings. It can mean before reinsurance, or it can mean the full premium charged to the policyholder including loadings.

- If it means before reinsurance, the name is `PREM`, because gross of reinsurance is implied.
- If it means the premium charged including loadings, the name is `PREM_OFF`.

The user must say which. "Net premium" has the same problem and resolves to `PREM_NET` only when net of reinsurance is meant.

### C3. "Withdrawals"

The user must say what is counted and what happens to the policy.

- Payments where part of the fund is taken and the policy continues: `CLM_WDL`.
- Payments where the policy ends and a value is paid: `CLM_SUR`.
- The number of policies ending by lapse or surrender together: `DCON_CNT`.
- A withdrawal rate also needs to say whether it is a rate of policies making a withdrawal or the proportion of fund value withdrawn. The second is a ratio: `CLM_WDL_PER_FV`.

### C4. "The reserve"

The user must say which reserve is meant. The basis and the time point are written only if the description gives them.

- A reserve on the prudent basis at the end of the period: `RES_PRU_EOP`.
- The best estimate liability at the start of the period: `BEL_BOP`.
- The unit reserve only: `RES_UNIT_EOP`.

### C5. "Number of deaths" on joint life or family business

The user must say whether lives or policies are counted. A death of one life may or may not end the policy.

- Number of policies that end by death: `DTH_CNT`.
- Number of lives that die: `LIFE_DTH_CNT`.

### C6. "The discount rate"

"The discount rate" on its own gives `DISC_RATE`. A model that holds more than one must say how they differ: spot or forward, the time base, and the basis.

- `DISC_FWD_RATE_ANN` is the annual forward rate on the basis of the run.
- `DISC_SPOT_IFL_RATE_ANN` is the annual spot rate locked in under IFRS 17.
- A discount factor is a different variable again: `DISC_FAC_EOP`.

### C7. "Disability claims"

The user must say whether lump sum or income benefits are meant, or both, and whether waiver of premium is included.

- All disability claims together: `CLM_DIS`.
- Income benefits only: `CLM_DIS_INCM`.
- Premiums waived while disabled are a separate claim: `CLM_WAIV`.

### C8. "Period in years"

The user must say which period.

- Time since the valuation date: `TIME_YRS`.
- Time since the policy started, at the start of the period: `DUR_YRS_BOP`.
- The full length of the policy: `TERM_YRS`.

### C9. "New business margin"

A margin is a ratio, and the user must say of what to what.

- Value of new business to annual premium equivalent: `VNB_PER_APE`.
- Value of new business to the present value of new business premiums: `VNB_PER_PVNBP`.

The word margin alone means the margin for prudence in an assumption, which is a different thing.
