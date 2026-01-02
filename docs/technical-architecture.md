# Technical Architecture & Decision Log

## 1. Tech Stack Choices
*   **Frontend:** `React 19` + `Next.js` (App Router recommended for production).
*   **Styling:** `Tailwind CSS` for rapid, consistent UI development.
*   **Icons:** `Lucide React` (clean, accessible SVG icons).
*   **State Management:** React `useState` / `Context` (sufficient for wizard flow).

## 2. Key Architectural Decisions

### A. The "Gatekeeper" Pattern
**Decision:** We ask for Jurisdiction *first*, before any PII (Personally Identifiable Information) is collected.
**Reasoning:**
1.  **UX:** Don't waste the user's time if we can't help them.
2.  **Liability:** Avoid collecting sensitive data from jurisdictions where the attorney is not licensed.

### B. Conflict Checking Strategy
**MVP Approach:** Normalized String Matching.
*   *Mechanism:* Lowercase + strip punctuation. Compare input against a blacklist.
*   *Output:* "Flagged for Review" vs "Clear".
*   *Why:* Fast to implement, catches 80% of obvious conflicts.
*   *Future V2:* Vector search or Trigram similarity to catch typos and aliases.

### C. Pricing Engine
**Logic:** Client-side calculation for immediate feedback, validated Server-side on submission.
**Formula:** `Total = (Base + (Unit * Complexity_Rate)) * Urgency_Multiplier`
**Reasoning:** Users need to see the price update in real-time as they add "Partners" or "Pages" to feel in control of the cost.

### D. Audit Trails
**Decision:** Every significant action (Disclaimer Acceptance, Form Submission, Status Change) generates an `AuditEvent` object.
**Reasoning:** In legal tech, the "system of record" is the defense against malpractice claims. We must prove *when* a user accepted the "Limited Scope" agreement.

## 3. Data Model (Planned Schema)

### `users`
*   `id`: UUID
*   `email`: String (Unique)
*   `role`: Enum ('client', 'admin')

### `matters`
*   `id`: UUID
*   `user_id`: FK -> users.id
*   `service_type`: Enum
*   `status`: Enum ('new', 'reviewing', 'flagged', 'closed')
*   `jurisdiction`: String
*   `urgency`: Enum ('standard', 'rush')
*   `price_total`: Integer (cents)

### `intake_details` (JSONB)
*   Stores the flexible form data specific to the service type (e.g., `partner_count` for LLCs, `page_count` for reviews).

### `audit_logs`
*   `id`: UUID
*   `matter_id`: FK -> matters.id
*   `actor_id`: FK -> users.id
*   `action`: String
*   `timestamp`: ISO8601
