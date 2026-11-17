# Configuration Reference

The current `cfg()` function requires all six Script Properties to be present. It throws an error if any are missing.

| Property | Purpose | Example format | Secret? |
|---|---|---|---|
| `SPREADSHEET_ID` | Google spreadsheet identifier | `1AbC...` | Treat as internal |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API bearer token used by `send_()` | `EAA...` | **Yes** |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API phone-number ID | Numeric ID | No, but internal |
| `WHATSAPP_API_VERSION` | Graph API version path segment | `v27.0` (observed in checkpoint) | No |
| `WHATSAPP_VERIFY_TOKEN` | Shared value used for Meta GET webhook verification | Random string | **Yes** |
| `WEBHOOK_URL_SECRET` | Shared query parameter secret checked by `doPost` and health check | Long random string | **Yes** |

## Configuration rules

- Set values under **Apps Script → Project Settings → Script Properties**.
- Never commit real values to Git.
- Rotate access tokens and webhook secrets if exposed.
- Keep the Graph API version current according to Meta's supported versions; `v27.0` is the version shown during the checkpoint, not a promise that it will remain current.
- The Apps Script project time zone controls `date_()` output and therefore the date used for daily aggregation.
- `cfg()` currently requires the outbound access token even when processing inbound messages. This couples inbound operation to outbound configuration; a future refactor should separate inbound and outbound configuration validation.

## Webhook URL format

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?k=WEBHOOK_URL_SECRET
```

The actual secret must not be included in repository documentation, screenshots, or issue reports.
