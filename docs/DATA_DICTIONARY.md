# Data Dictionary

The script defines the following sheet tabs and headers. Do not rename columns without updating the source code.

## Activity_Log

| Column | Field | Meaning |
|---|---|---|
| A | record_id | UUID generated for each activity row |
| B | event_date | Date in Apps Script project time zone (`yyyy-MM-dd`) |
| C | event_time | 24-hour time string (`HH:mm`) |
| D | activity | `feeding`, `urine`, `stool`, `supplement`, `bath` |
| E | feeding_type | `formula`, `expressed_milk`, `breastfeeding` where applicable |
| F | quantity | Numeric volume or dose count where applicable |
| G | unit | `ml` or `dose` where applicable |
| H | side | `left`, `right`, or `both` where parsed |
| I | duration_minutes | Breastfeeding duration |
| J | supplement_name | Parsed supplement/medicine name |
| K | bath_type | `body`, `head`, or `both` |
| L | caregiver_name | Name from caregiver allowlist |
| M | caregiver_phone | Normalized sender number, digits only |
| N | source_message_id | Meta WhatsApp message ID |
| O | original_message | Original message body |
| P | created_at | Apps Script timestamp |
| Q | status | `RECORDED` in normal activity path; test rows may use `TEST` |

## Caregivers

| Column | Field | Meaning |
|---|---|---|
| A | phone_e164 | International number, digits only |
| B | caregiver_name | Display name |
| C | role | Informational role |
| D | enabled | `YES` or `NO` |
| E | notes | Free-form administrative note |

## Daily_Summary

| Column | Field | Meaning |
|---|---|---|
| A | event_date | Summary date |
| B | formula_ml | Sum of formula quantity |
| C | expressed_milk_ml | Sum of expressed milk quantity |
| D | breastfeeding_sessions | Count of breastfeeding events |
| E | breastfeeding_minutes | Sum of recorded breastfeeding minutes |
| F | wet_diapers | Count of urine events |
| G | dirty_diapers | Count of stool events |
| H | supplement_doses | Count of supplement events |
| I | baths | Count of bath events |

## Webhook_Inbox

| Column | Field | Meaning |
|---|---|---|
| A | message_id | Meta message ID used for deduplication |
| B | received_at | Apps Script timestamp |
| C | sender | Normalized sender number |
| D | processing_status | `RECORDED`, `UNAUTHORISED`, `UNSUPPORTED`, `CLARIFICATION`, `HELP`, `SUMMARY` |

## Dashboard

The setup function creates a title and explanatory note. The dashboard function removes existing charts and recreates charts based on `Daily_Summary`.
