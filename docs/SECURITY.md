# Security Model and Hardening

## 1. Current controls

- Caregiver allowlist in Google Sheets.
- Sender normalization to digits only.
- `enabled=YES` check.
- URL query secret (`k`) required by `doPost`.
- Meta access token stored in Apps Script Script Properties, not source.
- Script lock around message handling.
- Message ID deduplication using `Webhook_Inbox`.
- HTTPS between Meta and the Apps Script endpoint.

## 2. Critical known gap: webhook signature

The current `doPost(e)` does not validate Meta's `X-Hub-Signature-256` header. The URL query secret is a shared-secret gate but does not prove that a request body was signed by Meta. The caregiver allowlist also does not authenticate the webhook sender as Meta; it only authorizes the WhatsApp sender number contained in the payload.

Apps Script Web App event objects do not expose arbitrary HTTP request headers in the standard `doPost(e)` interface. A hardened design should place a small HTTPS service in front of processing, validate the Meta signature using the app secret and raw request body, then forward verified events to the application.

Do not claim production-grade webhook authenticity until signature verification is implemented and tested.

## 3. Data protection

- Restrict spreadsheet sharing to trusted caregivers/operators.
- Restrict Apps Script project editor access.
- Never expose access tokens, verify tokens, webhook secrets, or spreadsheet IDs unnecessarily.
- Avoid placing secrets in GitHub issues, screenshots, chat logs, or README files.
- Rotate any credential that is exposed.
- Decide retention and deletion rules for baby activity data.
- Do not store unnecessary personal data in `notes` or message text.
- Use a dedicated Google account/project for the tracker if appropriate.

## 4. Abuse and prompt injection

The current parser is deterministic and does not invoke an LLM or execute commands from message text. Therefore, conventional LLM prompt injection is not in scope for this version. However, arbitrary text still enters logs and Sheets; do not evaluate it as code, formula, or HTML. Review formula injection risks if exporting or processing user text elsewhere.

## 5. Privacy and intended use

This project stores sensitive family routine information. Share only with people who need access. It is a convenience log, not a medical record system. Do not use it for emergency care, diagnosis, dosing decisions, or clinical recommendations.

## 6. Minimum hardening before wider use

1. Implement Meta webhook signature verification in a header-capable backend.
2. Separate inbound config validation from outbound send credentials.
3. Use least-privilege Google access and restrict sheet sharing.
4. Add structured logs without logging tokens or unnecessary message content.
5. Add backup, retention, and recovery procedures.
6. Add rate limits and abuse monitoring at the webhook boundary.
7. Test unauthorized sender, duplicate delivery, replay, malformed JSON, and invalid signature.
