# Limitations and Roadmap

## Current limitations

1. Single Apps Script file; business logic and transport are not separated.
2. Google Sheets is used as both operational store and reporting store.
3. No Meta webhook signature validation.
4. Outbound WhatsApp delivery is not currently verified; error `131031` was observed.
5. Parser supports a limited set of English patterns.
6. `direct feed at 11AM` was observed not to parse.
7. No explicit confirmation workflow for ambiguous messages.
8. No support for images, audio, voice notes, or interactive WhatsApp buttons.
9. No tenant/family isolation model.
10. No automated CI pipeline or automated Apps Script deployment.
11. No automated backups or retention/archival.
12. No transactional write across Activity_Log and Webhook_Inbox.
13. `seen_()` scans the inbox message ID column and may slow as the sheet grows.
14. `cfg()` requires all properties, including outbound token, for inbound processing.
15. `doPost` catches processing errors and returns `EVENT_RECEIVED`; operators must inspect logs/sheets.
16. The dashboard is a basic chart view, not a polished caregiver UI.

## Recommended enhancement order

### P0 — Preserve checkpoint and prevent data loss
- Commit this repository and tag the working baseline.
- Copy the spreadsheet before schema changes.
- Document current Meta and Apps Script deployment identifiers privately.

### P1 — Correctness and usability
- Expand deterministic parser phrases: `direct feed`, `right breast 10 min`, `both sides`, `pee`, `poop`, and explicit timestamps.
- Reject invalid time values with a clarification rather than silently substituting current time.
- Add parser test cases for boundary conditions and mixed-case text.
- Add a clear response for duplicate events and unsupported input.
- Add `SUMMARY` live test once outbound messaging is available.

### P2 — Security and reliability
- Move webhook ingress to a service that can validate `X-Hub-Signature-256`.
- Separate inbound and outbound configuration.
- Add structured event IDs, correlation IDs, and explicit error status.
- Add a bounded idempotency store and retention strategy.
- Add automated backup and restore test.

### P3 — User experience
- Add WhatsApp interactive list/buttons if supported by Meta account.
- Add caregiver-friendly command help.
- Add summary formatting and per-day activity timeline.
- Add correction/deletion workflow with audit trail.

### P4 — Scale only if required
- Replace Sheets as primary event store with a database.
- Add queue-based asynchronous processing.
- Add tenant boundaries and role-based access control.
- Add metrics, alerting, and operational dashboards.

## Explicit non-goals for the current checkpoint

- AI/LLM-based interpretation.
- Medical recommendations.
- Infant health prediction.
- Multi-tenant SaaS.
- High availability or regulated healthcare compliance.
