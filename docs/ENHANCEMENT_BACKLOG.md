# Prioritized Enhancement Backlog

This backlog records corrective and hardening work. It does not change the checkpoint implementation.

## P0 — Protect current operation

### BT-001: Preserve deployment and spreadsheet baseline
- **Objective:** Make rollback deterministic.
- **Dependencies:** None.
- **Acceptance:** Spreadsheet copy exists; deployed Apps Script version is recorded privately; Git checkpoint tag exists; smoke test evidence is retained.

### BT-002: Separate inbound and outbound configuration
- **Objective:** Avoid requiring outbound credentials for inbound webhook verification/recording.
- **Dependencies:** None.
- **Acceptance:** GET verification and inbound processing work when only inbound-required properties are present; send path fails explicitly if outbound config is missing; no secrets appear in logs.

## P1 — Correctness and webhook reliability

### BT-010: Persist processing outcome safely
- **Objective:** Prevent partial writes from creating duplicate activities on webhook redelivery.
- **Dependencies:** Decide write ordering and idempotency ledger semantics.
- **Acceptance:** Fault-injection tests simulate Activity_Log success followed by inbox failure; redelivery does not create a second activity; each message ID has an inspectable terminal state.

### BT-011: Stop acknowledging failed webhook processing as successful
- **Objective:** Make failure semantics explicit and align retry behaviour with the ingress platform.
- **Dependencies:** Confirm Meta webhook retry expectations and Apps Script response behaviour.
- **Acceptance:** Processing exceptions are observable; failed events are not silently reported as successful; retry/reconciliation strategy is documented and tested.

### BT-012: Validate event payload shape
- **Objective:** Handle missing or malformed `entry`, `changes`, `value`, `messages`, and message fields safely.
- **Dependencies:** None.
- **Acceptance:** Contract tests cover malformed JSON, empty arrays, status-only events, missing IDs, missing sender, and unexpected message types.

### BT-013: Strict time and quantity validation
- **Objective:** Reject invalid times and invalid quantities rather than silently coercing them.
- **Dependencies:** Define accepted time syntax.
- **Acceptance:** `13:70 PM`, `0:10 AM`, negative values, zero values, and unsupported time formats return a clarification; no invalid record is written.

### BT-014: Add regression coverage for all parser branches
- **Objective:** Make rule changes safe.
- **Dependencies:** None.
- **Acceptance:** Tests cover formula, expressed milk, breastfeeding, urine, stool, supplement, bath, help, summary, yesterday, ambiguous text, invalid inputs, and case/spacing variants.

## P2 — Security

### BT-020: Add Meta webhook signature verification
- **Objective:** Verify `X-Hub-Signature-256` against the raw request body and Meta app secret.
- **Dependencies:** Select a header-capable ingress runtime; Apps Script Web App does not expose the required request headers in this implementation.
- **Acceptance:** Valid signature accepted; invalid/missing signature rejected; replay handling documented; app secret stored in managed secret storage.

### BT-021: Review public endpoint and access policy
- **Objective:** Minimize exposure of the Web App endpoint.
- **Dependencies:** BT-020 or documented compensating control.
- **Acceptance:** Deployment access, URL secret rotation, rate limiting, and incident revocation are documented and tested.

### BT-022: Data access and retention policy
- **Objective:** Protect family activity data.
- **Dependencies:** Agree authorized users and retention needs.
- **Acceptance:** Spreadsheet sharing is least-privilege; retention/deletion and backup ownership documented.

## P3 — Outbound messaging and operations

### BT-030: Restore and verify Meta outbound messaging
- **Objective:** Resolve the observed Meta account lock and confirm actual reply delivery.
- **Dependencies:** Meta account health/restriction resolution; do not bypass platform controls.
- **Acceptance:** Graph API send returns success; status webhook reaches `sent` and `delivered`; errors are persisted with message correlation ID.

### BT-031: Persist outbound delivery state
- **Objective:** Distinguish inbound `RECORDED` from reply `SENT`/`FAILED`/`DELIVERED`.
- **Dependencies:** BT-030.
- **Acceptance:** Each inbound message can be correlated with outbound API result and status events.

### BT-032: Dashboard verification and refresh
- **Objective:** Confirm charts reflect daily summary rows and refresh predictably.
- **Dependencies:** Existing summary flow.
- **Acceptance:** Chart output checked against known fixture data; refresh policy documented; setup does not erase unrelated dashboard content.

### BT-033: Backup and restore
- **Objective:** Recover from accidental sheet deletion or corruption.
- **Dependencies:** Choose backup location and retention.
- **Acceptance:** Scheduled backup exists; restore procedure tested on a copy.

## P4 — Parser usability (only after checkpoint)

### BT-040: Add natural language variants
- **Objective:** Recognize phrases such as `direct feed at 11AM`.
- **Dependencies:** Parser tests BT-014.
- **Acceptance:** Each supported phrase has positive and negative tests; no false classification of unrelated messages.

### BT-041: Add message correction workflow
- **Objective:** Correct mistaken entries with auditability.
- **Dependencies:** Stable event IDs and authorization model.
- **Acceptance:** Only authorized caregiver can correct/delete; original and corrected values are auditable.

## P5 — Scale only if requirements change

### BT-050: Evaluate datastore and queue migration
- **Objective:** Replace Sheets as primary store if volume/reliability needs exceed its fit.
- **Dependencies:** Measured volume and explicit operational requirements.
- **Acceptance:** Migration proposal includes cost, recovery, idempotency, data export, and rollback; no migration without measured need.
