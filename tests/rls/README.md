# RLS Tests

Field Ledger's first account-owned production table is `accounts`.

The account RLS tests connect to local Supabase Postgres, seed two account rows
as the privileged migration user, then run read/write probes as the
`authenticated` role with `app.current_auth_subject` set to one opaque auth
subject. That proves an owner can see their own account row and cannot read or
update another owner account row without relying on Supabase Auth UUIDs.

The audit and hand receipt RLS tests use the same pattern for account-owned
tables. Each table-level test proves one account cannot read or write another
account's rows, and each repository-level test proves runtime adapters execute
through the authenticated database-session boundary instead of privileged
database access.
