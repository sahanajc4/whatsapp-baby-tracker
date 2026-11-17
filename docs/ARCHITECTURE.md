# Architecture

## 1. Purpose and scope

The MVP provides a low-cost, WhatsApp-first interface for caregivers to record baby-care events. Google Apps Script hosts the webhook handler and business logic. Google Sheets stores the event log and daily aggregates.

The system is intentionally small:
- No standalone server.
- No container runtime.
- No database service other than Google Sheets.
- No LLM or external NLP service.
- No background worker or message broker.

## 2. Context diagram

```mermaid
flowchart TB
    caregiver[Caregiver using WhatsApp]
    meta[Meta WhatsApp Cloud API]
    gas[Google Apps Script Web App]
    sheets[(Google Sheets)]
    caregiver -->|Text message| meta
    meta -->|messages webhook| gas
    gas -->|Read allowlist / write events / summaries| sheets
    gas -->|Send text response attempt| meta
    meta -->|Reply delivery status webhook| gas
```

## 3. Container/component diagram

```mermaid
flowchart TB
    subgraph Meta["Meta platform"]
      WA[WhatsApp client]
      Cloud[WhatsApp Cloud API]
      WABA[WhatsApp Business Account]
      WA <--> Cloud
      Cloud --- WABA
    end

    subgraph Google["Google Workspace"]
      WebApp["Apps Script Web App\n doGet / doPost"]
      Config["Script Properties\n tokens and IDs"]
      Handler["handle_(message)"]
      Auth["caregiver_()"]
      Parser["parse_(text, now)"]
      Dedup["seen_()"]
      Inbox["inbox_()"]
      Activity["Activity_Log"]
      Caregivers["Caregivers"]
      Summary["summary_() / upsert_()"]
      Daily["Daily_Summary"]
      Dashboard["dashboard_()"]
      DashTab["Dashboard"]
      WebApp --> Config
      WebApp --> Handler
      Handler --> Dedup
      Handler --> Auth
      Auth --> Caregivers
      Handler --> Parser
      Handler --> Inbox
      Handler --> Activity
      Handler --> Summary
      Summary --> Daily
      Summary --> Dashboard
      Dashboard --> DashTab
    end

    WA --> Cloud
    Cloud -->|Inbound webhook| WebApp
    Handler -->|Graph API send attempt| Cloud
```

## 4. Inbound message sequence

```mermaid
sequenceDiagram
    participant C as Caregiver
    participant W as WhatsApp / Meta
    participant G as Apps Script doPost
    participant H as handle_()
    participant S as Google Sheets

    C->>W: Send text message
    W->>G: POST webhook (messages)
    G->>G: Check query parameter k against WEBHOOK_URL_SECRET
    G->>G: Parse JSON payload
    G->>H: handle_(message)
    H->>H: Extract message ID and sender
    H->>S: Check Webhook_Inbox for duplicate message ID
    alt Duplicate message
      H-->>G: Return without processing
    else New message
      H->>S: Read Caregivers allowlist
      alt Sender not enabled
        H->>S: Append UNAUTHORISED to Webhook_Inbox
      else Sender enabled
        H->>H: Require text message
        H->>H: parse_(body, current time)
        alt HELP / SUMMARY command
          H->>S: Read/write summary data as needed
          H->>W: Attempt text response
          H->>S: Append command status to Webhook_Inbox
        else Valid activity
          H->>S: Append activity row
          H->>S: Append RECORDED to Webhook_Inbox
          H->>W: Attempt acknowledgement
        else Unrecognized or incomplete text
          H->>W: Attempt clarification response
          H->>S: Append CLARIFICATION to Webhook_Inbox
        end
      end
    end
```

## 5. Outbound message sequence

The code calls the Graph API `/messages` endpoint using `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. HTTP errors are logged with `console.error`; they are not converted into a successful delivery guarantee.

```mermaid
sequenceDiagram
    participant G as Apps Script send_()
    participant M as Meta Graph API
    participant C as Caregiver WhatsApp
    G->>M: POST /{phone-number-id}/messages
    M-->>G: HTTP response
    M-->>G: Later delivery-status webhook (if emitted)
    M->>C: Deliver message only if Meta permits it
```

Current observed limitation: Meta returned status `failed` with error `131031` (`Business Account locked`). Therefore, inbound event recording and outbound reply delivery are separate acceptance criteria.

## 6. Trust boundaries

| Boundary | Data crossing it | Current control | Gap |
|---|---|---|---|
| Caregiver → Meta | WhatsApp message | WhatsApp account access | Caregiver identity is represented by sender number |
| Meta → Apps Script | Webhook JSON | URL query secret | No `X-Hub-Signature-256` verification |
| Apps Script → Sheets | Personal activity data | Google account permissions | Spreadsheet sharing and Apps Script ownership must be restricted |
| Apps Script → Meta | Access token and message payload | Script Properties; HTTPS | Token lifecycle and Meta account restrictions |
| Caregiver → application logic | Sender number and message body | Allowlist with enabled flag | Number recycling / lost-device processes are not implemented |

## 7. Deployment topology

One Apps Script project is deployed as a Web App. Its script properties contain the spreadsheet ID, Meta identifiers, token, verify token, and URL secret. The Web App accesses the spreadsheet using the deploying user's authority.

There is no separate staging environment in the current deployment. Use a separate spreadsheet and separate Apps Script deployment for experiments that could write to live family records.
