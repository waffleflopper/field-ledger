# Plan: Scaffold Foundation

> Source: Field Ledger Phase 0 docs and ADR 0001.

This plan creates the project scaffold only. It should not implement product workflows beyond the minimum needed to prove the scaffold and development commands.

## Architectural Decisions

- **App framework**: Next.js App Router with TypeScript.
- **UI foundation**: Tailwind v4 and shadcn/ui.
- **Package manager**: pnpm.
- **Database/dev platform**: local Supabase from the start.
- **Schema/migrations**: Drizzle owns app schema and migrations.
- **API layer**: tRPC is the primary app API layer.
- **Client query/cache**: TanStack Query.
- **Routes**: authenticated product routes live under `/app/...`.
- **Repo shape**: single Next app repo, not a monorepo.
- **Docs**: Phase 0 docs stay in place and guide all scaffold decisions.

---

## Phase 1: Create the App Skeleton

**User stories covered**: As a developer, I can run the Field Ledger app locally from a clean repo.

### What To Build

Create the initial Next.js app scaffold with TypeScript, pnpm, Tailwind v4, shadcn/ui readiness, lint/typecheck/test command placeholders, and the existing Phase 0 docs preserved.

### Acceptance Criteria

- [x] The project runs locally with `pnpm dev`.
- [x] TypeScript, linting, and formatting conventions are established.
- [x] Tailwind v4 is configured and ready for shadcn/ui.
- [x] The docs and repo-local skills remain intact.
- [x] No product workflow is implemented beyond scaffold proof.

---

## Phase 2: Establish Local Supabase and Environment Contract

**User stories covered**: As a developer, I can start local Supabase and know which environment values the app expects.

### What To Build

Add local Supabase development setup, environment example documentation, and the initial database connection path needed by future modules.

### Acceptance Criteria

- [x] Local Supabase startup is documented.
- [x] `.env.example` lists required local values without secrets.
- [x] The app can connect to the local database in development.
- [x] The setup does not require hosted Supabase for local development.
- [x] Provider boundaries remain documented as the required integration path.

---

## Phase 3: Add Drizzle and Migration Foundation

**User stories covered**: As a developer, I can add versioned app schema changes safely.

### What To Build

Add Drizzle configuration and a first harmless migration path that proves app-owned migrations can run against local Supabase.

### Acceptance Criteria

- [x] Drizzle can generate/apply migrations against local Supabase.
- [x] Migration commands are documented.
- [x] RLS policy handling is documented for future user-owned tables.
- [x] The scaffold does not add real domain tables unless needed to prove the migration path.

---

## Phase 4: Add tRPC and Query Foundation

**User stories covered**: As a developer, I can add typed app operations without putting business rules in routes.

### What To Build

Add the tRPC/TanStack Query foundation and a minimal health-style procedure that proves the stack works without implementing product behavior.

### Acceptance Criteria

- [x] The app has a working typed server/client API path.
- [x] The API foundation is documented as calling module services for real workflows.
- [x] No domain behavior is embedded directly in route components.
- [x] Verification commands cover the API foundation.

---

## Phase 5: Establish Test Harness

**User stories covered**: As a developer, I can write unit, integration, and focused UI tests as slices land.

### What To Build

Add the testing harness that future slices will use for domain rules, module workflows, RLS checks, and focused browser coverage.

### Acceptance Criteria

- [x] Unit tests can run.
- [x] Integration-style tests have a documented path.
- [x] Browser/UI test tooling is ready or explicitly staged for the first UI slice.
- [x] `docs/testing.md` matches the actual command names.
- [x] CI-ready command set is documented, even if CI is added later.

