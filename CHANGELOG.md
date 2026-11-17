# Changelog

## 0.1.0-mvp-checkpoint — 2026-11-17

- Captured working Meta WhatsApp Cloud API → Apps Script → Google Sheets inbound flow.
- Documented caregiver allowlist and rule-based activity parser.
- Documented Activity_Log, Caregivers, Daily_Summary, Dashboard, and Webhook_Inbox schemas.
- Recorded dry-run verification of authorization, parser examples, activity writes, and daily aggregation.
- Recorded real inbound formula, stool, and breastfeeding messages.
- Documented Meta outbound error `131031` and webhook signature validation limitation.
- Added architecture, system design, deployment, configuration, testing, security, and operations documentation.

- Replaced hard-coded caregiver test phone values in dry-run helpers with a lookup from the first Caregivers row to prevent personal data entering source control.
