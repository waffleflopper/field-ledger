# Coding Standards

## Product Boundary

- Build for one Army property owner managing many hand receipts.
- Do not frame Field Ledger as an official system of record, unit property book, clinic tool, or team workspace.
- Do not store or request PHI, classified information, or sensitive operational details.
- Prefer archive, restore, close, or pause over hard delete for accountable records.

## Architecture

- Keep business behavior in `src/modules/<domain>/`, not routes or raw UI components.
- Use the dependency path: UI route -> module UI -> tRPC -> application service -> repository/provider port -> adapter.
- Keep Better Auth, Supabase, Stripe, storage, email, notifications, and import/export behind provider boundaries.
- UI/domain code must not call external providers directly.
- Account-owned data must use `account_id`, Supabase RLS, and app-service business rules.
- Preserve meaningful audit/activity history for state changes.
- Major product or architecture boundary changes need an ADR in `docs/adr/`.

## Implementation

- Use `pnpm`, strict TypeScript, Tailwind v4, shadcn/ui, Drizzle, and local Supabase.
- Build small vertical slices with real UI, domain behavior, persistence, tests, and docs updates when relevant.
- Keep MVP online-first; import/export and offline support stay future boundaries unless the active slice explicitly implements them.
- Avoid placeholder mega-routes and generic demo UI.

## UI

- Mobile-first: phone uses bottom navigation; tablet/desktop uses the app shell sidebar.
- Product screens should be quiet, dense, scannable, and operationally useful.
- Use existing shell/components and shadcn/ui patterns before inventing new UI.
- For UI work, follow the `impeccable` skill and avoid generic AI-dashboard aesthetics.

## Testing

- Use TDD where behavior is clear.
- Prefer focused unit tests for domain rules, integration tests for module workflows, RLS isolation tests, and browser tests for critical flows.
- Avoid broad brittle end-to-end tests when smaller tests prove the behavior better.
- Run the narrow relevant checks first, then broader repo checks when the slice risk justifies it.
