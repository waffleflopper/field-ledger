# Field Ledger Agent Rules

Field Ledger is a mobile-first web app for individual Army property accountability. The codebase must stay easy for both humans and agents to extend without drifting into accidental architecture.

## Product Boundary

- Field Ledger is for one owner account managing many hand receipts.
- It is not an official Army system of record.
- It must not store PHI, classified information, or sensitive operational details.
- Expected personal information is limited to assignee/contact names and optional user-entered context.
- The app helps users manage property accountability; users remain responsible for official records and regulations.

## Workflow Rules

- Start with Phase 0 docs before app scaffold or feature code.
- Build in small vertical slices that land in the real app shell.
- Do not create placeholder mega-routes for MVP work.
- Every feature slice should include real UI, domain behavior, persistence, tests, and docs updates when relevant.
- If a slice changes behavior, architecture, terminology, or boundaries, update the relevant docs in the same change.
- Major architecture or product-boundary changes require an ADR in `docs/adr/`.

## Architecture Rules

- Use domain-first modules. Business behavior belongs in `src/modules/<domain>/`, not in route components.
- Routes compose module UI and call typed procedures; routes do not own business rules.
- tRPC is the primary app API layer. tRPC procedures call module application services.
- Server Actions are allowed only for narrow framework needs and must still call module services.
- Supabase Auth, Supabase Storage, Stripe, email, and future notification providers must stay behind provider boundaries.
- UI/domain code must not call Supabase or Stripe directly.
- Supabase RLS (row-level security: database rules that restrict row access) is required for account-owned data.
- App services enforce business rules such as trial access, hand receipt limits, archive behavior, assignment rules, and reminder behavior.

## Implementation Rules

- Use `pnpm`.
- Use strict TypeScript.
- Use Tailwind v4 and shadcn/ui for UI implementation.
- Use Drizzle for app schema and migrations.
- Use local Supabase for development from the beginning.
- Prefer archive, close, or pause over hard delete for accountable records.
- Preserve audit/activity history for meaningful state changes.
- Keep import/export and offline support as documented future boundaries unless the active slice explicitly implements them.

## Testing Rules

- Use TDD where the slice has clear behavior to prove.
- Prioritize unit tests for domain rules, integration tests for module workflows, RLS isolation tests, and focused browser tests for critical flows.
- Avoid broad brittle end-to-end coverage when smaller tests prove the behavior more clearly.

## Useful Skills

- Use `field-ledger-slice #123` or `field-ledger-slice path/to/slice.md` to implement vertical slice issues.
- Use `field-ledger-ui-slice` for app-shell or mock-derived UI work.
- Use `field-ledger-provider-boundary` for auth, billing, storage, email, or notification integration.
- Use `field-ledger-architecture-audit` before large PRs or after several slices.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `waffleflopper/field-ledger`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain-doc layout: root `CONTEXT.md` plus root `docs/adr/`. See `docs/agents/domain.md`.
