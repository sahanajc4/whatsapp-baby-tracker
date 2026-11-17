# Operations Runbook

## 1. Normal operation

Caregivers send one activity per message using a supported phrase. The spreadsheet is the source of truth for recorded activity. Review `Activity_Log` for events and `Daily_Summary` for aggregates.

## 2. First-line diagnostics

| Symptom | Check |
|---|---|
| No row appears in `Webhook_Inbox` | Meta webhook subscription, callback URL, deployment version, Apps Script Executions |
| Inbox says `UNAUTHORISED` | Compare `messages[].from` with `Caregivers.phone_e164`; digits only; enabled must be YES |
| Inbox says `CLARIFICATION` | Use supported syntax; inspect parser output |
| Inbox says `UNSUPPORTED` | Current implementation accepts text only |
| Activity row exists but no WhatsApp reply | Check Meta Graph API status and Apps Script execution logs |
| Duplicate message is ignored | Search `Webhook_Inbox` by message ID |
| Summary totals are wrong | Compare source Activity_Log rows for exact date and activity/type |
| Date differs from caregiver expectation | Check Apps Script project time zone |
| `Missing Script Properties` | Add all required keys from CONFIGURATION.md |

## 3. Apps Script diagnostics

Open Apps Script → **Executions**. Select the relevant execution and inspect status, duration, and logs. The `doPost` function catches processing exceptions and returns `EVENT_RECEIVED`, so a completed HTTP invocation alone is not sufficient evidence of successful processing.

## 4. Meta diagnostics

Check:
- App webhook `messages` field subscription.
- WABA app subscription.
- App mode and Meta's development-mode restrictions.
- WABA `health_status`.
- Message status webhooks and error codes.

Checkpoint observations:
- WABA `status=ACTIVE` did not imply sending was allowed.
- WABA health reported `can_send_message=BLOCKED`.
- Business entity reported `LIMITED` due to business verification not completed.
- Meta outgoing status returned `131031` (`Business Account locked`).
- Payment error `141006` was also reported and described a block on business-initiated conversations.

These are historical checkpoint observations; query Meta again before acting because account health can change.

## 5. Caregiver access management

To disable a caregiver, set `enabled` to `NO`. Do not delete the row unless retention policy permits it. If a caregiver changes phone number, add and verify the new number, then disable the old one. The current code does not implement a separate identity verification workflow.

## 6. Backups and recovery

The current repository does not automate spreadsheet backups. Before code/schema changes:
1. Make a copy of the spreadsheet.
2. Record the current Apps Script deployment version.
3. Commit the current source.
4. Apply one change at a time.
5. Run the smoke tests.
6. Roll back the Web App deployment if required.

Set up periodic Google Sheets backups before using the system as a persistent family log.

## 7. Incident severity

- **P1:** Unauthorized sender can create activity rows, data exposure, token leak. Disable Web App access/deployment and rotate secrets.
- **P2:** Inbound webhook outage or systematic incorrect records. Pause usage, preserve logs, fix and replay only after deduplication review.
- **P3:** Outbound reply failure while inbound records succeed. Continue only if caregivers understand that no acknowledgement is guaranteed; resolve Meta account state.
- **P4:** Parser edge case or dashboard display issue. Use supported message syntax and schedule a fix.
