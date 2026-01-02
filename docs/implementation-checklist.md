# Build Plan Approval Checklist

Before writing production backend code, confirm the following:

- [ ] **Jurisdictions:** Confirmed TX, FL, CO are the only initial states.
- [ ] **Payment Flow:** Funds are authorized on checkout but captured only after Attorney accepts the matter (or captured immediately into Operating vs Trust account depending on specific State Bar rules).
- [ ] **Document Storage:** Files must be stored in private buckets with signed URLs. Public access strictly disabled.
- [ ] **Email Provider:** Decide between Resend (Dev experience) or SendGrid (Enterprise features).
- [ ] **Async Worker:** Confirm if `Supabase Edge Functions` are sufficient or if a dedicated queue (Trigger.dev) is needed for heavy document processing.
