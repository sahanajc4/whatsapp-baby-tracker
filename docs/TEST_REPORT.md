# Test Report — Checkpoint 0.1.0

## A. Tests executed during this repository audit

Execution environment: Node.js 22.16.0; built-in `node:test`; no external packages.

| Test | Result |
|---|---|
| Apps Script source syntax (`node --check` on temporary `.js` copy) | PASS |
| Formula parser | PASS |
| Expressed milk parser | PASS |
| Breastfeeding side/duration parser | PASS |
| Wet diaper parser | PASS |
| Stool parser | PASS |
| Vitamin D supplement parser | PASS |
| Body bath parser | PASS |
| HELP command | PASS |
| SUMMARY YESTERDAY command | PASS |
| Formula without quantity | PASS — clarification expected |
| Zero formula quantity | PASS — clarification expected |
| `direct feed at 11AM` | PASS — current implementation rejects it as unsupported |
| Phone digit normalization | PASS |
| URL-secret equality helper | PASS |
| **Total** | **14 passed, 0 failed** |

Run locally:

```bash
npm test
npm run check:syntax
```

These tests execute the real parser/helper functions from `src/Code.gs` with mocked Apps Script utility functions. They do not validate Google services or Meta integration.

## B. Historical live test evidence from the conversation

The following results are user-reported and supported by execution-log text or spreadsheet screenshots shared during the project. They were not rerun during this repository audit.

| Test | Evidence | Status |
|---|---|---|
| Caregiver authorization | `15550101234` matched enabled row; returned `{name:"Mother"}` | Verified historically |
| Dry-run parser suite | Seven supported examples; total passed 7, failed 0 | Verified historically |
| Dry-run activity writes | Seven test rows written to Activity_Log | Verified historically |
| Dry-run cleanup | Log reported seven Dry-run 05 records deleted | Verified historically |
| Dry-run 06 summary | User reported it worked; cleanup execution shown | Verified historically |
| Real inbound formula | `90 ml formula at 10:30 AM`; Activity_Log row and inbox `RECORDED` shown | Verified historically |
| Real inbound stool | `Poop`; Activity_Log stool row and inbox `RECORDED` shown | Verified historically |
| Real inbound breastfeeding | `Breastfed left side for 15 minutes`; row shows breastfeeding/left/15 | Verified historically |
| Meta outbound message | Status `failed`, error `131031 Business Account locked` | Failed/blocked |
| Meta WABA health | Earlier result showed WABA `BLOCKED`, Business `LIMITED`, App `AVAILABLE`; another response also showed payment error `141006` | Historical account diagnostic |

## C. Not tested / not established

- Actual live `SUMMARY` and `HELP` WhatsApp response delivery.
- Actual acknowledgement delivery after a recorded activity.
- Current Meta account lock/health state.
- Meta webhook signature validation.
- Webhook replay/duplicate behaviour in live Meta delivery.
- Concurrent inbound events.
- Malformed webhook payload handling against deployed Apps Script.
- Dashboard chart visual correctness.
- Google Apps Script quotas and execution limits.
- Backup and restore.
- Mobile/non-text WhatsApp messages.
