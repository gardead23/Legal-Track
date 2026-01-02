# SoloScale Legal: Product Vision & Roadmap

## 1. The Core Concept
**SoloScale Legal** is a "Productized Service" storefront designed for a solo attorney to scale their practice without burning out. It shifts the model from "hourly billing" to "flat-fee deliverables."

### The "Velvet Rope" Logic
Unlike generic contact forms, this app strictly filters clients **before** they reach the attorney. It gates access based on:
1.  **Jurisdiction:** Only accepts TX, FL, and CO.
2.  **Service Match:** Only accepts specific transactional work (LLC, Contract Review, Demand Letters).
3.  **Conflict Check:** Flags potential ethical conflicts before engagement.

### Key Value Props
*   **For the Attorney:** Automates the unbillable triage, intake, and payment collection.
*   **For the Client:** Transparent flat-fee pricing, rapid turnaround options, and a guided "TurboTax-style" experience.

---

## 2. MVP Status (Current Build)
The current application (`v0.1.0`) is a functional **Intake Wizard & Dashboard Prototype**.

### ✅ What Works (Implemented)
*   **Jurisdiction Gating:** Hard stop for users outside TX, FL, CO.
*   **Service Catalog:** Selection between Contract Review, Business Formation, and Demand Letters.
*   **Dynamic Pricing Engine:** 
    *   Calculates Base Price + Complexity Modifiers (Page count, Partner count).
    *   Applies "Rush Fee" logic (1.5x multiplier) for 24h turnaround.
*   **Role-Based Views:**
    *   **Public:** Landing page & Wizard.
    *   **Client Portal:** Status tracking.
    *   **Admin Dashboard:** Kanban-style list of matters with conflict flags.
*   **Mock Backend:** Simulates data persistence, conflict checking against a "blacklist," and audit logging.

### 🚧 What is Mocked/Pending
*   **Database:** Currently in-memory. Needs migration to Supabase (Postgres).
*   **Payments:** UI shows credit card field, but Stripe is not connected.
*   **File Upload:** UI exists, but files are not physically stored in a bucket yet.

---

## 3. The Roadmap

### Phase 1: Hardening (The Next Sprint)
*   **Infrastructure:** Connect `Supabase` for real data persistence.
*   **Storage:** Implement Secure Bucket storage for document uploads.
*   **Payments:** Integrate `Stripe Checkout` for real payment processing.
*   **Async Jobs:** Implement `Trigger.dev` or `Inngest` for handling email notifications and file scanning.

### Phase 2: Intelligence & Automation
*   **Fuzzy Conflict Matching:** Upgrade from exact string match to normalized/fuzzy matching (Levenshtein distance) to catch "Evil Corp" vs "Evil Corp, LLC".
*   **Document Generation:** Map intake form fields directly to `.docx` templates.
*   **Auth:** Implement Magic Links for passwordless client login.

### Phase 3: Scaling
*   **Mobile App:** React Native wrapper for the client portal.
*   **API for Partners:** Allow other professionals (CPAs) to refer business directly.
