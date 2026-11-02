# UC Clarity Prototype: Build Specification for a Coding Agent

> Give this file to Claude Code, Codex or any coding agent.
> Claude Code: `claude "Read UC_Clarity_Prototype_Build_Spec.md, build the entire project exactly as specified, run the tests, start the app and report."`
> Codex: `codex "Read UC_Clarity_Prototype_Build_Spec.md, build the entire project exactly as specified, run the tests, start the app and report."`
> Or save it as `CLAUDE.md` / `AGENTS.md` in an empty folder and say "build it".

---

## 0. Instructions to the agent

1. Read this whole file before writing code. It is the single source of truth.
2. Build the full project in the current folder. Do not ask questions unless you are truly blocked. Where this spec is silent, choose a sensible default and note it in `DECISIONS.md`.
3. Install dependencies, run the unit tests, run the production build, start the dev server, and (if a headless browser is available) run the end-to-end smoke test in Section 17. Fix anything that fails.
4. Finish by printing: the URL, the commands to run it, the test results, and a short list of anything you could not verify.
5. Keep UI copy plain and short. No em dashes anywhere in UI text or docs.

## 1. What this is

An academic prototype for the course Business in Digital Age (SPJIMR Mumbai, PGDM 2026-28), Case 12: "Should Urban Company Turn Its Gig Workforce Into a Sales Force?". The team's solution is a new layer inside the existing Urban Company app, called **UC Clarity** (a fictional name). The prototype must show the whole idea working in a browser. The professor wants the team to learn vibe coding for summer internships, so the code should be clean, readable and easy to modify.

### The idea in one paragraph
When a customer books an appliance repair (AC, refrigerator, washing machine, geyser, water purifier), they answer a short appliance-specific diagnostic survey. The service professional visits and records technical readings and photos the customer cannot give. A transparent scoring engine decides whether repair or replacing is more viable. Before work starts, customer and professional see the same neutral comparison: repair cost versus a new product with a partner-bank no-cost EMI and a trade-in credit. The professional is a service professional first; they may opt in to a referral role and earn a percentage of sale value on completed sales. If the customer does not buy, they are offered a 2-minute optional survey about other appliances at home in return for a discount on the service just done. All data is collected with purpose-specific consent and can be deleted with one click. The bank is the lender; Urban Company is only the UI/UX layer and lending service provider. Urban Company also has an operations dashboard (hot regions, allocation, nudges, trust and consent monitors, unit economics) and the bank has its own dashboard.

## 2. Hard rules (non-negotiable)

- **Fictional names:** the layer is "UC Clarity"; the lender is "Aarambh Bank"; the refurbisher is "ReNew Partner". Urban Company and its Native product line are real in the case and may be named. Do not use any real bank, NBFC or fintech name.
- **Simulated everything:** no backend, no real API calls, no real payments or identity checks. All data is synthetic and generated in code with a seeded random generator. Show a small persistent label "Prototype: simulated data" on every screen.
- **Illustrative numbers:** any price, repair cost, trade-in value or rate that is not in Section 8 is a placeholder; label it "illustrative" wherever it appears in the UI. Never present invented numbers as real market data.
- **Guardrails are features** (Section 14). Build them exactly. They are also unit-tested.
- **Mobile-first for customer and professional:** shown inside a phone frame (390 x 844) centered on the page, operated with mouse clicks instead of touch. Bank and Urban Company views are desktop dashboards.
- **Shared state:** an action in one view must be visible in the others without reloading (Section 4).

## 3. Tech stack

- Node 20+, Vite, React 18, TypeScript (strict), Tailwind CSS, Zustand (shared store, `persist` to localStorage with a "Reset demo" button), Recharts (charts), lucide-react (icons), Vitest + React Testing Library (unit tests), Playwright (optional smoke test).
- No router needed. Use a top-level role switcher.
- Folder structure:

```
uc-clarity/
  package.json, vite.config.ts, tailwind.config.js, tsconfig.json, index.html
  README.md, DECISIONS.md
  src/
    main.tsx, App.tsx
    config/assumptions.ts        // all tunable constants (Section 8, 12)
    config/appliances.ts         // forms per appliance (Section 6)
    domain/types.ts              // Section 5
    domain/scoring.ts            // Section 7
    domain/comparison.ts         // EMI, trade-in, energy note (Section 8)
    domain/allocation.ts         // Section 11
    domain/bank.ts               // Section 9
    domain/nudges.ts             // Section 12
    domain/economics.ts          // unit economics (Section 12)
    domain/consent.ts            // consent ledger, deletion (Section 10)
    data/seed.ts                 // seeded synthetic data (Section 13)
    store/useStore.ts            // Zustand store and actions
    components/                  // PhoneFrame, ComparisonScreen, ConsentToggles, etc.
    views/customer/*, views/professional/*, views/bank/*, views/ops/*
    tests/*.test.ts(x)
  e2e/smoke.spec.ts
```

## 4. App shell and shared state

- Top bar: product name "UC Clarity (prototype)", role tabs **Customer | Professional | Bank | UC Operations | Split view**, a **Demo guide** button (opens the script in Section 16), a **Simulation panel** button, and **Reset demo**.
- **Split view** shows the customer phone and the professional phone side by side so the audience sees both screens change together.
- **Simulation panel:** simulated date (date picker, default 15 Mar 2026-style "today" set in config), simulated outside temperature slider (20 to 48 C) per selected city, and a city selector (Delhi, Mumbai, Pune, Kolkata, Bengaluru). These drive nudges and the heat overlay.
- One Zustand store holds all entities. Every action appends to an **event log** (id, time, actor, type, payload) which the Ops dashboard reads. Persist the store; Reset restores the seed.

## 5. Domain types (src/domain/types.ts)

Define at least these types (add fields as needed):

```ts
type ApplianceType = 'AC' | 'FRIDGE' | 'WASHER' | 'GEYSER' | 'PURIFIER';
type City = 'Delhi' | 'Mumbai' | 'Pune' | 'Kolkata' | 'Bengaluru';
type ConsentPurpose = 'DIAGNOSTICS' | 'MARKETING' | 'CREDIT_ASSESSMENT' | 'BANK_SHARING';

interface Customer { id; name; phone; city; zoneId; hasCreditHistory: boolean; bureauScore?: number;
  monthlyIncomeHint?: number; consents: ConsentRecord[]; appliances: OwnedAppliance[]; deleted?: boolean; }
interface OwnedAppliance { id; type: ApplianceType; brand; ageYears: number; notes?: string; }
interface ConsentRecord { id; customerId; purpose: ConsentPurpose; granted: boolean; noticeVersion: string; at: string; }

interface Professional { id; name; city; zoneId; skills: ApplianceType[]; rating: number; salesModuleOptIn: boolean;
  trainingCompleted: boolean; serviceEarnings: number; referralEarnings: number; online: boolean; }

interface ServiceRequest { id; customerId; applianceType; brand; ageYears; customerAnswers: Record<string, string|boolean|number>;
  proReadings?: Record<string, string|boolean|number>; photos: Photo[]; professionalId?: string;
  status: 'BOOKED'|'ASSIGNED'|'INSPECTED'|'COMPARISON_SHOWN'|'REPAIR_CHOSEN'|'REPLACE_CHOSEN'|'COMPLETED'|'CANCELLED';
  recommendation?: Recommendation; choice?: 'REPAIR'|'REPLACE'|'DEFER'; serviceFee: number; createdAt: string;
  exitSurvey?: ExitSurvey; discountApplied?: number; }

interface Recommendation { score: number; lean: 'REPAIR'|'BOTH_LEAN_REPAIR'|'BOTH_LEAN_REPLACE'|'REPLACE'; reasons: string[];
  repairCost: number; newPrice: number; expectedRemainingLifeYears: number; }
interface Photo { id; name; dataUrl?; grade?: 1|2|3|4|5; }
interface LoanApplication { id; requestId; customerId; productId; principal; tenorMonths; tradeInCredit; path: 'BUREAU'|'AA';
  aaSummary?: AASummary; decision: 'PENDING'|'APPROVED'|'REJECTED'|'MANUAL_REVIEW'; reasons: string[]; kfsAcknowledgedAt?: string;
  status: 'SUBMITTED'|'DECIDED'|'DISBURSED'|'COOLING_OFF'|'CLOSED'; }
interface ExitSurvey { id; completedAt; items: { type: ApplianceType; ageBand: string; issue: string }[]; discountAmount: number; }
interface Nudge { id; customerId; ruleId; title; body; sentAt; opened?: boolean; holdout?: boolean; }
```

## 6. Appliance forms (src/config/appliances.ts)

Each appliance has a **customer form** (asked at booking, each question has a "Why we ask" text) and a **professional form** (inspection). Field types: select, boolean, number, text.

### AC
- Customer: brand (select), age in years (number), tonnage (select 1, 1.5, 2), inverter (boolean), star rating (select 1 to 5), coil material copper (boolean, "Not sure" allowed), suspected gas leak (boolean/not sure), cooling issue (select: not cooling, weak cooling, normal), noise (boolean), water leakage (boolean), daily usage hours (number), last service (select: under 6 months, 6 to 12, over 12, never).
- Professional: temperature differential across the indoor coil in C (number; below 8 weak, 8 to 14 normal), compressor current draw status (select: normal, high, very high), refrigerant leak check (select: none, minor, major), error code (text), outdoor unit condition (select: good, corroded, damaged), supply voltage stability (select: stable, fluctuating), coastal or dusty setting (boolean), faults repeated in last 12 months (number), likely fault (select: fan motor, capacitor, gas refill, PCB, compressor, other), photo count (at least 2 required).
### Refrigerator
- Customer: brand, age, type (single door, double door frost-free, side by side), symptom (not cooling, noise, ice build-up, leakage, other), door seal loose (boolean).
- Professional: compressor status (normal, weak, failed), thermostat reading ok (boolean), fridge compartment temperature in C (number), gas leak check (none, minor, major), evaporator condition (good, iced, damaged), repeated faults (number), likely fault (select), photos (at least 2).
### Washing machine
- Customer: brand, age, type (top load, front load), symptom (not spinning, not draining, vibration, noise, error code, other), error code (text), hard water (boolean).
- Professional: motor and bearing condition (good, worn, failed), drain pump (ok, weak, failed), control board (ok, faulty), drum wear (low, medium, high), repeated faults, likely fault, photos.
### Geyser
- Customer: brand, age, type (storage, instant), capacity litres (select 6, 10, 15, 25), symptom (not heating, leakage, tripping, noise), hard water (boolean).
- Professional: heating element (ok, failed), thermostat (ok, failed), tank corrosion (none, moderate, severe), earthing safe (boolean), safety valve (ok, faulty), repeated faults, likely fault, photos.
### Water purifier
- Customer: brand, age, type (RO, UV, RO+UV), source water (municipal, borewell, tanker), symptom (low flow, bad taste, leakage, not starting), last filter change (under 6 months, 6 to 12, over 12).
- Professional: input TDS and output TDS (numbers), membrane condition (good, worn, failed), pump (ok, weak, failed), flow rate ok (boolean), repeated faults, likely fault, photos.

Each appliance also needs a **fault catalogue**: fault name, illustrative repair cost, parts availability (boolean). Use the numbers in Section 8.

## 7. Scoring engine v1 (src/domain/scoring.ts)

Rule-based, deterministic, explainable. Output is a `Recommendation` with a numeric **replace-lean score from 0 to 100** and plain-language reasons. No ML library is needed in version 1. Put a clearly labelled `// FUTURE: learning model trained on outcome data` stub and an `outcomes` array in the store so a model can be added later. If a demo "ML" panel is wanted in the Ops view, train nothing; show the rule contributions as a bar chart (each rule's points) and label it "Rule-based v1 (synthetic data)".

### Inputs
age (years), expected life (Section 8), repair cost (from the fault catalogue for the professional's "likely fault"), new price, repeat faults in last 12 months, parts available (from catalogue), AC efficiency flags (inverter, star rating), average photo condition grade (1 to 5, from simulated vision).

### Points
- **Age points** = clamp(age / expectedLife * 40, 0, 40)
- **Repair ratio points** = clamp((repairCost / newPrice) / 0.5 * 30, 0, 30)  (the 50% rule gives the full 30)
- **Repeat fault points** = min(repeatFaults * 8, 16)
- **Efficiency points** (AC only) = 8 if not inverter OR star rating is 3 or below, else 0
- **Condition points** = 6 if average photo grade is 2 or below, else 0
- **Parts points** = 10 if the part is not readily available, else 0
- score = clamp(sum, 0, 100), rounded to one decimal

### Hard rules (applied after the score)
- AC with age >= 15, or any appliance with age >= 1.25 * expectedLife: lean = `REPLACE`.
- age <= 5 and repair ratio < 0.4: lean = `REPAIR`.

### Lean from score
- < 25: `REPAIR`; 25 to 49.9: `BOTH_LEAN_REPAIR`; 50 to 69.9: `BOTH_LEAN_REPLACE`; >= 70: `REPLACE`.
- **Both options are always shown to the customer regardless of lean** (guardrail G2).

### Reasons
Generate 2 to 5 plain sentences from the largest contributors, e.g. "This AC is 12 years old, close to the typical life of 12 years (assumed)." or "The repair costs 16.5% of a new unit, well under the 50% rule." Never use persuasive or urgent wording.

### Required test cases (Vitest)
Using AC, new price 48,500:
1. 3-year-old, likely fault fan motor (repair 1,800), inverter 5-star: score about 12.2, lean `REPAIR`.
2. 6-year-old, compressor (8,000), inverter 5-star: score about 29.9, lean `BOTH_LEAN_REPAIR`.
3. 12-year-old, compressor (8,000), non-inverter 3-star: score about 57.9, lean `BOTH_LEAN_REPLACE`.
4. 16-year-old, any major fault: lean `REPLACE` (hard rule).
5. Compressor-only fault never gives lean `REPLACE` unless age >= 15 or other points push the score to 70 or more.

## 8. Numbers and comparison math (src/config/assumptions.ts, src/domain/comparison.ts)

Every constant lives in `assumptions.ts` with a comment saying whether it is **sourced** (from the team's research) or **illustrative** (placeholder). Show "illustrative" next to any illustrative figure in the UI.

```ts
export const EXPECTED_LIFE = { AC: 12, FRIDGE: 13, WASHER: 10, GEYSER: 8, PURIFIER: 8 }; // illustrative
export const NEW_PRICE = { AC: 48500 /* sourced midpoint of Rs 42,000-55,000 */, FRIDGE: 28000, WASHER: 32000, GEYSER: 9000, PURIFIER: 18999 }; // others illustrative
export const NATIVE_PURIFIERS = [{name:'Native M0', price:11999 /*sourced*/},{name:'Native M1', price:14999},{name:'Native M2', price:18999},{name:'Native M3', price:25199 /*sourced*/}];
export const FAULTS = {
  AC: { 'Fan motor':1800 /* sourced range 1,200-2,500 */, 'Capacitor':1200, 'Gas refill':2500, 'PCB':4500, 'Compressor':8000 /* sourced */, 'Other':2000 },
  FRIDGE: { 'Compressor':7500, 'Thermostat':1200, 'Gas refill':2800, 'Evaporator':4000, 'Other':1500 },
  WASHER: { 'Motor':4500, 'Drain pump':1800, 'PCB':5000, 'Bearing':3500, 'Other':1500 },
  GEYSER: { 'Heating element':1200, 'Thermostat':800, 'Tank':4500, 'Other':900 },
  PURIFIER: { 'Membrane':2200, 'Pump':1800, 'PCB':1500, 'Other':1000 }
}; // all illustrative unless marked
export const PARTS_UNAVAILABLE = { AC: ['PCB'], FRIDGE: [], WASHER: ['PCB'], GEYSER: [], PURIFIER: [] }; // illustrative
export const TRADE_IN_BASE = { 1:500, 2:1000, 3:2000, 4:3000, 5:4500 }; // illustrative, AC reference
export const TRADE_IN_FACTOR = { AC:1, FRIDGE:0.8, WASHER:0.7, GEYSER:0.4, PURIFIER:0.3 };
export const EMI_TENORS = [3,6,9,12];
export const INCENTIVE_PCT = 0.03;     // assumed, range 2-4%
export const UC_MARGIN_PCT = 0.10;     // assumed, range 8-12%
export const SUBVENTION_PCT = 0.04;    // assumed
export const CONVERSION_PCT = 0.05;    // assumed, range 3-8%
export const SURVEY_DISCOUNT_PCT = 0.10; // of the service fee just paid, assumed
export const EXIT_SURVEY_TARGET_CONSENT = 0.40; // assumed
export const BUYER_FIRST_SERVICE_DISCOUNT_PCT = 0.15; // illustrative
export const NUDGE_MAX_PER_WEEK = 2;
export const COOLING_OFF_DAYS = 1; // illustrative, to be confirmed with the lender
```

### Comparison screen (one shared component used by customer AND professional)
Two cards of **equal size and styling** side by side (stacked on phone), no red or green emphasis, no "best choice" badge, no countdown, no pre-selected option:
- **Repair:** repair cost, expected remaining life (max(1, expectedLife - age) years, "estimate"), what is fixed, warranty on repair (illustrative 90 days).
- **Buy new:** product name and price, trade-in credit (grade-based, "simulated grading"), net price, a tenor selector (3, 6, 9, 12 months) with monthly amount = round((price - tradeInCredit) / tenor) and the line "Interest charged to you: Rs 0. Total you pay: Rs X". A small honest note: "The interest cost is covered by Urban Company and the brand."
- For AC only: "A newer 5-star inverter model can save about Rs 4,000 to 6,000 a year in electricity in high-usage homes (indicative). Over the price of a new unit this offsets part of the cost, not all of it." Never claim a payback period.
- Below the cards: "Why we suggest this" showing the score reasons (Section 7). Show the lean as a sentence ("Based on age and repair cost, repair looks more economical") not as a button highlight.
- Buttons: "Repair now", "Buy new with no-cost EMI", "Decide later". All three equal weight.
- A "How this was calculated" expandable section lists each rule and its points.
- The professional sees the identical component plus a note "You see what the customer sees". The professional can not change numbers.

## 9. Bank view and lending logic (src/domain/bank.ts, views/bank/*)

Lender is **Aarambh Bank** (fictional). UC is the UI/UX layer and lending service provider only. State this on the KFS and on the bank dashboard header.

### Application flow (customer side)
1. Customer picks "Buy new with no-cost EMI" and a tenor.
2. If `hasCreditHistory`: path `BUREAU` with `bureauScore` (300 to 900). Else path `AA`.
3. For `AA`: show a simulated **Account Aggregator consent screen**: what data (6 months of bank account statements including UPI credits and debits), purpose (assess affordability for this loan only), who sees it (Aarambh Bank only), how long (until decision, then per bank policy), withdraw anytime. Requires the `CREDIT_ASSESSMENT` and `BANK_SHARING` consents, both default OFF. If declined, offer "Pay in full / choose repair" and do not pressure.
4. **KFS screen** (Key Fact Statement): lender, principal, tenor, EMI, APR 0.0% (no-cost EMI), processing fee Rs 0 (illustrative), total payable, cooling-off period (COOLING_OFF_DAYS, "illustrative"), grievance contact (fictional), data shared. A **checkbox that is NOT pre-ticked** must be ticked to submit. Record `kfsAcknowledgedAt`.
5. Decision shown instantly with reasons.

### Decision rules
- Bureau path: score >= 720 approve; 650 to 719 approve only if AA data is also shared, else `MANUAL_REVIEW`; < 650 reject with reason.
- AA path: generate synthetic 6-month statement summary per customer from the seed (average monthly credits, average monthly fixed obligations, volatility). FOIR = (obligations + new EMI) / average monthly credits. FOIR <= 0.50 approve; 0.50 to 0.65 offer a longer tenor (12 months) or `MANUAL_REVIEW`; > 0.65 reject with plain reason. Show FOIR to the bank only.
- Always show the customer a plain reason; never use phone data, contacts or media in any rule (guardrail G8).
- On approval: disbursement record "Disbursed by Aarambh Bank directly to the seller account (lender to beneficiary). No Urban Company pool account." Application status moves to `COOLING_OFF` for COOLING_OFF_DAYS (simulate with a button "Advance a day").

### Bank dashboard (desktop)
Header: "Aarambh Bank | Lender view | Urban Company is the service provider". Tabs:
- **Application queue:** table with applicant (name masked after deletion), product, principal, tenor, path, consent status (credit, sharing), decision, status; filters.
- **Underwriting drawer:** bureau score or AA summary with a small chart of monthly credits versus obligations, FOIR calculation, decision, reasons, and manual approve/reject with a mandatory reason field.
- **Disbursement and KFS log:** KFS acknowledged time, disbursement record, cooling-off status.
- **Portfolio:** approvals vs rejections, thin-file vs bureau mix, tenor mix, synthetic early-delinquency rate chart, average ticket.
- **Grievances and cooling-off:** list of cooling-off exits (simulate a "Exit loan in cooling-off" action from the customer app) and grievance tickets (customer can raise one from the loan screen).
Seed 25 historical applications so charts are populated.

## 10. Consent, privacy and deletion (src/domain/consent.ts)

- Four separate consents: `DIAGNOSTICS`, `MARKETING`, `CREDIT_ASSESSMENT`, `BANK_SHARING`. **All default OFF.** Never bundle. Never pre-tick.
- Booking never depends on the diagnostic survey or any consent: show a visible "Skip questions and just book" option. Without `DIAGNOSTICS` consent, the answers are not stored for analytics and the comparison uses only professional readings.
- Every survey question shows a "Why we ask" tooltip or line.
- Each consent change appends a ledger record (purpose, granted, noticeVersion "v1", timestamp). The Ops **Consent monitor** reads this ledger.
- **Consent centre (customer app):** toggles per purpose, a "What we hold about you" list (profile, appliances, answers, photos, survey, nudges), "Download my data" (JSON file), and a red **Delete my data** one-click action with a confirm sheet that says exactly what will be deleted and what must be retained (loan and KFS records required by law, shown as "retained for legal reasons"). After deletion: personal fields are erased, names show as "Deleted user" in all dashboards, nudges stop, and a deletion request record with completion time is created for the Consent monitor.
- Withdrawing `MARKETING` stops nudges immediately. Withdrawing `BANK_SHARING` blocks new loan applications until re-granted.

## 11. Allocation engine (src/domain/allocation.ts)

Purpose: assign professionals to jobs and suggest repositioning so service demand is met, without hurting the core service business.

### Job assignment score for professional p and job j
```
S = 0.35*(1 - travelTimeNorm) + 0.25*skillMatch + 0.20*ratingNorm + 0.20*slaFit
```
- travelTimeNorm = min(travelMinutes / 45, 1), where travelMinutes is a function of zone distance from the seeded zone graph.
- skillMatch = 1 if p.skills includes the job's appliance else 0 (exclude if 0).
- ratingNorm = (rating - 3.5) / 1.5, clamped 0 to 1.
- slaFit = 1 if p can arrive within the promised slot, else 0.5, else 0.
- **Conversion rate and sales are NOT inputs.** Expose `ALLOCATION_WEIGHTS` and a unit test asserting there is no conversion weight. The Ops view shows a badge "Conversion weight in allocation: 0 (guardrail)".

### Repositioning suggestions (idle professionals only)
For each city, forecast zone demand for the next day by appliance (seeded history, scaled by the simulated temperature for AC). Suggest moving idle professionals (max 25 minutes extra travel, never below the zone's minimum service coverage) to zones whose forecast demand exceeds coverage. Show it as **suggestions with reasons** on the Ops map, with "Apply suggestion" buttons. Professionals see "Demand is high in Wakad tomorrow" as information, never as an instruction.

## 12. Nudges and unit economics (src/domain/nudges.ts, economics.ts)

### Nudge rules (all gated by `MARKETING` consent, frequency cap NUDGE_MAX_PER_WEEK, and not deleted)
1. **Pre-summer:** simulated month is Feb, Mar or Apr, and the customer owns an AC aged >= 8 years OR had a past AC fault: "Summer is almost here. Is your AC ready? Book a check or see replacement offers with no-cost EMI."
2. **Heatwave:** simulated temperature in the customer's city >= 40 C and the customer owns an AC: "It is {temp} C out there. Quick AC check slots are open today."
3. **Festive / New Year:** simulated date between 20 Dec and 5 Jan, owns a fridge or washer aged >= 8: "Party season! Keep the drinks chilled. See refrigerator offers."
4. **Post-warranty AMC:** owns a Native product past warranty: "Your Native warranty has ended. Keep it running with an AMC at Rs 5,000 a year." (price sourced for purifiers)
5. **Declined-to-buy reminder:** one reminder only, 7 simulated days after a declined comparison, with updated EMI or trade-in text.
- Tone: friendly and a little quirky, never urgent or guilt-based (no countdowns, no "last chance").
- A **holdout** setting (default 10%) excludes a random share of eligible customers to measure uplift. The Campaign console shows eligible, sent, holdout, opened (simulated), and conversions.
- Customers see nudges in a Notifications tab and can change preferences; the app states the weekly cap.

### Unit economics module (Ops view, "Economics")
Inputs with sliders and number boxes: eligible visits (default 1,000), conversion (3 to 8%, default 5), average ticket (default 48,500), UC margin (default 10%), incentive (2 to 4%, default 3%), subvention (default 4%), toggle "Brand funds the subvention". Outputs: sales count, sales value, UC margin, incentive, subvention cost, net contribution. **Defaults must reproduce this table** (Rs, Indian number formatting) and a test must assert it:

| Conversion | Sales | Sales value | Margin 10% | Incentive 3% | Net (UC bears 4%) | Net (brand funds) |
|---|---|---|---|---|---|---|
| 3% | 30 | 14,55,000 | 1,45,500 | 43,650 | 43,650 | 1,01,850 |
| 5% | 50 | 24,25,000 | 2,42,500 | 72,750 | 72,750 | 1,69,750 |
| 8% | 80 | 38,80,000 | 3,88,000 | 1,16,400 | 1,16,400 | 2,71,600 |

Add the note: "Excludes build cost, bank referral fee, AMC revenue, survey discounts and training cost. Illustrative, not a forecast."

## 13. Seed data (src/data/seed.ts)

Use a seeded generator (mulberry32 with a fixed seed) so every reset gives identical data. Label all of it synthetic.

- **Cities and zones (demand heat is synthetic):**
  - Mumbai: Andheri, Bandra, Powai, Thane, Navi Mumbai, Borivali
  - Delhi: Dwarka, Rohini, Saket, Lajpat Nagar, Noida, Gurugram
  - Pune: Kothrud, Wakad, Hinjewadi, Hadapsar, Baner
  - Kolkata: Salt Lake, New Town, Howrah, Behala, Dum Dum
  - Bengaluru: Whitefield, Koramangala, HSR Layout, Indiranagar, Electronic City
  Give each zone a position on a simple schematic grid, adjacency/travel minutes between zones of the same city, and per-appliance demand history for 90 days (AC demand rises with the simulated temperature).
- **Customers:** 40 (about 10 thin-file with `hasCreditHistory: false`), each with 1 to 4 owned appliances with ages 1 to 16 years and some past faults. Synthetic 6-month bank summary for each (average monthly credits Rs 18,000 to 90,000; obligations Rs 0 to 25,000; some volatile).
- **Professionals:** 30 across the five cities, skills 1 to 3 appliance types, ratings 3.8 to 4.9, about 30% opted in to the sales module with training completed. Service earnings and referral earnings histories for the comparison chart.
- **History:** 150 completed service requests with outcomes (repair, replace, defer), 25 loan applications with decisions, 10 trade-ins, 20 deletion/consent events, 40 nudges.
- **Demo personas (always present):**
  - Customer **Riya Mehta**, Mumbai (Andheri), bureau score 742, owns a 12-year-old non-inverter 3-star 1.5-ton AC with a failing compressor. Marketing consent OFF initially.
  - Customer **Arjun Verma**, Pune (Wakad), thin-file (no credit history), owns a 9-year-old double-door refrigerator and a 7-year-old washing machine; seed his synthetic AA summary so that buying a new refrigerator (Rs 28,000 less trade-in credit) over 9 months gives FOIR between 0.40 and 0.45 and an approval.
  - Professional **Imran Sheikh**, Mumbai, AC and refrigerator, rating 4.7, opted in and trained.
  - Professional **Sanjay Patil**, Pune, washer and geyser, rating 4.5, not opted in.

## 14. Guardrails as testable rules

| ID | Rule | How to test |
|---|---|---|
| G1 | Comparison cards have equal size, styling and prominence; no option is pre-selected or highlighted | component test checks both cards share the same class set and no selected state on load |
| G2 | Repair option and cost are always shown, whatever the lean | test all four lean outcomes render the repair card |
| G3 | Sales role is opt-in; fee is a percentage of completed sales; no targets, quotas, rankings that affect jobs, or penalties; opt-out any time | store test: opting out does not change job assignment or earnings history |
| G4 | A professional's repair-job pay is identical whether the customer repairs or buys; diagnoses are audited | unit test on earnings; Ops "Trust monitor" shows audit sample |
| G5 | Conversion is not an allocation input | `ALLOCATION_WEIGHTS` has no conversion key; test |
| G6 | No false urgency, countdown timers, pre-ticked boxes or forced actions anywhere | grep/lint test for "countdown" patterns and `defaultChecked` on consent/KFS inputs |
| G7 | Four separate, revocable consents, all default OFF; booking never depends on them | test defaults and that booking works with all OFF |
| G8 | No phone data, contacts or media used in credit decisions; only consented AA data | `bank.ts` takes no such inputs; test signature |

## 15. Screens

### Customer app (inside the phone frame)
1. **Home:** greeting, service tiles (AC, Refrigerator, Washing machine, Geyser, Water purifier), "UC Native marketplace" tile, notifications bell, consent centre link, my appliances.
2. **Book a repair:** choose appliance, then the diagnostic survey (one or two questions per screen, progress bar, "Why we ask" on each, "Skip questions and just book" always visible), then the consent toggles (all OFF, plain language, one line per purpose), then slot selection and confirmation showing the service fee (illustrative, e.g. Rs 499 for AC).
3. **Visit tracker:** assigned professional (name, rating), ETA, status. Updates live when the professional acts.
4. **Comparison screen** (Section 8) appears when the professional submits the inspection.
5. **EMI flow:** tenor, AA consent (if thin-file), KFS screen with the un-ticked acknowledgement, decision, disbursement note, cooling-off with an "Exit loan in cooling-off" action, grievance link.
6. **Trade-in:** shows photos used, simulated grade, credit, pickup request to "ReNew Partner" (simulated pickup tracker).
7. **Service complete:** rating, and for customers who did not buy, the **exit survey offer** showing the discount first ("Answer 2 minutes of questions about your other appliances and get 10% off today's service (Rs X)"), clearly optional. Survey asks for each other appliance: type, rough age band (0-2, 3-5, 6-9, 10-14, 15+ years), any issue. Applying the discount updates the service fee.
8. **Buyer benefit:** after a purchase via the in-visit recommendation, show "15% off your first post-warranty repair visit (illustrative)".
9. **Native marketplace:** product grid (Native purifiers and AC, plus partner-brand fridge, washer, geyser) with price, offers and "Buy with no-cost EMI" using the same EMI flow. No "only 2 left" or timers. Sponsored placements, if any, are labelled "Sponsored".
10. **Notifications:** nudges from the Campaign console, preference toggles, cap notice.
11. **Consent centre:** Section 10.

### Professional app (inside the phone frame)
1. **Login persona picker**, then **Jobs:** today's jobs with appliance, zone, slot, status.
2. **Job detail:** customer answers (only if DIAGNOSTICS consent given), appliance info, status buttons (Start, Reached).
3. **Inspection form:** the appliance-specific professional form, mandatory photos (upload or "Use sample photo"), a simulated condition grade after upload, then "Submit inspection" which runs the scoring engine and pushes the comparison to the customer.
4. **Comparison view:** the same component the customer sees, read-only, with the "You see what the customer sees" note.
5. **Sales module:** if not opted in, a short training (3 questions on explaining the comparison neutrally, repair-always-shown, no pressure) then an "Opt in" button; "Opt out" is always available and shows "No penalty". If opted in: referral tracker listing sales with status (PENDING until delivery, PAID after), fee = INCENTIVE_PCT of sale value, with the rule text "You earn on completed sales made during this visit or before another professional visits the customer."
6. **Earnings:** service earnings, referral fees, a chart comparing opted-in and not opted-in professionals (anonymised), instant payout button (simulated).
7. **Money:** cards for tool and kit loan, accident and health cover, earnings advance, each with a simple apply modal and "provided by Aarambh Bank / a licensed insurer (fictional)".
8. **Demand info:** "Demand is high in {zone} tomorrow" information tiles (not instructions).

### Urban Company Operations dashboard (desktop)
Tabs:
1. **Overview funnel:** diagnostics started, diagnostics completed, comparisons shown, repair chosen, buy chosen, EMI applications, approvals, deliveries, trade-ins; filter by city and appliance.
2. **Hot regions:** pick a city; schematic zone map shaded by demand by appliance with a temperature overlay driven by the simulation panel; side panel with appliance-age profile of the zone (share of units older than 8 years) and repositioning suggestions (Section 11).
3. **Allocation:** live table of jobs and assigned professionals with the score breakdown; service-level metrics by zone (response time, fulfilment); the guardrail badge.
4. **Trust monitor:** ratings trend, complaints, audit sample of diagnoses (each shows score reasons and outcome), share of repair-vs-replace outcomes, "condemned then repaired elsewhere" flag (synthetic).
5. **Consent monitor:** consent rates by purpose, ledger table, deletion requests with time to complete, exit-survey consent rate versus the 40% target.
6. **Campaign console:** the five nudge rules with on/off, eligible count, holdout %, frequency cap, preview, "Send now" (delivers to the customer app), results table.
7. **Professional programme:** opt-in rate (target 30%), referral fees paid, earnings comparison (opted in vs not), opt-out reasons (synthetic), and **Sales-module cohort performance (informational only; not used for job allocation)**.
8. **Economics:** Section 12.

## 16. Demo guide (shown in the app and used by the smoke test)

1. Open **Customer** as Riya. Notice all consents are OFF. Book an AC repair, answer the survey (or skip it), keep consents OFF except `DIAGNOSTICS`, pick a slot.
2. Switch to **Professional** as Imran. Open the job, fill the AC inspection (12-year-old, compressor), add two photos, submit.
3. In **Split view** watch the same comparison appear for both. Lean is `BOTH_LEAN_REPLACE`; repair is still fully selectable.
4. Customer chooses **Buy new with no-cost EMI**, 9 months. Bureau path approves. Acknowledge the KFS (un-ticked by default).
5. Trade-in credit applied; pickup requested. Professional's referral tracker shows a PENDING fee of 3% of sale value; complete delivery and it becomes PAID.
6. Switch to **Bank:** the application appears with reasons; open the underwriting drawer; see the disbursement record and cooling-off status.
7. Switch to **Operations:** funnel updated; Consent monitor shows the ledger; Economics tab shows the default table.
8. **Thin-file path with Arjun** (Pune, no credit history): book a refrigerator repair (9-year-old double door), a Pune professional with refrigerator skill (seed one if none exists, since Sanjay covers washer and geyser) records a compressor fault and submits. Arjun sees the comparison and chooses **Buy new with no-cost EMI**, 9 months. Because he has no credit history the **Account Aggregator consent screen** appears: it lists what data is requested, the purpose, who sees it and how long. He turns on `CREDIT_ASSESSMENT` and `BANK_SHARING` (both start OFF), then sees the KFS (acknowledgement un-ticked by default) and submits. The bank dashboard shows the AA summary and FOIR between 0.40 and 0.45, and the application is approved with reasons. Also try the decline branch once: deny the AA consent and confirm Arjun is offered repair or pay in full with no pressure.
9. **Decline and exit survey with Arjun:** book a washing machine repair, Sanjay records a drive-motor fault, Arjun declines to buy, is offered the exit survey with a 10% discount shown first, completes it, and the discount is applied to the service fee.
10. In **Operations > Campaign console**, set simulated date to 10 March and temperature to 41 C in Mumbai, enable marketing consent for Riya, send the pre-summer and heatwave nudges, see them in her Notifications.
11. In Riya's **Consent centre** click **Delete my data**; see the retained-records note; confirm names show as "Deleted user" in Bank and Operations, and nudges stop.

## 17. Tests and verification

### Unit tests (Vitest), all must pass
- Scoring: the five cases in Section 7, plus a test that every score is between 0 and 100.
- Comparison: EMI for 48,500 over 12 months = 4,042 per month; 9 months = 5,389; 6 months = 8,083; with trade-in credit 3,000 over 12 months = 3,792.
- Economics: the table in Section 12 at the three conversion values.
- Allocation: weights sum to 1 and contain no conversion key.
- Bank: bureau and AA decision rules at the boundary values (720, 650, FOIR 0.50 and 0.65).
- Seed: Arjun's seeded AA path gives FOIR between 0.40 and 0.45 and an approval for the refrigerator at 9 months.
- Consent: defaults all OFF; withdrawal of MARKETING stops nudges; deletion erases personal fields but keeps loan and KFS records flagged "retained".
- Nudges: gating by consent, weekly cap, holdout, and each rule's trigger.
- Guardrails G1, G2, G6, G7 as component or static tests (Section 14).

### End-to-end smoke test (Playwright, optional if a browser can be installed)
Automate steps 1 to 6 and step 8 of the demo guide and assert: the comparison appears in both views, the cards have equal styling, the KFS checkbox starts un-ticked, the bank queue shows the new application, the referral fee is 3% of sale value, and for Arjun the AA consent screen appears, both consents start OFF, and the application is approved with FOIR between 0.40 and 0.45. If Playwright cannot run in the environment, say so in the final report and instead describe what you verified manually through the dev server.

## 18. Commands and README

`package.json` scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`. The README must include: what the project is, how to run it (`npm install`, `npm run dev`), how to run tests, the demo script, the list of constants in `assumptions.ts`, and a plain statement that all data is synthetic and the lender is fictional. `DECISIONS.md` lists every default you chose where this spec was silent.

## 19. Definition of done

- [ ] `npm install`, `npm run test`, `npm run build` all succeed; `npm run dev` serves the app and you print the URL.
- [ ] All four views work; Split view shows customer and professional together; state is shared and persists; Reset demo works.
- [ ] Every item in Sections 6 to 12 is implemented and every guardrail in Section 14 is enforced by a test.
- [ ] The demo guide's eleven steps work in order without errors.
- [ ] Every non-sourced number is labelled "illustrative" in the UI; the "Prototype: simulated data" label is on every screen.
- [ ] No real bank or fintech names; no em dashes in UI copy or docs.
- [ ] Final report lists what you verified and what you could not.

## 20. Requirement coverage (from the team's BRD)

| BRD requirement | Where it lives |
|---|---|
| FR1 diagnostic survey with reasons | Customer screen 2, Section 6 |
| FR2 separate revocable consents | Section 10, Customer screens 2 and 11 |
| FR3 neutral comparison | Section 8 |
| FR4 no-cost EMI flow with KFS | Section 9, Customer screen 5 |
| FR5 Account Aggregator consent | Section 9 |
| FR6 trade-in with photo estimate | Customer screen 6, Section 8 |
| FR7 optional exit survey with discount | Customer screen 7 |
| FR8 consent centre and one-click delete | Section 10 |
| FR9 Native marketplace | Customer screen 9 |
| FR10 notification preferences and caps | Customer screen 10, Section 12 |
| FR11 inspection forms with photos | Section 6, Professional screen 3 |
| FR12 same comparison for professional | Professional screen 4 |
| FR13 opt in or out without penalty | Professional screen 5 |
| FR14 short training before opt-in | Professional screen 5 |
| FR15 referral fee tracker | Professional screen 5 |
| FR16 audit feedback | Ops Trust monitor, Professional job history |
| FR17 financial products for professionals | Professional screen 7 |
| FR18 to FR21 bank dashboard | Section 9 |
| FR22 hot-region view | Ops tab 2 |
| FR23 allocation view with no conversion weight | Ops tab 3, Section 11 |
| FR24 funnel | Ops tab 1 |
| FR25 trust monitor | Ops tab 4 |
| FR26 consent monitor | Ops tab 5 |
| FR27 campaign console | Ops tab 6, Section 12 |
| FR28 professional programme view | Ops tab 7 |
| FR29 rule-based scorer with reasons | Section 7 |
| FR30 outcome capture for a later model | Section 7 (`outcomes` array, stub) |
| FR31 allocation without conversion weight | Section 11 |
| FR32 consent ledger and deletion service | Section 10 |

## 21. Out of scope

Real authentication, payments, maps, push notifications, real ML training, real bank or Account Aggregator integrations, server code, and any real customer data.
