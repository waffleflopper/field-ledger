# RLS Tests

Field Ledger's first account-owned production table is `accounts`.

The account RLS tests connect to local Supabase Postgres, seed two account rows
as the privileged migration user, then run read/write probes as the Supabase
`authenticated` role with `request.jwt.claim.sub` set to one owner id. That
proves an owner can see their own account row and cannot read or update another
owner account row.

When future slices add account-owned tables, add tests here that prove one
account cannot read or write another account's rows.
