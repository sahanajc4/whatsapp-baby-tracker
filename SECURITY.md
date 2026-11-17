# Security Policy

## Supported checkpoint

This repository documents a personal-family MVP checkpoint. It is not a hardened public service.

## Reporting

Do not file public issues containing:
- WhatsApp access tokens.
- App secrets or webhook verify tokens.
- Webhook URLs with the `k` secret.
- Spreadsheet IDs where access is sensitive.
- Caregiver phone numbers or baby activity data.

Contact the repository owner privately with a minimal reproduction and redacted logs.

## Known high-priority issue

The current Apps Script webhook does not validate Meta's `X-Hub-Signature-256`. Treat the current webhook URL secret and sender allowlist as compensating controls only, not equivalent signature verification. See `docs/SECURITY.md`.
