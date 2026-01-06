# Technical Architecture & Decision Log

## 1. Tech Stack Choices
*   **Frontend:** `React 19` + `Next.js` (App Router recommended for production).
*   **Styling:** `Tailwind CSS` for rapid, consistent UI development.
*   **Icons:** `Lucide React` (clean, accessible SVG icons).
*   **Auth:** `Supabase Auth` (Magic Links for Clients, MFA for Admins).
*   **Storage:** `Supabase Storage` (S3 compatible) with RLS.

## 2. Key Architectural Decisions

### A. The "Gatekeeper" Pattern
**Decision:** We ask for Jurisdiction *first*, before any PII (Personally Identifiable Information) is collected.
**Reasoning:**
1.  **UX:** Don't waste the user's time if we can't help them.
2.  **Liability:** Avoid collecting sensitive data from jurisdictions where the attorney is not licensed.

### B. Authentication Strategy (Dual-Path)
**Decision:** Different security postures for Clients vs. Admins.
*   **Clients (Magic Links):** Lower friction. Clients are infrequent users who often forget passwords. Security risk is isolated to their specific matter.
*   **Admins (MFA Enforced):** High friction, high security. Attorneys have access to *all* client data. We require Password + TOTP (Authenticator App) to prevent breach via credential stuffing.

### C. Secure Document Pipeline
**Decision:** "Attorney Eyes Only" Viewer.
*   **Ingest:** Files are uploaded directly to a private bucket via Signed URLs (simulated in MVP).
*   **View:** The Admin Dashboard does *not* download the file to the attorney's local hard drive by default. It opens a Secure Viewer modal.
*   **Watermarking:** The viewer applies a CSS-based "CONFIDENTIAL" overlay to discourage screen capturing or casual sharing.

### D. Pricing Engine
**Logic:** Client-side calculation for immediate feedback, validated Server-side on submission.
**Formula:** `Total = (Base + (Unit * Complexity_Rate)) * Urgency_Multiplier`
**Reasoning:** Users need to see the price update in real-time as they add "Partners" or "Pages" to feel in control of the cost.

### E. Audit Trails
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

### `documents`
*   `id`: UUID
*   `matter_id`: FK -> matters.id
*   `storage_path`: String (Private Bucket Path)
*   `filename`: String
*   `mime_type`: String

### `audit_logs`
*   `id`: UUID
*   `matter_id`: FK -> matters.id
*   `actor_id`: FK -> users.id
*   `action`: String
*   `timestamp`: ISO8601