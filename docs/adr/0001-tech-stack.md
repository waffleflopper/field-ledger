# ADR 0001: Tech Stack

## Status

Accepted

## Context

Field Ledger needs a mobile-first subscription-ready web app with strong TypeScript boundaries, shadcn/ui, Tailwind v4, Supabase familiarity, local development support, and future offline/import/export paths.

## Decision

Use:

- Next.js latest App Router
- TypeScript
- Tailwind v4
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Drizzle for app schema and migrations
- tRPC as primary app API layer
- TanStack Query for client query/cache behavior
- Zod for validation
- pnpm
- local Supabase for development
- Vercel + hosted Supabase + Stripe for production direction

Start with `create-next-app@latest` plus shadcn, then add selected T3-style pieces manually.

## Consequences

- Strong current Next/Tailwind/shadcn foundation.
- Supabase Auth/Storage/RLS integration stays straightforward.
- Drizzle keeps schema/migrations visible.
- Provider boundaries still protect against vendor logic leaking everywhere.

## Rejected Alternatives

- `create-t3-app` scaffold: useful stack inspiration, but less control over initial repo shape.
- Prisma: good tool, but Drizzle better fits visible schema ownership and Supabase/Postgres-first work.
- Better Auth: strong app-owned auth option, but Supabase Auth is a better fit because Supabase is already the planned DB/auth/storage platform.
- Monorepo: unnecessary overhead for MVP.

