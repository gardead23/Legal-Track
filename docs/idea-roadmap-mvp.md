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
The current application (`v0.1.5`) is a **High-Fidelity Prototype** with advanced security flows.

### ✅ What Works (Implemented)
*   **Authentication & Access:**
    *   **Dual Auth:** Magic Links for clients, MFA for attorneys.
    *   **Route Guards:** Protected routes for Portals and Dashboards.
*   **Intake & Intelligence:**
    *   **AI Triage:** Google Gemini analyzes user problems and recommends specific services.
    *   **Jurisdiction Gating:** Hard stop for users outside TX, FL, CO.
    *   **Secure File Upload:** Interface for collecting sensitive docs (encrypted storage simulation).
    *   **Conflict Check:** Flags potential ethical conflicts before engagement.
*   **Pricing & Payments:**
    *   **Dynamic Engine:** Calculates Base + Complexity + Rush logic.
    *   **Order Summary:** Real-time cost updates.
*   **Dashboards:**
    *   **Client Portal:** Read-only view of matter status and "Next Steps" guide.
    *   **Attorney Admin:** Kanban-style list, revenue stats, and **Secure Document Viewer**.
*   **Accessibility & UX:**
    *   **WCAG 2.1 Compliance:** Full keyboard navigation support, high-contrast text, and screen-reader optimized forms.

### 🚧 What is Mocked/Pending
*   **Database:** Currently in-memory. Needs migration to Supabase (Postgres).
*   **Payments:** UI shows credit card field, but Stripe is not connected.
*   **Email Delivery:** Magic links are currently simulated (clicked via UI button) rather than sent via SMTP/Resend.

---

## 3. The Roadmap

### Phase 1: Hardening (The Next Sprint)
*   **Infrastructure:** Connect `Supabase` for real data persistence (Schema is ready).
*   **Payments:** Integrate `Stripe Checkout` for real payment processing.
*   **Async Jobs:** Implement `Trigger.dev` or `Inngest` for handling email notifications and file scanning.

### Phase 2: Intelligence & Automation
*   **Fuzzy Conflict Matching:** Upgrade from exact string match to normalized/fuzzy matching (Levenshtein distance) to catch "Evil Corp" vs "Evil Corp, LLC".
*   **Document Generation:** Map intake form fields directly to `.docx` templates.
*   **Mobile App:** React Native wrapper for the client portal.

### Phase 3: Scaling
*   **API for Partners:** Allow other professionals (CPAs) to refer business directly.
*   **Multi-Jurisdiction Expansion:** Logic to easily add NY/CA rulesets.