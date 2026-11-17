# Contributing

Thank you for improving the WhatsApp Baby Tracker. The repository is a checkpoint of a working personal-family MVP. Prefer small, reviewable changes that preserve the verified inbound path.

## 1. Working agreement

- Do not commit secrets, access tokens, webhook URLs containing secrets, spreadsheet IDs, or personal activity exports.
- Do not change sheet names or header order without updating the data dictionary and migration instructions.
- Do not change parser semantics without adding test cases.
- Keep inbound recording independent from outbound acknowledgement success.
- Preserve the caregiver allowlist.
- Never disable authorization to make a test pass.
- Avoid adding an LLM unless there is a separately reviewed requirement and a safe evaluation plan.

## 2. Branch and commit conventions

Branch examples:
- `feat/parser-direct-feed`
- `fix/invalid-time-validation`
- `docs/webhook-security`
- `test/duplicate-delivery`

Use conventional commit prefixes:
- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `chore:`
- `security:`

Examples:
```text
feat: recognize direct breastfeeding phrases
fix: reject invalid clock values
test: cover duplicate webhook delivery
docs: explain Meta signature validation gap
```

## 3. Coding standards

- Use descriptive function and variable names.
- Keep functions focused on one responsibility.
- Avoid hidden side effects in parser functions.
- Keep parsing deterministic and testable.
- Validate and normalize external input at boundaries.
- Use constants for sheet names and header definitions.
- Do not hard-code credentials or personal phone numbers in production functions.
- Keep log output useful but free of secrets.
- Use `try/finally` for lock release and resource cleanup.
- Preserve idempotency on Meta message ID.
- Handle missing sheets/properties with explicit errors.
- Do not silently coerce invalid user input into a different event.

## 4. Change workflow

1. Create a feature branch.
2. Read `docs/TECHNICAL_OVERVIEW.md` and `docs/SYSTEM_DESIGN.md`.
3. Make one logical change.
4. Add or update tests in `docs/TESTING.md` and `tests/TEST_CASES.md`.
5. Run parser dry runs.
6. Use a copied spreadsheet for tests that write data.
7. Verify `Activity_Log` and `Webhook_Inbox`.
8. Verify no test records remain.
9. Update documentation and changelog.
10. Submit a pull request with test evidence and rollback notes.

## 5. Pull request checklist

- [ ] No secrets or personal data committed.
- [ ] Existing supported message examples still work.
- [ ] New parser behaviour has positive and negative tests.
- [ ] Unauthorized senders remain blocked.
- [ ] Duplicate message IDs remain idempotent.
- [ ] Sheet schema changes are documented.
- [ ] Failure modes and rollback are documented.
- [ ] README and changelog are updated.
- [ ] Outbound API failure does not silently erase an inbound activity.

## 6. Reporting security issues

Do not publish credentials or sensitive family data in an issue. Follow `SECURITY.md` and report privately to the repository owner.
