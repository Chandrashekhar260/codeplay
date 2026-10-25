# Srujana — Build Log & Feature Manifest

> **Hackathon MVP:** DPDP Compliance Assistant for Indian MSMEs  
> **Repository Branch:** `feature/auth-and-tenant-foundation`  
> **Database:** Real PostgreSQL (Neon Serverless) + Prisma ORM  
> **Last Updated:** 2026-10-25 05:40 IST  

This document logs every module, file, database model, API endpoint, and testing procedure built for Srujana. You can download and refer to this single file at any time.

---

## 📋 System Architecture & Tech Stack Summary
- **Backend Architecture:** Modular Monolith (Node.js + Express + TypeScript)
- **Database & ORM:** PostgreSQL (Neon Cloud) with Prisma ORM (Strict Tenant Isolation)
- **File Processing:** Python 3.10 + Pandas + OpenPyXL + Verhoeff Mathematical Algorithm
- **Governance & Policy:** Statutory DPDP Rules & Retention Engine (Zero Hallucination)
- **Data Flow Graph:** React Flow node & edge relationship structure
- **Security:** Strict Multi-tenant Isolation middleware, RS256/HMAC JWT auth, Salted Bcrypt password hashing
- **Audit Logging:** Append-only tenant audit events for all sensitive actions

---

## 🛠️ Feature 1: Workspace Tenancy & Authentication (COMPLETED)
- **Status:** Verified with real Neon PostgreSQL database
- **Endpoints:**
  - `GET /health` — Health check
  - `POST /api/v1/auth/register` — Business workspace + Admin creation
  - `POST /api/v1/auth/login` — Authentication + JWT issuance
  - `GET /api/v1/auth/me` — Authenticated profile & tenant isolation check
  - `GET /api/v1/platform/tenant` — Workspace management & entity counts

---

## 🛠️ Feature 2: Discovery & PII Scanner (Pillar 1) (COMPLETED)
- **Status:** Verified with real uploaded Excel file (`DentalClinic_Sample_Data_No_ReadMe.xlsx`)
- **Engine:** Python script ([`scanner.py`](./backend/src/python/scanner.py)) with Verhoeff checksum algorithm for Indian Aadhaar validation, PAN regex, Indian phone numbers, and clinical health keywords
- **Endpoints:**
  - `POST /api/v1/discovery/upload` — Multipart file upload (saved privately to `uploads/<tenant_id>/`), registers source, automatically triggers Python scanner, and stores findings & flags
  - `POST /api/v1/discovery/scan/:sourceId` — Re-runs discovery scan
  - `GET /api/v1/discovery/sources` — Lists registered data sources
  - `GET /api/v1/discovery/sources/:sourceId/findings` — Returns discovered PII fields
  - `GET /api/v1/discovery/sources/:sourceId/flags` — Returns privacy risk flags

---

## 🛠️ Feature 3: RoPA Mapping & Relationship Graph (Pillar 1 & 2) (COMPLETED)
- **Status:** Verified with real uploaded source data and automated test suite
- **Database Models (Photo 2: `mapping-service · port 9016`):**
  - **`processing_activities`**: `activity_id`, `tenant_id`, `name`, `business_function`, `legal_basis`, `status`, `created_at`
  - **`data_elements`**: `element_id`, `activity_id`, `pii_category`, `data_subjects`, `volume_estimate`
  - **`data_flows`**: `flow_id`, `activity_id`, `flow_stage`, `system_name`, `location`, `safeguards`
  - **`third_party_recipients`**: `recipient_id`, `activity_id`, `name`, `recipient_type`, `country`
  - **`retention_policies`**: `policy_id`, `activity_id`, `retention_period_months`, `trigger_event`
- **Endpoints:**
  - `POST /api/v1/mapping/activities` — Creates processing activity & auto-imports discovered fields from uploaded files
  - `GET /api/v1/mapping/activities` — Full RoPA record list
  - `POST /api/v1/mapping/activities/:activityId/flows` — Records lifecycle flow stages
  - `POST /api/v1/mapping/activities/:activityId/recipients` — Records third-party recipients
  - `POST /api/v1/mapping/activities/:activityId/retention` — Records statutory retention schedules
  - `GET /api/v1/mapping/graph` — React Flow nodes & edges (11 nodes, 8 edges)

---

## 🛠️ Feature 4: Governance Service & Statutory Rules Engine (Photo 2: `governance-service · port 9010`) (COMPLETED)
- **Status:** Verified with real uploaded source data and automated test suite
- **Engine Rules ([`governance.rules.ts`](./backend/src/modules/governance/governance.rules.ts)):**
  - **Classification Policies:** `RESTRICTED` (Aadhaar, Health Data), `CONFIDENTIAL` (PAN, Phone, Email, Full Name), `INTERNAL` (Employee ID), `PUBLIC` (Approved disclosures).
  - **Retention Schedules:** `FINANCE_BILLING` (72 Months / CGST Act Sec 36), `SECURITY_LOGS` (12 Months / DPDP Rules 2025 Rule 6(1)(e)), `CLINICAL_DIAGNOSTICS` (Healthcare rules), `MARKETING_LEADS` (Purpose limitation).
  - **Statutory Rules:** `CONSENT_RULES`, `DATA_RIGHTS_RULES`, `SECURITY_RULES`, `CHILD_DATA_RULES`, `SDF_RULES`, `TRANSFER_RULES`, `PENALTY_REFERENCES` (Up to ₹250 Cr for Sec 8(5), Up to ₹200 Cr for Sec 8(6)).
- **Database Model (Photo 2):**
  - **`data_assets`**: `asset_id`, `tenant_id`, `name`, `type`, `classification`, `owner`, `steward`, `retention_days`, `created_at`
- **Implemented API Endpoints:**
  - `POST /api/v1/governance/assets` — Registers data asset, automatically resolving `classification` and `retention_days` from the starter rules based on discovered PII!
  - `GET /api/v1/governance/assets` — Lists all governed data assets
  - `GET /api/v1/governance/assets/:assetId` — Gets details of a specific data asset
  - `GET /api/v1/governance/rules` — Returns complete statutory legal rules catalog

---

## 🛠️ Feature 5: Consent Ledger & Preference Management (Photo 1 & Photo 2: `consent-service · port 9003`) (COMPLETED)
- **Status:** Verified with real Neon PostgreSQL database and full automated test suite
- **Statutory DPDP Guardrails:**
  - **Section 5 (Notice):** Pre-configured multilingual notices in English, Hindi, and Kannada (Eighth Schedule languages).
  - **Section 6 (Valid Consent):** Strict affirmative action enforcement. Inaction, silence, or pre-ticked checkboxes automatically trigger `400 DPDP_SEC_6_VIOLATION`.
  - **Section 6(4) (Withdrawal):** Allows data principals to withdraw consent easily with immediate timestamping.
- **Database Models (Photo 2: `consent-service`):**
  - **`purposes`**: `purpose_id`, `tenant_id`, `name`, `legal_basis` (`DPDPA_SEC_6_CONSENT`), `version`, `description`, `created_at`
  - **`consent_records`**: `record_id`, `tenant_id`, `user_ref` (Phone/Email), `purpose_id`, `status` (`GIVEN`, `WITHDRAWN`), `channel` (`WHATSAPP_YES`, `PAPER_SLIP`, `WEB_PORTAL`, `RECEPTION_DESK`), `notice_language` (`en`, `hi`, `kn`), `captured_at`, `withdrawn_at`
  - **`collection_points`**: `cp_id`, `tenant_id`, `name`, `widget_config` (JSON notice settings & channels)
  - **`preference_centres`**: `pc_id`, `tenant_id`, `name`, `slug`, `config_json` (self-service portal configuration)
- **Implemented API Endpoints:**
  - `POST /api/v1/consent/purposes` — Registers a processing purpose with legal basis
  - `GET /api/v1/consent/purposes` — Lists all registered purposes with active consent counts
  - `POST /api/v1/consent/records` — Records affirmative consent with channel and language
  - `POST /api/v1/consent/records/withdraw` — Immediate consent withdrawal under Section 6(4)
  - `GET /api/v1/consent/records/user/:userRef` — Complete chronological consent ledger for a patient/customer
  - `POST /api/v1/consent/collection-points` — Registers physical desk or web collection points
  - `GET /api/v1/consent/collection-points` — Lists collection points
  - `POST /api/v1/consent/preference-centres` — Creates self-service privacy preference centre
  - `GET /api/v1/consent/preference-centres/:slug` — Returns preference centre config
  - `GET /api/v1/consent/notices` — Multilingual DPDP notices (`?lang=en|hi|kn`)

---

## 🛠️ Feature 6: DataSentinel Web Application (React + Vite + TypeScript + Tailwind CSS) (COMPLETED)
- **Status:** Running live on `http://localhost:3000` with direct Vite proxy to backend API (`http://localhost:5000/api/v1`)
- **Branding:** Exclusively branded as **DataSentinel** (Enterprise Data Governance & DPDP Compliance Platform)
- **Design Philosophy:**
  - Built strictly around senior enterprise design principles: zero generic AI tropes (no purple/pink gradients, no glowing cards, no emojis as icons).
  - High information density with compact table layouts, subtle `1px border border-slate-200`, and tabular numerals (`font-mono`) for counts and penalty liabilities.
  - Distinctive statutory security badges (`RESTRICTED`, `CONFIDENTIAL`, `INTERNAL`, `PUBLIC`) with Lucide icons.
- **Implemented Screens & Direct API Wiring:**
  1. **Executive Overview (`/`):** Summary cards powered by live backend counts from `/api/v1/platform/tenant`, plus the statutory maximum penalty matrix loaded directly from `GET /api/v1/governance/rules`.
  2. **Data Discovery & PII Scanner (`/discovery`):** Real file dropzone connected to `POST /api/v1/discovery/upload`, live table of extracted PII identifiers (`AADHAAR`, `PAN`, `PHONE_NUMBER`, `HEALTH_DATA`), and remediation risk flags (`UNENCRYPTED_CRITICAL_PII`).
  3. **RoPA Data Inventory & Relationship Graph (`/ropa`):** Dual view with compact RoPA table and an interactive **React Flow** pipeline rendered directly from `GET /api/v1/mapping/graph` (`DataSource` ➔ `ProcessingActivity` ➔ `DataElement` ➔ `Storage/WhatsApp` ➔ `Recipients`).
  4. **Statutory Governance & Retention Matrix (`/governance`):** Inventory of governed data assets with auto-resolved classifications and retention schedules (e.g. 2,160 days under CGST Act Section 36), plus legal rules catalog.
  5. **Consent Ledger & Multilingual Notices (`/consent`):** Real-time preview of statutory notices in **English, हिन्दी (Hindi), and ಕನ್ನಡ (Kannada)**, affirmative consent recording with Section 6 guard, and customer consent ledger with one-click withdrawal under Section 6(4).
  6. **Immutable Audit Trail (`/audit`):** Live stream of append-only audit events fetched from the live Neon PostgreSQL database.

---

## 🧪 Running the Full Stack
```bash
# Terminal 1: Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2: DataSentinel Frontend (Port 3000)
cd frontend
npm run dev
```

---

*Updated automatically with every feature built.*


