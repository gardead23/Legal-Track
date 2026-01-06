# SoloScale Legal - Development Log

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