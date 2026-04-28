# Field Ledger Phase Plans

These plans are intended to be sliced with `to-issues`, then implemented with `field-ledger-slice`.

Use them in order. Each plan is deliberately smaller than the full MVP so issue slicing stays manageable.

## Recommended Order

1. `01-scaffold-foundation.md`
2. `02-auth-shell-access.md`
3. `03-audit-hand-receipts.md`
4. `04-items-search-shared-records.md`
5. `05-requirements-dashboard.md`
6. `06-documents-2062.md`
7. `07-mvp-hardening.md`

## Slicing Guidance

- Keep issues vertical: schema, service behavior, API, UI, tests, and docs where relevant.
- Build into the real `/app/...` shell.
- Use `tdd` for behavior-heavy issues.
- Keep provider calls behind boundaries.
- Emit audit/activity events once the audit foundation exists.
- Do not merge unrelated future enhancements into MVP slices.

## Source Docs

- `CONTEXT.md`
- `AGENTS.md`
- `docs/mvp-scope.md`
- `docs/domain-model.md`
- `docs/architecture.md`
- `docs/ui-spec.md`
- `docs/testing.md`
- `docs/adr/`

