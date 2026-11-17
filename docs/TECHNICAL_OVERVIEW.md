# Technical Overview

## 1. Technology choices

| Layer | Technology | Responsibility |
|---|---|---|
| User interface | WhatsApp | Caregiver message input |
| Messaging transport | Meta WhatsApp Cloud API | Inbound webhook and outbound send API |
| Webhook/application runtime | Google Apps Script V8 | Request handling, authorization, parsing, persistence |
| Configuration | Apps Script Script Properties | IDs, tokens, verification values |
| Persistence | Google Sheets | Caregiver allowlist, activity log, inbox, summaries |
| Reporting | Google Sheets charts | Basic dashboard |
| NLP | Deterministic regular expressions | Intent/activity extraction |

## 2. Source layout and function map

The current application is delivered as one Apps Script source file, `src/Code.gs`. The repository preserves the working source rather than claiming a modular implementation that does not yet exist.

| Function | Responsibility |
|---|---|
| `cfg()` | Loads required Script Properties and fails if any are missing |
| `doGet(e)` | Handles Meta webhook verification challenge and a health check |
| `doPost(e)` | Checks URL secret, parses webhook JSON, dispatches `messages` events |
| `setupBabyTracker()` | Creates tabs, headers, formatting, and dashboard title |
| `handle_(m)` | Main message workflow, locking, deduplication, authorization, parsing, writes, reply attempt |
| `parse_(s, now)` | Rule-based parser for activities and commands |
| `clock_(m)` | Converts AM/PM time token to 24-hour time |
| `caregiver_(p)` | Checks phone against enabled caregiver rows |
| `seen_(id)` | Checks `Webhook_Inbox` for an existing message ID |
| `inbox_(id, from, status)` | Appends webhook processing status |
| `summary_(day)` | Aggregates activities for one date |
| `upsert_(day, o)` | Inserts or replaces a daily summary row |
| `dashboard_()` | Rebuilds charts from `Daily_Summary` |
| `summaryText_(d, o)` | Formats summary response |
| `help_()` | Returns supported examples |
| `send_(to, body)` | Calls Meta Graph API to send a text message; logs non-2xx responses but does not return/persist delivery state |
| `digits_(v)` | Removes non-digit characters from phone values |
| `date_(d)` | Formats a date using Apps Script project time zone |
| `eq_(a, b)` | Constant-time-style string comparison for the URL secret |
| `testParser()` | Existing parser smoke test |
| `dryRun01...dryRun06...` | Manual verification helpers added during the checkpoint workflow |

## 3. Message handling logic

1. `doPost(e)` loads configuration.
2. The query parameter `k` must equal `WEBHOOK_URL_SECRET`.
3. The JSON body is parsed.
4. Only changes whose field is `messages` are dispatched.
5. `handle_(m)` obtains a script lock.
6. The message ID is checked against `Webhook_Inbox`.
7. Sender number is normalized to digits only.
8. `caregiver_()` must return an enabled caregiver.
9. Non-text messages are rejected as unsupported.
10. Text is parsed by `parse_()`.
11. Valid activity is appended to `Activity_Log`.
12. The message is recorded in `Webhook_Inbox`.
13. An acknowledgement is attempted through Meta.

The implementation catches processing errors in `doPost` and returns `EVENT_RECEIVED`; operational monitoring must therefore inspect Apps Script executions and sheet state, not only the HTTP response.

## 4. Parser behaviour

### Feeding
- Formula: message must include a positive numeric quantity and `ml`.
- Expressed milk / pumped milk: message must include a positive numeric quantity and `ml`.
- Breastfeeding: message must include at least a side (`left`, `right`, `both`) or a duration in minutes.
- The parser records breastfeeding sessions and duration separately; it does not estimate breastmilk volume.

### Elimination
- Wet diaper / urine / pee / urinated → `urine`.
- Dirty diaper / passed stool / stool / poop / bowel movement → `stool`.

### Other activities
- Vitamin / supplement / medicine / medication / drops → `supplement`.
- Bath → `bath`; bath type is inferred as `both`, `head`, or default `body`.

### Commands
- `HELP`, `/help`, `MENU`
- `SUMMARY`
- `SUMMARY TODAY`
- `SUMMARY YESTERDAY`

### Known parser gaps
- `direct feed at 11AM` is not recognized by the current regex.
- The parser is English-only and phrase/regex based.
- There is no robust ambiguity-resolution dialogue for multiple possible activities in one message.
- No explicit timezone is attached to an event; dates are formatted using the Apps Script project time zone.
- For messages without an explicit time, the parser uses the supplied current time.
- Invalid explicit clock values fall back to current time in `clock_()` rather than returning a clarification.

## 5. Persistence behaviour

`Activity_Log` is append-oriented. `Webhook_Inbox` stores message IDs and processing states and is also used for duplicate detection. `Daily_Summary` stores one aggregate row per date. `Dashboard` is rebuilt from the daily summary table.

Google Sheets is not a transactional database. The script lock serializes executions within the Apps Script project, but multi-sheet operations are not atomic. A failure between writes can leave partial state; see the reliability roadmap.

## 6. Runtime and quotas

The solution runs under Apps Script quotas and Google Sheets API/runtime constraints. Check the current Google Apps Script quotas before increasing caregiver count or message volume. The design is suitable for a small personal/family experiment, not a high-throughput multi-tenant service.
