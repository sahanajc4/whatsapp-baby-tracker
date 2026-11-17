# System Design

## 1. Functional requirements

| ID | Requirement | Current state |
|---|---|---|
| FR-01 | Receive WhatsApp text webhook events | Implemented; real inbound messages verified |
| FR-02 | Authorize sender against caregiver allowlist | Implemented and dry-run verified |
| FR-03 | Record formula and expressed milk quantities | Implemented |
| FR-04 | Record direct breastfeeding side/duration | Implemented for supported phrases |
| FR-05 | Record wet diaper and stool events | Implemented |
| FR-06 | Record supplement and bath events | Implemented |
| FR-07 | Provide HELP command | Implemented |
| FR-08 | Provide daily and previous-day summaries | Implemented in code; live WhatsApp reply delivery not verified |
| FR-09 | Prevent duplicate processing by message ID | Implemented using `Webhook_Inbox` lookup |
| FR-10 | Send acknowledgement/clarification replies | Implemented as API call; Meta account restriction currently affects delivery |

## 2. Non-functional requirements and current assessment

| Area | Desired property | Current assessment |
|---|---|---|
| Security | Only authorized caregivers can log events | Allowlist implemented |
| Webhook authenticity | Verify Meta signature | Not implemented |
| Availability | Receive webhook events reliably | Depends on Meta, Apps Script, Google Sheets |
| Durability | Preserve accepted events | Google Sheets append; no backup automation in code |
| Idempotency | Avoid duplicate event writes | Message ID lookup in inbox |
| Observability | Diagnose processing outcomes | Inbox statuses, Apps Script execution logs |
| Scalability | Handle growing family/team usage | Limited by Sheets and Apps Script |
| Privacy | Restrict access to family activity data | Must be enforced through Google sharing and token handling |
| Maintainability | Test parser and business logic | Manual tests exist; automated CI absent |

## 3. Data flow and ordering

For a valid activity, the current code appends the activity row, appends `RECORDED` to `Webhook_Inbox`, and then attempts the WhatsApp acknowledgement. The order matters: a failed outbound send does not undo the stored activity.

For an unauthorized sender, the code appends `UNAUTHORISED` to `Webhook_Inbox` and does not write an activity row.

For non-text messages, the code appends `UNSUPPORTED` and attempts a response.

For unrecognized/incomplete text, the code attempts a clarification response and appends `CLARIFICATION`.

## 4. Idempotency and concurrency

- `LockService.getScriptLock()` serializes `handle_()` processing.
- `seen_(id)` checks `Webhook_Inbox` for the message ID before processing.
- The inbox is the idempotency ledger.
- The current lookup scans the message ID column using `TextFinder`; it is simple but becomes slower as the inbox grows.
- The lock is released in `finally`.

Recommended future improvement: use a bounded indexed ledger or a backend datastore with a unique constraint on Meta message ID. Add retention/archival policy before the sheet becomes large.

## 5. Failure handling

| Failure | Current behaviour | Operator action |
|---|---|---|
| Missing Script Property | `cfg()` throws | Correct Script Properties |
| Invalid URL secret | `doPost` returns `Forbidden` | Verify callback URL query parameter |
| Invalid JSON | `doPost` returns `Bad JSON` | Inspect webhook request format |
| Unauthorized caregiver | Inbox row `UNAUTHORISED` | Check sender digits and enabled flag |
| Unsupported message type | Inbox row `UNSUPPORTED` | Use text input |
| Parser cannot identify message | Inbox row `CLARIFICATION` | Use supported syntax |
| Google Sheets write error | Caught by outer handler; execution log may show error | Inspect Apps Script execution details |
| Meta send API failure | HTTP response logged by `send_()` | Check Meta account health and API response |
| Duplicate message ID | Processing skipped | Confirm prior inbox row |

## 6. Capacity assumptions

The MVP assumes a small number of caregivers and low message volume. It is not designed for:
- Multiple independent families/tenants.
- Large event histories with frequent full-sheet scans.
- Strict transactional guarantees.
- High availability or disaster recovery.
- Regulated medical record retention.

## 7. Design evolution

A future production-oriented design should introduce:
- A small HTTPS backend that exposes request headers and validates `X-Hub-Signature-256`.
- A durable datastore with unique message ID constraint.
- A queue for asynchronous parsing/replies.
- Structured logs and metrics.
- Automated parser tests and webhook contract tests.
- Backup and retention policies.
- Explicit tenant/family boundaries if multi-family support is introduced.
