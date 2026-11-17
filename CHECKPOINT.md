# MVP Checkpoint

**Checkpoint date:** 2026-11-17  
**Version label:** `v0.1.0-mvp-checkpoint`

## Verified
- Real inbound WhatsApp message reached Apps Script and Google Sheets.
- Formula message recorded.
- Stool message recorded.
- Breastfeeding message recorded with left side and 15-minute duration.
- Caregiver allowlist test passed.
- Seven parser examples passed in dry-run.
- Seven activity test records written and cleaned up.
- Daily summary aggregation dry-run passed and test data was cleaned up.

## Not verified / known blocked
- Outbound WhatsApp acknowledgement delivery: Meta returned `131031 Business Account locked`.
- Meta webhook signature validation: not implemented.
- Live `SUMMARY` response delivery: not verified.
- Natural phrase `direct feed at 11AM`: not supported by current parser.

## Preserve before enhancements
1. Commit the repository.
2. Tag `v0.1.0-mvp-checkpoint`.
3. Copy the Google Sheet.
4. Record the current Apps Script deployment version privately.
5. Make enhancements on feature branches.
