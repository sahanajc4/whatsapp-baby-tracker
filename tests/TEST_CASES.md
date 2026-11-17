# Test Cases

These are manual acceptance cases for the current Apps Script implementation. They are not a standalone automated test runner.

| ID | Category | Input / setup | Expected |
|---|---|---|---|
| AUTH-01 | Authorization | Enabled caregiver number | Caregiver returned |
| AUTH-02 | Authorization | Unknown number | `null`; inbox `UNAUTHORISED` |
| AUTH-03 | Authorization | Caregiver enabled=NO | `null`; inbox `UNAUTHORISED` |
| PARSE-01 | Formula | `90 ml formula at 10:30 AM` | feeding/formula/90/ml/10:30 |
| PARSE-02 | Expressed milk | `60 ml expressed milk` | feeding/expressed_milk/60/ml |
| PARSE-03 | Breastfeeding | `Breastfed left side for 15 minutes` | feeding/breastfeeding/left/15 |
| PARSE-04 | Wet diaper | `Wet diaper` | urine |
| PARSE-05 | Stool | `Baby passed stool` | stool |
| PARSE-06 | Supplement | `Vitamin D given` | supplement, name Vitamin D |
| PARSE-07 | Bath | `Baby had body bath` | bath/body |
| PARSE-08 | Unsupported phrase | `direct feed at 11AM` | Current parser returns clarification |
| PARSE-09 | Missing quantity | `formula` | Clarification |
| PARSE-10 | Zero quantity | `0 ml formula` | Clarification |
| WEB-01 | Duplicate | Same Meta message ID delivered twice | Second processing skipped |
| WEB-02 | Unsupported type | Image/audio event | Inbox `UNSUPPORTED` |
| WEB-03 | Invalid secret | Wrong query parameter `k` | `Forbidden` |
| WEB-04 | Invalid JSON | Malformed request body | `Bad JSON` |
| SUM-01 | Summary | Known rows for one date | Expected aggregate values |
| SUM-02 | Previous day | `SUMMARY YESTERDAY` | Previous date aggregate |
| SEND-01 | Outbound | Send API call | Confirm via Meta status webhook; Apps Script execution alone is insufficient |
