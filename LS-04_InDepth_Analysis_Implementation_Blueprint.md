# LS-04: Personal Data in Informal Systems — In-Depth Analysis & Implementation Blueprint

## Srujana Tech Fest 2026 | Legal Services Theme | Problem Statement LS-04

---

## Part 1: Problem Statement — Verbatim Breakdown

### Source Text (from Problem Statements.pdf)

**Context:**
> India's Digital Personal Data Protection Act, 2023 applies to businesses of every size that handle personal data digitally, and its rules are being phased in. A typical SME stores customer, employee and patient data across WhatsApp chats, Google Forms, Excel sheets, billing software, CCTV systems and personal phones. Most could not tell you what personal data they hold, where it sits, why they collected it, or how they would respond if a customer asked for it to be erased. They also could not say what they would do in a breach.

**The Challenge:**
> Build a solution that helps a small business reach practical, demonstrable data protection compliance without a dedicated privacy team. That means finding out what personal data it handles, managing consent and purpose, responding to individuals' rights requests, and being prepared for a breach.

---

## Part 2: Deep Problem Decomposition

### 2.1 The Core Problem

| Dimension | Detail |
|---|---|
| **Regulatory trigger** | Digital Personal Data Protection Act, 2023 (DPDP Act) — applies to ALL businesses handling personal data digitally, regardless of size |
| **Implementation status** | Rules being phased in — creates urgency but also uncertainty (evolving requirements) |
| **Target user** | Small business owner with no dedicated privacy team |
| **Data locations** | WhatsApp chats, Google Forms, Excel sheets, billing software, CCTV systems, personal phones |
| **Knowledge gap** | Owner cannot answer: what data they hold, where it sits, why collected, how to handle erasure requests, what to do in a breach |
| **Business impact** | Regulatory penalties, reputational damage, inability to demonstrate compliance |

### 2.2 The Four Required Capabilities

The problem statement explicitly demands four functions:

1. **Data Discovery** — Finding out what personal data the business handles
2. **Consent & Purpose Management** — Managing consent and purpose limitation
3. **Rights Request Response** — Responding to individuals' rights requests (access, erasure, correction)
4. **Breach Preparedness** — Being prepared for a data breach

---

## Part 3: Legal Framework Deep-Dive — DPDP Act 2023

### 3.1 Key Provisions Relevant to SMEs

| Provision | What It Requires | SME Implication |
|---|---|---|
| **Section 2** — Definitions | Defines "personal data," "data principal," "data fiduciary," "data processor" | SME is typically a "data fiduciary" — determines purpose and means of processing |
| **Section 4** — Lawful Basis | Personal data may be processed only for a lawful purpose with consent (or for certain legitimate uses) | SME must obtain consent before collecting customer/employee data |
| **Section 5** — Notice | Data fiduciary must give notice to data principal about what data is collected, why, and how to exercise rights | SME needs plain-language privacy notices |
| **Section 6** — Consent | Consent must be free, specific, informed, unconditional, and unambiguous; can be withdrawn | SME needs consent capture, tracking, and withdrawal mechanism |
| **Section 7** — General Obligations | Data fiduciary must ensure completeness/accuracy of data, implement security safeguards, notify breaches | SME must maintain data accuracy and report breaches to Data Protection Board |
| **Section 9** — Rights of Data Principal | Right to access, correct, erase, withdraw consent, grievance redressal | SME must respond to data principal requests within timelines |
| **Section 15** — Breach Notification | Notify Data Protection Board and affected data principals in case of personal data breach | SME needs breach detection and notification process |
| **Section 17** — Exemptions | Certain exemptions for state functions, research, etc. | Most SMEs won't qualify — full compliance needed |
| **Schedule** — Penalties | Up to ₹250 crore for failure to take reasonable security safeguards; up to ₹500 crore for failure to notify breach | Severe penalties — demonstrates why compliance matters |

### 3.2 "Phased Implementation" — What It Means for the Hackathon

- Rules under DPDP Act are being notified in phases
- Some provisions may already be in effect; others pending
- **Hackathon implication:** Build for the core, stable requirements (consent, rights, breach response) while acknowledging phased rules as a limitation
- **Demo angle:** Show compliance with provisions that are clear and stable; document which provisions are pending rule notification

### 3.3 Data Fiduciary vs. Data Processor

| Role | Definition | Typical SME Position |
|---|---|---|
| Data Fiduciary | Entity that determines purpose and means of processing personal data | The SME itself (decides what customer data to collect and why) |
| Data Processor | Entity that processes data on behalf of a fiduciary | Could be billing software, Google Forms, WhatsApp (as service providers) |

**Key insight:** The SME is responsible for compliance even when data sits in third-party tools (Google Forms, billing software). They cannot outsource responsibility.

---

## Part 4: Technical Architecture Design

### 4.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LS-04: Data Protection Compliance          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Data Ingestion Connectors                            │
│  ├─ WhatsApp chat export parser (.txt, media)                  │
│  ├─ Google Forms responses scraper                              │
│  ├─ Excel/CSV spreadsheet scanner                               │
│  ├─ Billing software export (CSV/JSON)                          │
│  └─ CCTV metadata extractor (timestamps, camera locations)      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Personal Data Discovery Engine                        │
│  ├─ PII detection (names, phones, emails, Aadhaar, PAN, etc.)   │
│  ├─ Data categorization (customer, employee, patient, vendor)   │
│  ├─ Location mapping (which system holds what data)             │
│  └─ Purpose inference (why data was collected)                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Data Inventory / Register                             │
│  ├─ Central registry of all personal data assets                │
│  ├─ Data flow mapping (source → storage → sharing → retention)  │
│  └─ Retention schedule per data category                        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Consent Management                                    │
│  ├─ Consent capture (collection point, purpose, scope)          │
│  ├─ Consent registry (who consented, when, for what)            │
│  ├─ Consent withdrawal handler                                  │
│  └─ Consent expiry/refresh tracker                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: Rights Request Management                             │
│  ├─ Request intake portal (access, erasure, correction)         │
│  ├─ Request verification (identity confirmation)                │
│  ├─ Data retrieval across systems                               │
│  ├─ Response template generator                                 │
│  └─ Deadline tracker (DPDP Act timelines)                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 6: Breach Preparedness                                   │
│  ├─ Breach incident log                                         │
│  ├─ Impact assessment tool                                      │
│  ├─ Notification template generator (Board + data principals)   │
│  └─ Remediation action tracker                                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 7: Compliance Dashboard                                  │
│  ├─ Compliance scorecard                                        │
│  ├─ Gap analysis                                                │
│  ├─ Action items with deadlines                                 │
│  └─ Demonstrable evidence package                               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model Schema

#### Core Entities

```
DataAsset (the register of what data exists)
├── id: UUID
├── name: string
├── category: enum [customer, employee, patient, vendor, other]
├── data_types: array[enum [name, phone, email, address, id_number, financial, health, biometric, other]]
├── source_system: enum [whatsapp, google_forms, excel, billing, cctv, personal_phone, other]
├── location: string (file path, phone number, system name)
├── purpose: string (why collected)
├── legal_basis: enum [consent, contract, legal_obigation, vital_interest, legitimate_interest]
├── consent_required: boolean
├── consent_status: enum [not_obtained, obtained, withdrawn, expired]
├── retention_period: string
├── last_reviewed: date
├── risk_level: enum [low, medium, high]
└── created_at: timestamp

ConsentRecord
├── id: UUID
├── data_principal_id: string
├── data_asset_id: UUID (references DataAsset)
├── purpose: string
├── scope: string
├── consent_given_at: timestamp
├── consent_withdrawn_at: timestamp (nullable)
├── consent_method: enum [written, digital, verbal_recorded, implied]
├── evidence_reference: string (link to consent proof)
└── is_active: boolean

RightsRequest
├── id: UUID
├── data_principal_id: string
├── request_type: enum [access, correction, erasure, consent_withdrawal]
├── status: enum [received, verified, in_progress, completed, rejected]
├── received_at: timestamp
├── deadline_at: timestamp (per DPDP Act timelines)
├── verification_status: enum [pending, verified, failed]
├── response_data: JSON (data retrieved for access requests)
├── response_sent_at: timestamp (nullable)
└── notes: string

BreachIncident
├── id: UUID
├── title: string
├── description: string
├── discovered_at: timestamp
├── affected_data_categories: array[string]
├── affected_data_principal_count: integer (estimated)
├── severity: enum [low, medium, high, critical]
├── reported_to_board: boolean
├── board_notification_at: timestamp (nullable)
├── data_principal_notified: boolean
├── principal_notification_at: timestamp (nullable)
├── remediation_actions: array[string]
├── status: enum [open, investigating, remediated, closed]
└── created_at: timestamp
```

### 4.3 Technology Stack Recommendation (48-Hour Hackathon)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + Tailwind CSS | Fast UI development, responsive |
| Backend | Node.js + Express | Rapid API development, team familiarity |
| Database | SQLite (file-based) | Zero setup, works offline, demo-friendly |
| PII Detection | Regex + keyword rules (no external NLP API needed) | Deterministic, no API costs, works offline |
| File Parsing | pdfplumber, python-docx, pandas | For WhatsApp exports, Excel, Google Forms CSV |
| Auth | Simple session-based (no OAuth complexity) | 48-hr scope constraint |
| Deployment | Localhost + ngrok for demo | No cloud setup needed |

**Why no external AI/NLP APIs:** Rules.md says synthetic/public/team-generated data OK; no paid services unless explicitly permitted. Building PII detection with regex keeps the demo self-contained and reliable.

---

## Part 5: Feature-by-Feature Implementation Plan

### Feature 1: Data Discovery & Inventory (MVP Priority: Critical)

**User flow:**
1. User uploads data exports (WhatsApp .txt, Google Forms CSV, Excel, billing CSV)
2. System scans each file for PII patterns
3. System categorizes data by type (customer, employee, patient)
4. System generates data inventory register

**PII Detection Patterns (India-specific):**

```python
PII_PATTERNS = {
    'phone_number': r'(?:\+91[-.\s]?)?[6-9]\d{9}',  # Indian mobile
    'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    'aadhaar': r'\b\d{4}\s?\d{4}\s?\d{4}\b',  # 12-digit Aadhaar
    'pan': r'[A-Z]{5}[0-9]{4}[A-Z]{1}',  # PAN card format
    'name': r'(?:name|customer|patient|employee)[:\s]+([A-Za-z\s]{2,50})',
    'address': r'(?:address|location)[:\s]+(.{10,200})',
}
```

**Output:** Data inventory table showing each data asset, its location, types of PII, purpose, and risk level.

### Feature 2: Consent Management (MVP Priority: High)

**User flow:**
1. User registers a data collection point (e.g., "WhatsApp customer inquiries")
2. System generates consent capture template (plain language)
3. User logs consent given by each data principal
4. System tracks consent status (active/withdrawn/expired)
5. User can process consent withdrawal

**Consent record fields:**
- Data principal (customer name/phone)
- Purpose of collection
- Scope of data collected
- Date and method of consent
- Evidence reference (screenshot, chat log link)
- Withdrawal date (if applicable)

### Feature 3: Rights Request Management (MVP Priority: High)

**User flow:**
1. Data principal submits request (access, erasure, or correction)
2. Business owner verifies identity of requester
3. System locates all data about that principal across systems
4. System generates appropriate response:
   - Access: Data copy in plain language
   - Erasure: Confirmation of deletion + deletion log
   - Correction: Updated record + confirmation
5. System tracks response deadline

**DPDP Act response timelines (to be verified against actual rules):**
- Acknowledge receipt: Immediately / within 3 days
- Respond to access request: Within 30 days
- Respond to erasure request: Within 30 days
- Respond to correction: Within 30 days

### Feature 4: Breach Preparedness (MVP Priority: Medium)

**User flow:**
1. User logs a suspected or confirmed breach
2. System guides impact assessment (what data, how many people, severity)
3. System generates breach notification template for Data Protection Board
4. System generates data principal notification template
5. System tracks remediation actions and closure

**Breach assessment fields:**
- Date and time of discovery
- Type of breach (unauthorized access, loss, disclosure)
- Categories of personal data affected
- Estimated number of affected data principals
- Possible consequences
- Immediate containment actions taken

---

## Part 6: Rubric Mapping — LS-04 Against Srujana Judging Criteria

### Criterion 1: Problem Understanding and Relevance (Weight: 15)

| Aspect | How LS-04 Addresses It |
|---|---|
| Who experiences the problem | SME owners without privacy teams — customer-facing businesses, clinics, small retailers |
| What makes it difficult | Data scattered across informal systems (WhatsApp, Excel, personal phones); no centralized inventory |
| Why this scope matters | DPDP Act applies to all sizes; penalties up to ₹500 crore; phased rules create urgency |
| Assumptions stated | Business handles digital personal data; owner is the data fiduciary; synthetic/demo data used |

**Expected rating: 4/5 → 12/15 weighted**

### Criterion 2: Technical Depth and Implementation (Weight: 20)

| Aspect | How LS-04 Addresses It |
|---|---|
| Core approach | Multi-source data ingestion + PII detection engine + consent registry + rights workflow + breach module |
| Architecture | Layered architecture with separation of concerns (ingestion → discovery → consent → rights → breach → dashboard) |
| Design decisions | SQLite for offline demo; regex-based PII detection (no API dependency); React frontend |
| Integration | WhatsApp parser, Excel/CSV scanner, consent tracker, rights request portal |

**Expected rating: 3.5–4/5 → 14–16/20 weighted**

### Criterion 3: Functional Completeness and Reliability (Weight: 15)

| Aspect | How LS-04 Addresses It |
|---|---|
| Central workflow | Upload data → discover PII → build inventory → manage consent → handle rights requests → breach log |
| End-to-end demo | Demo one complete cycle: upload sample WhatsApp chat → detect customer phone numbers → create data asset → log consent → simulate erasure request → generate response |
| Fallback plan | If file parsing fails, manual data entry mode; if PII detection misses something, manual tagging override |

**Expected rating: 3.5/5 → 10.5/15 weighted**

### Criterion 4: Domain Analysis and Correctness (Weight: 20)

| Aspect | How LS-04 Addresses It |
|---|---|
| Legal citations | DPDP Act 2023 Sections 4, 5, 6, 7, 9, 15; penalty schedule |
| Calculations | Not calculation-heavy; focus on correct legal mapping (consent required vs. not required) |
| Assumptions explained | "Consent is the primary lawful basis for SME customer data"; "SME is a data fiduciary" |
| Limitations stated | "Does not cover state-specific sectoral regulations"; "Phased rules may change requirements"; "Not legal advice" |

**Expected rating: 4/5 → 16/20 weighted**

### Criterion 5: Validation and Robustness (Weight: 10)

| Test Case | Description |
|---|---|
| Normal case | Upload WhatsApp export with customer messages → detect phone numbers + names → create inventory |
| Edge case | Excel file with no PII → system reports "no personal data found" |
| Edge case | WhatsApp chat with mixed personal/business messages → system flags ambiguity for manual review |
| Edge case | Consent withdrawal → system marks consent as inactive and flags data for deletion |
| Failure scenario | What if data principal cannot be verified? → System rejects request with explanation |

**Expected rating: 3.5/5 → 7/10 weighted**

### Criterion 6: User Experience and Accessibility (Weight: 10)

| Aspect | Implementation |
|---|---|
| Main task discoverability | Dashboard shows "Next compliance action" prominently |
| Output labeling | Plain-language explanations of legal terms ("Data principal" = "the person whose data this is") |
| Warnings | Clear warnings when consent is missing or breach not reported |
| Audience design | Built for non-technical SME owner; no legal jargon without explanation |
| Accessibility | High contrast, readable fonts, mobile-responsive |

**Expected rating: 4/5 → 8/10 weighted**

### Criterion 7: Originality and Presentation (Weight: 10)

| Aspect | Implementation |
|---|---|
| Distinctive angle | Focus on informal systems (WhatsApp, personal phones) — most DPDP tools assume formal databases |
| Trade-offs explained | Chose regex over ML for PII detection (reliability over sophistication); chose SQLite over cloud DB (offline demo) |
| Communication | Demo video shows real SME scenario (clinic or retail shop) |

**Expected rating: 4/5 → 8/10 weighted**

### Total Estimated Score: 75.5–81 / 100

---

## Part 7: 48-Hour Execution Plan for LS-04

### Hour 0–6: Foundation & Domain Research
- [ ] Read DPDP Act 2023 key sections (4, 5, 6, 7, 9, 15) — create legal reference sheet
- [ ] Define user persona: "Dr. Sharma's Clinic" — 15-employee healthcare SME with patient data in WhatsApp, Excel, billing software
- [ ] Design data model (DataAsset, ConsentRecord, RightsRequest, BreachIncident)
- [ ] Set up React + Node.js + SQLite project scaffold
- [ ] Create UI wireframes for each module

### Hour 6–18: Core Build (Data Discovery + Consent)
- [ ] Build file upload component (WhatsApp .txt, CSV, Excel)
- [ ] Implement PII detection regex engine (phone, email, Aadhaar, PAN, name)
- [ ] Build data inventory register UI (table view of discovered assets)
- [ ] Implement consent capture form (purpose, scope, method, evidence)
- [ ] Build consent registry UI (active/withdrawn/expired status)
- [ ] Add manual override for PII detection (user can tag/untag data)

### Hour 18–30: Rights Request + Breach Module
- [ ] Build rights request intake form (access, erasure, correction)
- [ ] Implement identity verification step (simple checkbox + ID type)
- [ ] Build data retrieval across discovered assets (mock/simulated)
- [ ] Generate rights response templates (access data copy, erasure confirmation)
- [ ] Build breach incident logger (impact assessment, notification templates)
- [ ] Add deadline tracker for rights requests and breach notifications

### Hour 30–36: Polish + Demo Video Prep
- [ ] Build compliance dashboard (scorecard, gap analysis, next actions)
- [ ] Add plain-language explanations throughout UI
- [ ] Add disclaimer banner ("Not legal advice — hackathon prototype")
- [ ] Create demo data set (sample WhatsApp export, Excel sheet, billing CSV)
- [ ] Record demo video (3–5 minutes showing full workflow)
- [ ] Submit demo video by hour 36

### Hour 36–48: Final Submission
- [ ] Complete README with setup instructions, architecture, domain assumptions
- [ ] Add test cases and validation evidence
- [ ] Document limitations (phased rules, no cloud deployment, synthetic data)
- [ ] Prepare final project repository
- [ ] Submit by hour 48

---

## Part 8: Demo Script (3–5 Minutes)

### Scene 1: The Problem (30 seconds)
> "Dr. Sharma runs a small clinic. Patient records are in WhatsApp chats, Excel sheets, and billing software. Under India's DPDP Act 2023, she's responsible for all of it — but she doesn't know what data she has or where it sits."

### Scene 2: Data Discovery (60 seconds)
- Upload sample WhatsApp chat export
- System detects: patient names, phone numbers, appointment details
- Upload sample Excel billing sheet
- System detects: patient names, payment amounts, treatment types
- Result: Data inventory register showing 47 personal data assets across 3 systems

### Scene 3: Consent Management (45 seconds)
- Show consent capture for a new patient registration
- Log consent with purpose ("treatment and billing") and evidence reference
- Show consent withdrawal: patient revokes consent → system flags their data for deletion

### Scene 4: Rights Request (45 seconds)
- Patient submits erasure request via portal
- Owner verifies identity
- System locates all data about that patient across WhatsApp + Excel
- Generates erasure confirmation letter with DPDP Act reference
- Tracks 30-day response deadline

### Scene 5: Breach Preparedness (30 seconds)
- Log suspected breach: "Unauthorized access to billing spreadsheet"
- Impact assessment: 200 patients affected, phone numbers + treatment data exposed
- Generate breach notification template for Data Protection Board
- Generate patient notification template
- Track remediation: change passwords, restrict spreadsheet access

### Scene 6: Compliance Dashboard (30 seconds)
- Compliance scorecard: 68% (discovery complete, consent partial, rights ready, breach not tested)
- Gap analysis: "Add consent records for legacy customers" — priority high
- Next actions with deadlines

### Scene 7: Disclaimer (15 seconds)
> "This is a hackathon prototype. Not legal advice. DPDP Act rules are being phased in — consult a legal professional for production use."

---

## Part 9: Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| PII detection misses data | High | Medium | Manual tagging override; clear "review needed" flags |
| Legal interpretation error | Medium | High | Extensive disclaimer; cite specific Act sections; state assumptions |
| Scope creep (too many features) | High | High | MVP scope: discovery + consent + rights + breach log only; drop CCTV parsing |
| Demo failure (file upload issues) | Medium | High | Pre-load demo data; have screenshots as backup |
| Time overrun | Medium | Medium | Cut features in priority order: breach log → rights → consent → discovery |
| Team member unavailable | Low | High | Pair programming; document all decisions; shared repo |

---

## Part 10: Sustainable Problem-Statement Category Classification

**Primary Category: Data Governance & Privacy**

- DPDP Act compliance is ongoing and phased — not a one-time fix
- Data governance is a permanent operational requirement for any business handling personal data
- The solution creates demonstrable compliance evidence that can be maintained long-term

**Secondary Category: Compliance Automation**

- Automates tracking of data assets, consent status, and response deadlines
- Reduces manual effort in maintaining data protection compliance

---

## Part 11: Files to Create for Submission

| File | Purpose |
|---|---|
| `README.md` | Project overview, setup, architecture, domain assumptions, limitations |
| `src/` | Source code (React frontend, Node.js backend) |
| `database/schema.sql` | SQLite schema |
| `demo-data/` | Sample WhatsApp export, Excel sheet, billing CSV |
| `tests/` | Validation test cases |
| `LEGAL_ASSUMPTIONS.md` | Detailed legal assumptions and limitations |
| `DISCLAIMER.md` | "Not legal advice" disclaimer |

---

## Part 12: Why LS-04 Is a Strong Choice

| Factor | LS-04 Assessment |
|---|---|
| **48-hour feasibility** | Medium — achievable with disciplined scope |
| **Domain correctness** | Strong — DPDP Act sections are clear and citable |
| **Rubric alignment** | Maps well to all 7 criteria; highest potential in Domain Analysis (20 pts) and UX (10 pts) |
| **Demo impact** | High — visual data inventory + consent + rights workflow is compelling |
| **Originality** | Strong — informal system focus is underexplored |
| **Risk** | Scope creep is the main risk; manageable with MVP discipline |

**Verdict:** LS-04 is a strong, implementable choice for a team that can manage scope carefully. It scores well on the highest-weighted criteria (Domain Analysis 20, Technical Depth 20) and offers strong demo potential.

---

*End of LS-04 In-Depth Analysis*
