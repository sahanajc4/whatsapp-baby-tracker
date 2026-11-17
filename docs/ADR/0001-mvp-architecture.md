# ADR 0001: WhatsApp + Apps Script + Google Sheets MVP

- **Status:** Accepted for learning/personal-family MVP
- **Date:** 2026-11-17

## Context

The goal was to build a low-cost WhatsApp-first baby activity tracker with minimal infrastructure and a short path to a real end-to-end experiment. The user selected Meta WhatsApp Cloud API, Google Apps Script Web App, and Google Sheets. A rule-based parser was preferred over an LLM.

## Decision

Use:
- WhatsApp as caregiver input channel.
- Meta Cloud API for message transport.
- Google Apps Script as webhook runtime and application logic.
- Google Sheets as persistence and reporting.
- Deterministic regular expressions for parsing.

## Consequences

### Positive
- Low infrastructure footprint.
- No server/container management.
- Familiar spreadsheet interface.
- Rapid experimentation.
- Real inbound WhatsApp-to-Sheets path verified.

### Negative
- Limited request-header access prevents standard Meta signature validation in the current Apps Script handler.
- Apps Script and Sheets quotas constrain throughput.
- Sheets is not transactional.
- Parser is limited and English-only.
- Outbound messaging is subject to Meta account health and was blocked during the checkpoint.
- Single-file source is harder to test and maintain.

## Revisit when

- More than a small caregiver group uses the tracker.
- Strong webhook authenticity is required.
- Event volume or latency exceeds Apps Script/Sheets suitability.
- Reliable outbound messaging and delivery tracking become required.
