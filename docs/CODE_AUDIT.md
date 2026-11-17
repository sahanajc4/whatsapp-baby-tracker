# Code Audit — Checkpoint 0.1.0

## Scope and evidence

Audited source: `src/Code.gs`, copied from the supplied Apps Script source artifact `Pasted text(20261117-060258).txt`. The source in this repository is byte-for-byte identical to the source embedded in the previously generated checkpoint ZIP. The earlier Option C ZIP was also inspected; it contains an earlier 10.6 KB version of the same Apps Script application, while the supplied current source is approximately 19.2 KB and includes caregiver diagnostics and dry-run helpers.

No `.git` directory or prior Git history was present in the supplied working directory. No existing repository history was rewritten or replaced. The Google spreadsheet and deployed Apps Script project are external resources and were not directly accessible for programmatic inspection.

## Implementation inventory

| Area | Actual code | Assessment |
|---|---|---|
| Configuration | `cfg()` reads six Script Properties | Implemented; overly coupled |
| Meta GET verification | `doGet(e)` checks verify token and returns challenge | Implemented in code; live verification handshake not independently re-run in this audit |
| Health endpoint | `doGet` checks `health=1` plus URL secret | Implemented |
| Webhook ingress | `doPost(e)` checks query secret and parses JSON | Implemented; signature validation absent |
| Event dispatch | Processes `entry[].changes[]` with `field=messages` and `value.messages[]` | Implemented |
| Caregiver allowlist | `caregiver_()` compares normalized sender with enabled sheet row | Implemented; real authorization test passed in user logs |
| Duplicate check | `seen_()` scans `Webhook_Inbox` by message ID | Implemented; no end-to-end duplicate test evidence in supplied logs |
| Parser | `parse_()` deterministic regex rules | Implemented; seven sample cases passed in Apps Script dry run and Node regression harness |
| Activity persistence | `Activity_Log.appendRow()` | Implemented; real inbound rows visible in screenshots |
| Inbox persistence | `Webhook_Inbox.appendRow()` | Implemented; two real inbound rows visible in screenshot, later breastfeeding row visible in Activity_Log |
| Daily summary | `summary_()` and `upsert_()` | Implemented; dry-run 06 reported passed by user; not independently executed against Google Sheets |
| Dashboard | `dashboard_()` creates two charts | Partially implemented; function exists, chart creation not visually verified in evidence available |
| Outbound WhatsApp | `send_()` invokes Graph API | Implemented but operationally blocked; Meta returned `131031 Business Account locked` |
| Dry-run utilities | `dryRun01`–`dryRun06` | Present in current source; destructive writes/cleanup require care |

## Code findings

### Critical

1. **Webhook authenticity is not cryptographically verified.** `doPost(e)` checks a query-string secret, but does not validate Meta's `X-Hub-Signature-256`. The Apps Script Web App event interface used here does not expose arbitrary request headers. Do not describe the endpoint as signature-verified.
2. **Webhook errors are acknowledged as success.** `doPost` catches exceptions from event processing, logs them, then returns `EVENT_RECEIVED`. This can prevent Meta from retrying a failed event. The current endpoint does not expose a durable retry mechanism.
3. **Partial-write duplicate risk.** The activity row is appended before the inbox row. If activity append succeeds but inbox append fails, a redelivery can append the activity again because the message ID was not committed to the inbox. Script locking does not make two sheet writes transactional.
4. **`cfg()` couples inbound processing to outbound credentials.** It requires all six properties, including `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`, for GET verification and POST processing. Missing outbound configuration can prevent inbound webhook processing even though inbound logging does not inherently need to send a message.

### High

5. **Outbound delivery result is not persisted.** `send_()` logs non-2xx responses but returns no structured result. Inbox processing statuses such as `RECORDED` do not indicate whether a WhatsApp acknowledgement was delivered.
6. **Invalid clock values silently become current time.** `clock_()` returns current time for hour/minute values outside valid bounds rather than rejecting the message or asking for clarification.
7. **Dry-run 06 cleanup can delete an unrelated summary row.** It deletes any `Daily_Summary` row dated `2099-12-31`, without checking a unique test marker. Its setup checks Activity_Log for the date, but not a pre-existing summary row. Do not rerun the helper without inspecting that date.
8. **Dry-run 05/06 are write operations.** They append test records to the live spreadsheet. They are not isolated unit tests. Dry-run 05 cleanup uses a source-message prefix and TEST status; dry-run 06 cleanup uses test message IDs for Activity_Log but date alone for Daily_Summary.
9. **Dashboard refresh is command-triggered.** The dashboard is rebuilt only on the SUMMARY command path. A new activity does not itself refresh summary/dashboard.
10. **Inbox is used as a deduplication index.** `seen_()` scans a growing sheet range. This can become slow as event volume increases.

### Medium

11. `doPost` assumes `e.parameter`, `e.postData`, `p.entry`, `entry.changes`, and `change.value` have expected shapes; some missing nested values can throw.
12. Non-text messages trigger a send attempt before the inbox row is appended. A send failure may throw before the row is written because `send_()` does not catch `UrlFetchApp.fetch` exceptions.
13. The parser can classify broad text containing keywords as an activity; there is no explicit confidence or ambiguity state beyond `ok=false`.
14. Supplement parsing uses broad keywords (`vitamin`, `supplement`, `medicine`, `medication`, `drops`) and assumes one dose. It does not parse dose amount or units.
15. The `yesterday` token shifts event date even outside the summary command; this is a simple heuristic.
16. `setupBabyTracker()` clears the Dashboard tab with `d.clear()`. Re-running setup can remove existing dashboard content/charts on that tab.
17. `caregiver_()` emits a log line for every caregiver row checked. This is useful during debugging but can create verbose execution logs.
18. `cfg()` returns secrets in an object. Current code does not log the object, but future logging must avoid serializing it.

## Dependencies and runtime

- Runtime: Google Apps Script V8.
- Apps Script services: PropertiesService, ContentService, SpreadsheetApp, LockService, Utilities, Session, Charts, UrlFetchApp, Logger/console.
- External API: Meta Graph API WhatsApp Cloud API.
- Storage: Google Sheets.
- No third-party libraries are imported by `Code.gs`.
- No Python, Docker, Flask/FastAPI, or local database is part of the selected Option C implementation.
- `appsscript.json` declares V8 and `Asia/Kolkata` in this repository; verify the deployed project's actual time zone before relying on date aggregation.
- No package lock is needed because the Node test harness uses only built-in modules.

## Validation performed for this checkpoint

- Static JavaScript syntax check of `Code.gs` via Node after copying to a `.js` temporary file.
- Node parser regression harness: 14 cases against the actual `Code.gs` functions in a mocked Apps Script context.
- No live Apps Script deployment, Meta API call, or Google Sheet write was executed by this audit.
- Historical live integration evidence is summarized separately in `TEST_REPORT.md`.

## Out of scope / not claimed

No load test, security penetration test, Meta signature verification test, Google quota test, backup/restore test, or multi-caregiver concurrency test was performed.

## Checkpoint hygiene adjustment

The three dry-run helpers previously embedded the operator's personal caregiver number. Those test-only literals were replaced with `testSender_()`, which reads the first configured caregiver row and verifies it is enabled. Core webhook, parser, persistence, and summary behaviour was not changed. This avoids publishing personal phone data in the GitHub repository.
