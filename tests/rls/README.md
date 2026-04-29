# RLS Tests

Field Ledger has no account-owned product tables in the scaffold phase, so
there are no RLS tests yet.

When a slice adds an account-owned table, add tests here that prove one account
cannot read or write another account's rows. Keep the `pnpm test:rls` command
green by replacing the scaffold `--passWithNoTests` behavior with real tests
once the first account-owned schema exists.
