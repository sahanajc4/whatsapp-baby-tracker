# Testing and Verification

## 1. Verified checkpoint tests

The following were executed during the working MVP checkpoint on 17 November 2026. Current source includes additional parser and dry-run helpers; the repository audit's independent Node tests are reported in `TEST_REPORT.md`.

| Test | Evidence/result | Status |
|---|---|---|
| Spreadsheet structure | Required tabs present during setup workflow | Verify again on target copy |
| Caregiver authorization | `15550101234` matched enabled row; result `Mother` | PASS |
| Parser: formula | `90 ml formula at 10:30 AM` → formula, 90 ml, 10:30 | PASS |
| Parser: expressed milk | `60 ml expressed milk` → expressed_milk, 60 ml | PASS |
| Parser: breastfeeding | `Breastfed left side for 15 minutes` → left, 15 min | PASS |
| Parser: wet diaper | `Wet diaper` → urine | PASS |
| Parser: stool | `Baby passed stool` → stool | PASS |
| Parser: supplement | `Vitamin D given` → supplement | PASS |
| Parser: bath | `Baby had body bath` → bath/body | PASS |
| Activity write | Seven marked test records written to Activity_Log | PASS |
| Activity cleanup | Seven Dry-run 05 rows deleted | PASS |
| Daily aggregation | Eight metrics matched expected values in Dry-run 06 | PASS |
| Daily aggregation cleanup | User reported Dry-run 06 cleanup completed | PASS |
| Real inbound formula | WhatsApp message recorded in Activity_Log and Webhook_Inbox | PASS |
| Real inbound stool | `Poop` recorded as stool | PASS |
| Real inbound breastfeeding | `Breastfed left side for 15 minutes` recorded with side and duration | PASS |
| Outbound acknowledgement | Meta status failed with error `131031` | BLOCKED |
| Webhook signature validation | Not implemented | NOT IMPLEMENTED |

## 2. Manual smoke test

### Positive tests

| Input | Expected |
|---|---|
| `90 ml formula at 10:30 AM` | Feeding/formula/90/ml/10:30 |
| `60 ml expressed milk` | Feeding/expressed_milk/60/ml |
| `Breastfed left side for 15 minutes` | Feeding/breastfeeding/left/15 |
| `Wet diaper` | Activity urine |
| `Baby passed stool` | Activity stool |
| `Vitamin D given` | Activity supplement, name Vitamin D |
| `Baby had body bath` | Activity bath, body |
| `HELP` | Webhook inbox HELP; reply attempt |
| `SUMMARY` | Summary generated for current date; reply attempt |
| `SUMMARY YESTERDAY` | Summary generated for prior date; reply attempt |

### Negative/edge tests

| Input/condition | Expected current behaviour |
|---|---|
| Sender not in allowlist | `UNAUTHORISED`; no Activity_Log row |
| Caregiver `enabled=NO` | `UNAUTHORISED` |
| Image/audio message | `UNSUPPORTED` |
| `formula` without quantity | `CLARIFICATION` |
| `0 ml formula` | `CLARIFICATION` |
| Unknown text | `CLARIFICATION` |
| Duplicate Meta message ID | Skip processing |
| `direct feed at 11AM` | Current parser does not recognize it; clarification |
| Invalid explicit time | Current `clock_()` falls back to current time; this needs improvement |

## 3. Dry-run functions

The working script included manual functions:
- `dryRun01Spreadsheet()`
- `dryRun02Caregivers()`
- `dryRun03Authorization()`
- `dryRun04MessageParsing()`
- `dryRun05ActivityLogging()`
- `dryRun05Cleanup()`
- `dryRun06DailySummary()`
- `dryRun06Cleanup()`

Some test functions were added during the interactive checkpoint and may be present at the end of the current Apps Script file. Review them before committing. Dry-run 05 and 06 write temporary rows and require cleanup. Do not run against a production spreadsheet without a backup.

## 4. Test execution procedure

1. Select the desired function in the Apps Script editor function dropdown.
2. Click **Run**.
3. Open **Execution log**.
4. Inspect `Logger.log` output and exceptions.
5. Inspect the relevant Google Sheets tab independently.
6. Record evidence in a GitHub issue or release note.

## 5. Acceptance criteria for the next checkpoint

- Supported message is recorded exactly once.
- Sender must be enabled.
- Event date/time match the configured project time zone.
- `Activity_Log` and `Webhook_Inbox` contain the same Meta message ID.
- Summary totals match the source activity rows.
- Outbound delivery is independently confirmed by Meta status, not inferred from a successful Apps Script execution.
- Unauthorized and malformed inputs do not create activity rows.
