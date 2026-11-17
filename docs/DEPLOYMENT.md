# Deployment Guide

This guide deploys the current Apps Script implementation. Menu labels may change in Google's UI.

## 1. Create the spreadsheet

Create a Google spreadsheet, for example `Baby Activity Tracker`. Copy its spreadsheet ID from the URL. The ID is the value between `/d/` and `/edit`.

The `setupBabyTracker()` function creates or validates:
- `Activity_Log`
- `Caregivers`
- `Daily_Summary`
- `Webhook_Inbox`
- `Dashboard`

The script expects these tab names and header layouts exactly.

## 2. Create the Apps Script project

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor contents with `src/Code.gs`.
4. Save the project.
5. Set the Apps Script project time zone to the intended caregiver local time zone. For an India-based deployment, `Asia/Kolkata` is the likely setting; confirm before use.
6. Run `setupBabyTracker()` once.
7. Review and grant the requested Google permissions.

Do not run the dry-run write tests against a production family spreadsheet without understanding that they create and delete rows.

## 3. Configure Script Properties

In Apps Script, open **Project Settings → Script Properties** and create the keys listed in [CONFIGURATION.md](CONFIGURATION.md).

Do not paste tokens into source code. Do not commit Script Properties, access tokens, verify tokens, or webhook secrets to Git.

## 4. Populate caregivers

In the `Caregivers` tab, preserve the header row:

| phone_e164 | caregiver_name | role | enabled | notes |
|---|---|---|---|---|
| 15550101234 | Mother | Parent | YES | Example |
| 15550101235 | Father | Parent | YES | Example |

Rules:
- Use country code plus national number, digits only.
- Do not include `+`, spaces, dashes, or brackets.
- `enabled` must be `YES` (case-insensitive after trimming).
- Only add caregivers who are permitted to access the tracker.
- Remove access by changing `enabled` to `NO`.

## 5. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. Set **Execute as** to the project owner (Me).
4. Set access so Meta can invoke the endpoint. A public webhook endpoint is exposed to the internet; compensate with a strong random URL secret and the caregiver allowlist, and understand that this is not a substitute for Meta signature verification.
5. Deploy and copy the `/exec` URL.
6. For code changes, create a new deployment version or update the existing deployment to a new version. Saving editor code alone does not update an existing deployed version.

## 6. Configure Meta webhook

In the Meta Developer dashboard:
1. Open the app and WhatsApp Business Account use case.
2. Configure the callback URL to the deployed Apps Script URL with the `k` query parameter set to the `WEBHOOK_URL_SECRET`.
3. Enter the same `WHATSAPP_VERIFY_TOKEN` value in the Verify Token field.
4. Complete Meta's GET verification handshake.
5. Subscribe the `messages` field.
6. Ensure the WABA is subscribed to the app (`/{WABA_ID}/subscribed_apps`) where required.

Do not share the callback URL with its secret in screenshots, tickets, or public repositories.

## 7. Smoke test

1. Confirm the sender is enabled in `Caregivers`.
2. Send `90 ml formula at 10:30 AM` from that WhatsApp number to the configured business/test number.
3. Open `Activity_Log`. Confirm a new row with `activity=feeding`, `feeding_type=formula`, `quantity=90`, `unit=ml`, caregiver identity, and source message ID.
4. Open `Webhook_Inbox`. Confirm the same message ID and `processing_status=RECORDED`.
5. Send `Breastfed left side for 15 minutes` and verify side/duration fields.
6. Check Apps Script **Executions** for runtime errors.
7. Do not treat a missing WhatsApp acknowledgement as proof that inbound recording failed; inspect the sheet and Meta status separately.

## 8. Rollback

Apps Script deployments are versioned. If a new version causes a regression:
1. Open **Deploy → Manage deployments**.
2. Edit the Web App deployment.
3. Select the last known-good version.
4. Deploy the rollback.
5. Re-run the smoke test.

Keep a copy of the spreadsheet before destructive schema changes.
