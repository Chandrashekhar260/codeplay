# Srujana Tech Fest 2026 — Legal Services: Deep Analysis & Decision Framework

## Source Documents Integrated

| Document | Role in Analysis |
|---|---|
| `Problem Statements.pdf` | 6 Legal Services problem statements (LS-01 to LS-06) + 6 Finance (F-01 to F-06) |
| `Rules.md` | Event rules, judging criteria weights, deadlines, submission requirements, code of conduct |
| `Srujana_2026_Participant_Evaluation_Rubric.pdf` | Detailed rating scale (0–5), per-criterion preparation guidance, rules/expectations |

---

## Part 1: Event Context & Constraints

### Hackathon Parameters
| Parameter | Value | Implication for Problem Choice |
|---|---|---|
| Duration | 48 hours (Oct 24–26, 2026) | Scope must be completable end-to-end in 2 days |
| Team size | 2–4 members | Limited manpower; favor problems needing one coherent workflow over many features |
| Themes | Finance, Legal Services | We analyze Legal Services only |
| Problem statements | 6 per theme | Must choose exactly one official PS; no custom PS |
| Demo video deadline | 36 hours after start | Core workflow must be demo-ready by hour 36 |
| Complete project deadline | 48 hours after start | Full repo + docs + working demo by hour 48 |
| Progress evaluations | ~every 12 hours | Must keep project demonstrable throughout |
| Finalists | 10 per theme (20 total) | Shortlisted via demo video; final round = live presentation + Q&A |

### Judging Criteria (100 points, same for all teams)

| Criterion | Weight | Rating Scale (0–5) | Weighted Max Points |
|---|---|---|---|
| Problem understanding and relevance | 15 | 0–5 | 15 |
| Technical depth and implementation | 20 | 0–5 | 20 |
| Functional completeness and reliability | 15 | 0–5 | 15 |
| Domain analysis and correctness | 20 | 0–5 | 20 |
| Validation and robustness | 10 | 0–5 | 10 |
| User experience and accessibility | 10 | 0–5 | 10 |
| Originality and presentation | 10 | 0–5 | 10 |
| **Total** | **100** | | **100** |

**Scoring formula:** Weighted points = criterion weight × rating / 5.

### Key Rules Affecting Problem Selection
- AI tools permitted but must be disclosed; team must explain code/design/outputs.
- No pre-built projects; developed during hackathon.
- Synthetic/public/team-generated data OK; no private bank records or confidential client documents.
- Finance/legal prototypes must communicate assumptions and uncertainty; do NOT claim guaranteed financial outcomes or definitive legal authority.
- Technology choice alone earns no extra marks; appropriateness and effectiveness matter.
- Stating a real limitation does not automatically hurt; concealing failures undermines confidence.

---

## Part 2: Deep Re-Analysis of All 6 Legal Services Problem Statements

### LS-01: The Growth Trap (Compliance Triggered by Business Milestones)

**Core problem:** SMEs miss compliance obligations that silently activate at growth milestones (10th employee → ESI + POSH Internal Committee; 20 employees → EPF; turnover limits → GST/e-invoicing; new state → state registrations). Owners find out only via penalty notices.

**What the solution must do:**
- Watch for growth events (new hires, rising turnover, new locations, new product lines, first export order)
- Map each event → newly activated obligations
- State deadline to act and consequence of missing it

**Domain knowledge required:**
- ESI Act, EPF Act, POSH Act, GST Act, e-invoicing rules, state-specific Shops & Establishments / Professional Tax registrations
- Threshold logic: employee count thresholds, turnover thresholds, geographic triggers

**Hackathon feasibility (48 hrs):** HIGH. Rule-based engine with a threshold → obligation lookup table is deterministic and demo-able. No complex NLP needed if input is structured (user reports milestone).

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Clear user (SME owner), clear pain (penalty from missed compliance), clear scope |
| Technical depth | 20 | Moderate | Rule engine is straightforward; depth comes from obligation database completeness |
| Functional completeness | 15 | Strong | One coherent workflow: input milestone → get obligations + deadlines + penalties |
| Domain analysis | 20 | Strong | Legal thresholds are well-defined and verifiable |
| Validation | 10 | Moderate | Test boundary cases (exactly 10 employees, exactly turnover limit) |
| UX | 10 | Moderate | Simple form input + clear output table |
| Originality | 10 | Moderate | Compliance calendars exist; growth-trigger framing is somewhat novel |

**Estimated scoring potential:** 75–85/100 if scope is tight and domain rules are accurate.

---

### LS-02: What Changed and Does It Affect Me? (Regulatory Change Impact)

**Core problem:** Regulations arrive as unstructured text (gazettes, circulars, amendments, FAQs) — dozens/month across central + state. SMEs can't tell what changed, whether it applies to them, or what to do.

**What the solution must do:**
- Take a regulatory update (new version vs. old version)
- Answer: (1) What exactly changed? (2) Does it apply to this SME? (3) What to do differently, by when?

**Domain knowledge required:**
- Broad: any central/state regulation affecting SMEs (tax, labour, sector-specific)
- Legal interpretation: applicability tests based on SME profile (sector, size, location, turnover)

**Hackathon feasibility (48 hrs):** LOW–MEDIUM. Document diffing + semantic change detection + applicability classification is NLP-heavy. Doing this well for arbitrary regulations in 48 hours is hard. Risk of shallow demo.

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Very clear, well-articulated problem |
| Technical depth | 20 | High potential, high risk | NLP diffing is technically deep but hard to make reliable in 48 hrs |
| Functional completeness | 15 | Weak risk | End-to-end (upload regulation → get 3 answers) is complex to make reliable |
| Domain analysis | 20 | Weak | Applicability requires legal judgment; hard to encode correctly without domain expertise |
| Validation | 10 | Weak | Hard to validate against real regulatory changes without data |
| UX | 10 | Moderate | Upload + plain-language output is UX-friendly |
| Originality | 10 | Strong | Regulatory change impact for SMEs is underexplored |

**Estimated scoring potential:** 60–75/100. High upside if NLP works; high risk of partial delivery.

---

### LS-03: Paid on Time, by Law (Enforcing MSME Payment Rights)

**Core problem:** MSME suppliers face delayed payments. MSMED Act: 45-day max payment period, compound interest at 3× RBI bank rate, MSME Facilitation Council recourse, Section 43B(h) IT Act tax denial for buyers. Suppliers don't use rights due to calculation complexity, missing documentation, fear of losing customer.

**What the solution must do:**
- Help supplier understand, quantify, enforce payment rights
- Preserve business relationship

**Domain knowledge required:**
- MSMED Act (45 days, 3× RBI rate compound interest, Facilitation Council)
- Section 43B(h) Income Tax Act (buyer loses deduction)
- Interest calculation formula, document requirements for council filing

**Hackathon feasibility (48 hrs):** HIGH. Formulaic interest calculation + document checklist + template generator is deterministic and demo-able.

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Clear user (MSME supplier), clear pain (cash flow from delayed payments) |
| Technical depth | 20 | Moderate | Interest calculator is formulaic; depth from document management + council filing assistant |
| Functional completeness | 15 | Strong | One workflow: upload invoices → calculate interest → generate notice/council filing |
| Domain analysis | 20 | Strong | Well-defined statutes; calculations are verifiable |
| Validation | 10 | Strong | Test interest calculation against known examples; edge cases (partial payments, multiple invoices) |
| UX | 10 | Strong | Relationship-preserving tone is a differentiator |
| Originality | 10 | Moderate | Interest calculators exist; relationship-preserving enforcement angle is novel |

**Estimated scoring potential:** 78–88/100. Very implementable, strong domain correctness.

---

### LS-04: Personal Data in Informal Systems (Data Protection for Small Businesses)

**Core problem:** DPDP Act 2023 applies to all businesses handling personal data digitally. SMEs store data across WhatsApp, Google Forms, Excel, billing software, CCTV, personal phones. They don't know what data they hold, where, why, or how to handle erasure requests/breaches.

**What the solution must do:**
- Discover what personal data the business handles
- Manage consent and purpose
- Respond to rights requests (access, erasure, correction)
- Breach preparedness

**Domain knowledge required:**
- DPDP Act 2023: consent, purpose limitation, data subject rights, breach notification, Data Protection Board
- Data inventory standards

**Hackathon feasibility (48 hrs):** MEDIUM. Data discovery across informal systems is technically hard (WhatsApp/Excel/CCTV parsing). Consent management + rights request workflow is buildable but scope-heavy.

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Clear, timely (DPDP Act is new and phased in) |
| Technical depth | 20 | High potential | Data discovery + consent manager is technically substantive |
| Functional completeness | 15 | Weak risk | Too many workflows (discover, consent, rights, breach) for 48 hrs |
| Domain analysis | 20 | Moderate | DPDP Act is new; interpretations evolving; risk of inaccuracies |
| Validation | 10 | Moderate | Hard to validate without real data inventory |
| UX | 10 | Strong | Privacy dashboard for non-technical owners is UX-critical |
| Originality | 10 | Strong | SME-focused DPDP compliance tool is novel |

**Estimated scoring potential:** 65–80/100. Scope creep risk is the main threat.

---

### LS-05: Notice on the Desk (Government and Legal Notice Triage)

**Core problem:** SMEs receive notices (GST show-cause, income tax intimations, labour queries, cheque-bounce demands, legal notices) via email/post/portal. Dense legal language, 15–30 day response windows, ignoring → ex-parte orders/penalties. Owners can't assess severity.

**What the solution must do:**
- Upload/forward any notice → plain-language summary (who, what law, accusation/request, severity, deadline)
- Response guidance: documents needed, professional required?, draft reply structure
- Track open notices so none miss deadline

**Domain knowledge required:**
- GST, Income Tax, Labour laws, Negotiable Instruments Act (cheque bounce), civil/commercial notice types
- Severity triage, response deadline extraction

**Hackathon feasibility (48 hrs):** MEDIUM. OCR + document classification + deadline extraction is doable for limited notice types. Severity assessment requires legal judgment.

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Very concrete, painful problem |
| Technical depth | 20 | Moderate | OCR + classification is substantive but scope-limited |
| Functional completeness | 15 | Moderate | Upload → triage → draft reply is one workflow but notice types vary widely |
| Domain analysis | 20 | Moderate | Requires accurate law identification per notice type |
| Validation | 10 | Moderate | Test against sample notices; edge cases (unclear deadline, multi-law notice) |
| UX | 10 | Strong | Plain-language summary + deadline tracker is highly usable |
| Originality | 10 | Moderate | Notice management tools exist; plain-language triage is a good angle |

**Estimated scoring potential:** 70–82/100. Solid middle-ground choice.

---

### LS-06: From Handshake to Contract (Informal Agreements)

**Core problem:** Small business dealings are informal (verbal, WhatsApp, voice notes). Disputes arise with no clean agreement. Courts expect documentation + stamp duty. Owners avoid formal contracts (expensive, slow, awkward).

**What the solution must do:**
- Extract key terms from conversations (parties, scope, price, timelines, payment terms)
- Flag ambiguous/missing terms
- Generate plain-language agreement for both sides to confirm
- Tamper-evident evidence trail

**Domain knowledge required:**
- Indian Contract Act, state stamp duty rules, evidence law, contract essentials

**Hackathon feasibility (48 hrs):** MEDIUM–LOW. Conversation parsing (WhatsApp/voice notes) + term extraction + ambiguity detection is NLP-heavy. Tamper-evidence (hashing/timestamps) is easy. Mutual confirmation workflow adds complexity.

**Rubric mapping:**
| Criterion | Weight | Fit | Why |
|---|---|---|---|
| Problem understanding | 15 | Strong | Clear, relatable problem |
| Technical depth | 20 | High potential | NLP extraction + tamper-evidence is technically substantive |
| Functional completeness | 15 | Weak risk | Ingestion → extract → flag → generate → confirm → tamper-evidence is many steps |
| Domain analysis | 20 | Moderate | Contract essentials + stamp duty by state; accuracy matters |
| Validation | 10 | Moderate | Test term extraction accuracy; edge cases (ambiguous voice notes) |
| UX | 10 | Strong | Non-legalistic framing for both parties is a UX strength |
| Originality | 10 | Strong | Informal-to-formal for small businesses is novel |

**Estimated scoring potential:** 68–82/100. Scope management is critical.

---

## Part 3: Composite Ranking — Toughness vs. Hackathon Suitability

### Toughness Ranking (technical + domain + behavioral difficulty)

| Rank | Problem | Legal Complexity | Technical Complexity | Data Fragmentation | Behavioral Friction | Consequence Severity | Total /25 |
|---|---|---|---|---|---|---|---|
| 1 (Toughest) | LS-02 Regulatory Change Impact | 5 | 5 | 4 | 3 | 4 | **21** |
| 2 | LS-04 Data Protection | 4 | 4 | 5 | 4 | 4 | **21** |
| 3 | LS-05 Notice Triage | 4 | 4 | 4 | 3 | 5 | **20** |
| 4 | LS-06 Informal Agreements | 3 | 4 | 5 | 5 | 3 | **20** |
| 5 | LS-01 Growth Trap | 4 | 3 | 3 | 3 | 4 | **17** |
| 6 (Least Tough) | LS-03 MSME Payment Rights | 3 | 3 | 3 | 4 | 4 | **17** |

### Hackathon Suitability Ranking (48-hr feasibility × scoring potential)

| Rank | Problem | 48-hr Feasibility | Scope Control Risk | Domain Correctness Confidence | Demo Impact | Estimated Score Range | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | LS-03 MSME Payment Rights | High | Low | High | Medium-High | 78–88 | **Top pick** — safe, implementable, strong domain |
| 2 | LS-01 Growth Trap | High | Low | High | Medium | 75–85 | **Strong alternative** — rule-based, demo-able |
| 3 | LS-05 Notice Triage | Medium | Medium | Medium | High | 70–82 | Good if team has OCR/NLP skills |
| 4 | LS-06 Informal Agreements | Medium–Low | High | Medium | Medium-High | 68–82 | Risky due to scope creep |
| 5 | LS-04 Data Protection | Medium | High | Medium | High | 65–80 | Too many workflows for 48 hrs |
| 6 | LS-02 Regulatory Change | Low–Medium | High | Low–Medium | Medium | 60–75 | Highest risk; NLP reliability uncertain |

---

## Part 4: Recommended Decision Matrix

### If your team's strength is domain + reliability (recommended for most teams)

**Choose: LS-03 (MSME Payment Rights)**

Rationale:
- Formulaic domain (MSMED Act + Section 43B(h)) → high domain analysis score (20 pts)
- Deterministic interest calculator → high technical depth without NLP risk
- One clear workflow (invoice → interest → notice → council filing) → functional completeness
- Relationship-preserving tone → UX differentiator
- Easy to validate with test cases → validation score
- Demo video at hour 36 is achievable: show interest calculation + draft notice generation

**48-hour plan:**
- Hours 0–8: Domain research (MSMED Act sections, interest formula, Section 43B(h)), data model (invoice, payment, interest calc), UI wireframes
- Hours 8–24: Build interest calculator, document uploader, notice template generator, MSME council filing checklist
- Hours 24–36: Polish UI, add validation/test cases, record demo video (submit by hour 36)
- Hours 36–48: Complete repo, README, edge-case handling, final submission

---

### If your team's strength is NLP + document processing

**Choose: LS-05 (Notice Triage)**

Rationale:
- OCR + classification + deadline extraction plays to NLP strengths
- Plain-language output + deadline tracker is high UX impact
- Demo-able: upload a sample notice → get plain-language summary

Risk: Legal accuracy of severity triage; limit scope to 3–4 notice types (GST show-cause, income tax intimation, cheque-bounce, labour query).

---

### If your team's strength is rule engines + regulatory databases

**Choose: LS-01 (Growth Trap)**

Rationale:
- Threshold → obligation lookup is a clean rule engine
- Multi-state registration tracker adds depth
- Demo-able: input milestone → get obligations + deadlines + penalties

Risk: Keeping obligation database accurate across states; limit to ESI, POSH, EPF, GST, e-invoicing for MVP.

---

## Part 5: Rubric-Level Strategy for Legal Services Teams

### Criterion-by-criterion playbook

| Criterion | Weight | What Judges Want | Legal Services-Specific Tactics |
|---|---|---|---|
| Problem understanding | 15 | Who, what makes it hard, why your scope matters | Pick ONE user persona (e.g., "15-employee manufacturing SME"); state assumptions explicitly; scope to one milestone type |
| Technical depth | 20 | Real, demonstrable core; justify design choices | Show architecture diagram; explain why you chose rule-based vs. NLP; demo live calculation |
| Functional completeness | 15 | One coherent end-to-end workflow | Prioritize the happy path; have fallback if OCR/API fails; demo with representative data |
| Domain analysis | 20 | Sound calculations, rules, assumptions; explainable | Cite specific Act sections (e.g., "MSMED Act Section 15", "Section 43B(h)"); show formula; state where output is indicative not authoritative |
| Validation | 10 | Normal + edge cases; data limits; honesty | Test boundary (exactly 10 employees, day 45 of payment); show test results; admit limitations |
| UX | 10 | Understandable for intended audience | Plain-language output; clear warnings; no legalese; design for non-lawyer SME owner |
| Originality | 10 | Thoughtful choices, trade-offs | Explain why you scoped this way; what you deliberately left out; distinctive angle (e.g., relationship-preserving) |

### Professional boundaries (critical for legal theme)

Per Rules.md line 139 and rubric page 3: "Finance and legal prototypes should communicate relevant assumptions and uncertainty. Do not claim guaranteed financial outcomes or definitive legal authority."

**Required in your submission:**
- Disclaimer: "This is a prototype for hackathon purposes; not legal advice."
- Assumption statements: "Assumes buyer is registered under MSMED Act," "Interest calculated at 3× current RBI bank rate"
- Limitation section: "Does not cover state-specific stamp duty," "Does not file with MSME Facilitation Council directly"

---

## Part 6: Final Recommendation

**Primary recommendation:** LS-03 — Paid on Time, by Law (MSME Payment Rights)

**Why:** Best balance of 48-hour feasibility, domain correctness confidence, and rubric scoring potential. It maps cleanly to the highest-weighted criteria (Technical depth 20, Domain analysis 20) without NLP risk. Interest calculation is formulaic and verifiable. The relationship-preserving framing is a UX differentiator.

**Secondary recommendation:** LS-01 — The Growth Trap (Compliance Triggered by Business Milestones)

**Why:** Rule-based, deterministic, demo-able in 48 hours. Good if your team prefers regulatory databases over calculations.

**Avoid for a first-time hackathon team:** LS-02 (Regulatory Change Impact) — NLP reliability risk in 48 hours is too high; LS-04 (Data Protection) — too many workflows for scope control.

---

**Files referenced:**
- `N:\chnayka\Problem Statements.pdf` — source of all 6 LS problem statements
- `N:\chnayka\Rules.md` — event rules, judging criteria, deadlines
- `N:\chnayka\Srujana_2026_Participant_Evaluation_Rubric.pdf` — rating scale, preparation guidance, expectations

*End of analysis.*