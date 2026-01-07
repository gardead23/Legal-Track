# SoloScale Legal - Development Log

## v0.1.8 - Trust & Verification
**Status:** High-Fidelity Prototype
**Focus:** Pre-Signature Review & Data Validation

### 🚀 Features Shipped
*   **Enhanced Review Step:**
    *   **Contextual Summaries:** Added a clear, read-only summary of the selected Service (including description and estimated price) and Contact Information above the Engagement Letter.
    *   **Edit Workflows:** Added specific "Edit" functionality allowing users to jump back to the Contact step to correct PII before signing.
    *   **Visual Hierarchy:** Reorganized Step 5 (Review & Sign) to prioritize "Verify" -> "Read" -> "Sign" flow, reducing anxiety at the point of commitment.

## v0.1.7 - Express Lane & AI Refinement
**Status:** High-Fidelity Prototype
**Focus:** Intake Efficiency & AI Personality

### 🚀 Features Shipped
*   **Express Lane Intake:**
    *   Implemented a "Triage -> Recommendation -> Confirmation" flow.
    *   Users with high-confidence matches can confirm the recommended service immediately, skipping the full catalog browse.
    *   **Smart Catalog:** If users opt to browse all services, the AI-recommended option is pinned to the top with a "Recommended" badge.
*   **GenAI 3.0 Integration:**
    *   Upgraded AI model to **Gemini 3.0 Flash Preview**.
    *   Implemented **Structured Output (JSON Schema)** using the new `@google/genai` SDK to ensure 100% reliable type-safe responses (removing brittle regex parsing).
*   **Prompt Engineering Polish:**
    *   **Tone Shift:** Rewrote system instructions to force "Friendly, confident, non-legalese" output.
    *   **Sanitization:** Explicitly instructed the model to hide internal IDs (e.g., `attorney_review`) and robotic terms in client-facing explanations.
*   **Navigation Guardrails:**
    *   Added `NavConfirmModal`: Intercepts backward navigation requests to warn users that changing previous answers (like Jurisdiction) may invalidate current progress.

## v0.1.6 - UX Copy & Polish
**Status:** High-Fidelity Prototype
**Focus:** Microcopy & Visual Polish

### 🚀 Features Shipped
*   **Triage Assistant UX:**
    *   **Humanized Copy:** Rewrote "AI" references to be more natural ("Our assistant can help recommend the right service").
    *   **Guidance:** Added sentence length hints ("Most people write 2–5 sentences") to reduce user writer's block.
    *   **Visual Polish:** Switched text input backgrounds to white (`bg-white`) across the application for a cleaner aesthetic and better readability compared to the previous gray background.
    *   **Clear Calls to Action:** Renamed buttons to be outcome-focused (e.g., "See recommended services" vs "Analyze Issue", "Choose services manually" vs "Skip").

## v0.1.5 - Accessibility Polish
**Status:** High-Fidelity Prototype (WCAG 2.1 Compliant)
**Focus:** Accessibility (a11y) & Inclusive Design

### 🚀 Features Shipped
*   **WCAG 2.1 Compliance:**
    *   **Semantic HTML:** Replaced interactive `<div>`s with native `<button>` elements throughout the app (Header, Service Cards, Navigation) to ensure full keyboard navigability.
    *   **Color Contrast:** Audited and remediated text colors. Darkened `text-slate-400` to `text-slate-500/600` and `text-brand-600` to `text-brand-700` to consistently meet AA/AAA contrast ratios against light backgrounds.
    *   **Focus Management:** Implemented visible focus rings (`focus:ring-brand-500`) on all interactive elements.
*   **Form Accessibility:**
    *   **Screen Reader Support:** Added explicit `htmlFor` and `id` pairings for all inputs. Added `aria-label` to icon-only buttons.
    *   **Keyboard-Accessible Upload:** Re-engineered the "Drag & Drop" file zone to include a transparent, absolute-positioned input. This allows keyboard users to tab into the drop zone and trigger the system file picker via Space/Enter.
*   **ARIA Enhancements:**
    *   **Live Regions:** Added `aria-live="polite"` to the AI analysis button to ensure screen readers announce "Analyzing..." and results dynamically.
    *   **Modals:** Added `role="dialog"`, `aria-modal="true"`, and proper labelling to the Secure Document Viewer to trap focus and provide context.

## v0.1.4 - AI Intelligence Sprint
**Status:** High-Fidelity Prototype
**Focus:** AI Triage & Service Expansion

### 🚀 Features Shipped
*   **AI Triage Assistant:**
    *   **Integration:** Integrated Google Gemini 2.5 Flash via `@google/genai` SDK.
    *   **Constraint Logic:** System strictly classifies user inputs into 7 allowed legal services or fallback "Attorney Review".
    *   **Safety Rails:** Prompt engineering enforces "No Legal Advice" rules and strictly formatted JSON output.
    *   **UX:** Users describe issues in plain English -> System highlights recommended services with confidence levels.
*   **Service Catalog Expansion:**
    *   Expanded from 3 to **8 tracks** (Contract Review, Demand Letter, Affidavit, Deposition Questionnaire, Motion, Lawsuit Filing, Answer Filing, Attorney Review).
    *   Added metadata for "Complexity" (High/Medium/Low) to inform future pricing logic.
*   **Intake Form Generalization:**
    *   Refactored `DetailsForm` to handle generic litigation inputs (Case Numbers, Court Filings) for the new service tracks.

## v0.1.3 - Technical Foundations
**Status:** High-Fidelity Prototype
**Focus:** Authentication & Data Security

### 🚀 Features Shipped
*   **Authentication System:**
    *   **Unified Login:** Single entry point detecting user role based on email.
    *   **Client Flow (Magic Links):** Implemented passwordless UX where clients enter email -> receive link -> click to auth. (Currently simulated).
    *   **Admin Flow (MFA):** Implemented high-security flow requiring Password + Time-based OTP (Mocked as `123456`).
*   **Secure Document Pipeline:**
    *   **Secure Upload:** Replaced static placeholder with functional file picker in `DetailsForm`.
    *   **Secure Viewer:** Added `SecureDocViewer` modal in Admin Dashboard.
    *   **Watermarking:** Viewer overlays "CONFIDENTIAL // ATTORNEY EYES ONLY" and disables right-click/download triggers to prevent data leakage.
*   **App Logic:**
    *   **Route Guards:** Redirects unauthenticated users from `/admin` or `/portal` to login.
    *   **Global State:** Managed user session persistence within the React app lifecycle.

## v0.1.2 - The Handshake Sprint
**Status:** Functional Prototype (Security Enhanced)
**Focus:** Legal Compliance & Access Control

### 🚀 Features Shipped
*   **Engagement Letter Workflow:**
    *   Added dedicated `EngagementLetter` step to the intake wizard.
    *   Generates a dynamic "Limited Scope Representation Agreement" using the client's name and selected service.
    *   Requires a "Digital Signature" (typing name) and checkbox acknowledgment before payment can proceed.
*   **Security Upgrades:**
    *   **Admin Gate:** Implemented `AdminLogin` component. The dashboard is now protected by a simulated auth check (hardcoded credentials for demo: `admin@soloscale.com`).
    *   **Supabase Schema:** Created `supabase/schema.sql` defining the `profiles`, `matters`, and `audit_logs` tables with Row Level Security (RLS) policies.
*   **Intake Refactor:**
    *   Split the final "Pricing & Review" step into distinct `Contact` -> `Sign` -> `Pay` steps to mirror real legal workflows.

## v0.1.1 - UX Refinements
**Status:** Functional Prototype (Enhanced)
**Focus:** User Trust & Clarity

### 🚀 Features Shipped
*   **Intake Form UX:**
    *   **Contextual Help:** Added a "Why are we asking this?" text trigger and tooltip to the "Opposing Party Name" field.
    *   **Microcopy:** Clarified that opposing party info is strictly for conflict checking and case organization, reinforcing the "no attorney-client relationship" disclaimer.

## v0.1.0 - MVP Prototype (Current Build)
**Status:** Functional Prototype
**Focus:** Core Intake Flow, Pricing Logic, and Compliance Guardrails

### 🚀 Features Shipped
*   **Intake Wizard:**
    *   Implemented "One Thing Per Screen" (OTPS) navigation architecture.
    *   **Jurisdiction Gate:** Implemented strict logic to reject non-TX/FL/CO users immediately before form entry.
    *   **Service Selection:** Enabled 3 distinct tracks (Contract Review, Formation, Demand Letter) with unique form inputs.
*   **Pricing Engine:**
    *   Built real-time React calculator.
    *   Implemented logic: `(Base + (Complexity * Rate)) * RushMultiplier`.
    *   Added visual "Order Summary" card that updates instantly as users toggle options.
*   **Compliance & Safety:**
    *   **Conflict Check:** Added normalized string matching (lowercase + strip punctuation) against a mock "blacklist" to flag high-risk inputs.
    *   **Audit Logging:** System now records `DISCLAIMER_ACCEPTED` and `MATTER_CREATED` events with ISO timestamps.
*   **Dashboards:**
    *   **Client Portal:** Read-only view of matter status and "Next Steps" guide.
    *   **Attorney Admin:** Kanban-style list showing "Conflict Flagged" vs "New" matters, plus simulated revenue stats.

### 🛠 Technical Debt / Shortcuts (To be addressed in Phase 1)
*   **Mock Backend:** Data is currently stored in-memory via the `MockBackend` class. Needs migration to Supabase/Postgres.
*   **Typing:** `DetailsForm` currently uses loose typing for the `data` prop to handle variable schemas. Needs distinct TypeScript interfaces for each Service Track's form data.
*   **Persistence:** Refreshing the browser clears state. LocalStorage or Database persistence is the next step.

---

## v0.0.1 - Inception & Architecture
**Status:** Completed
**Focus:** Spec Definition & Stack Selection

*   **Concept:** Defined "Productized Service" model to replace hourly billing for specific verticals.
*   **Stack Selection:** Chosen React 19, Tailwind CSS, and Lucide Icons for rapid UI development.
*   **Data Modeling:** Designed schema for `matters`, `audit_logs`, and `users` (documented in `technical-architecture.md`).
*   **Philosophy:** Established the "Velvet Rope" architecture (Gate first, collect PII second) to minimize liability.