# Field Ledger

Field Ledger is a mobile-first web app for individual Army property
accountability. It is for the person holding the hand receipt, juggling the
2062s, checking where the item went, and trying not to let the whole thing turn
into a spreadsheet with a thousand-yard stare.

One owner account manages many hand receipts. Each hand receipt holds property
items, assignment state, 2062 coverage, locations, contacts, recurring
requirements, and activity history.

## What It Is

Field Ledger helps an individual property holder answer the questions that come
up during real property work:

- What property do I have?
- Where is it?
- Who is it signed to?
- Which 2062s are active?
- What requirements are overdue or coming due?

The app is personal, fast, mobile-first, and structured enough to grow into a
subscription product without becoming a giant demo route in a trench coat.

## What It Is Not

Field Ledger is not an official Army system of record. It does not replace
official records, regulations, commanders, supply channels, or property book
offices.

Do not store classified information, PHI (protected health information), or
sensitive operational details in Field Ledger. The expected personal information
is limited to names, contact context, and user-entered property-accountability
notes.

## Product Shape

- One owner account, many hand receipts.
- Hand receipts are lightweight buckets for property items.
- One item record represents one physical accountable item.
- Items track nomenclature, ECN, serial number, app-generated IDs, location,
  assignment state, 2062 coverage, recurring requirements, and history.
- Contacts and locations are account-wide reusable records.
- Active 2062s track formal 2062 assignments only.
- Manual signed-to state is supported, but clearly distinct from formal 2062
  coverage.
- Requirements are item-level recurring obligations with completion history.
- Archive, close, and pause are preferred over hard delete for accountable
  records.

## Tech Stack

- Next.js App Router
- TypeScript
- pnpm
- Tailwind CSS v4
- shadcn/ui
- tRPC
- TanStack Query
- Drizzle
- Supabase Auth, Postgres, and Storage
- Local Supabase for development
- Vitest and Playwright

The codebase is intentionally domain-first. Business behavior belongs in
`src/modules/<domain>/`, routes stay thin, and provider integrations stay behind
internal boundaries.

## Current Status

The repo is in the foundation stage. The scaffold proves the real app stack is
installed and wired:

- Next.js app shell
- Tailwind v4 and shadcn/ui setup
- tRPC plus TanStack Query foundation
- Drizzle config and first scaffold migration
- Local Supabase config on nondefault ports
- Provider-boundary starting point
- Unit, integration, RLS-placeholder, and browser test commands

Product workflows are intentionally added in small vertical slices.

## Quick Start

Install dependencies:

```sh
pnpm install
```

Copy the local environment file:

```sh
cp .env.example .env.local
```

Start local Supabase:

```sh
pnpm supabase:start
```

Copy the local publishable key from:

```sh
pnpm supabase:status
```

Then paste it into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

Apply local migrations:

```sh
pnpm db:migrate
```

Run the app:

```sh
pnpm dev
```

## Local Supabase Ports

Field Ledger intentionally avoids the default Supabase ports so another local
Supabase project can run at the same time.

| Service | Port |
| --- | ---: |
| API | `54331` |
| Postgres | `54332` |
| Studio | `54333` |
| Inbucket | `54334` |
| SMTP | `54335` |
| POP3 | `54336` |
| Analytics | `54337` |
| Shadow database | `54330` |

See [docs/local-development.md](docs/local-development.md) for the full setup.

## Useful Commands

```sh
pnpm dev
pnpm build
pnpm verify
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
```

## Project Documents

- [CONTEXT.md](CONTEXT.md) defines the durable product boundary.
- [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md) keeps domain terms sharp.
- [docs/prd/field-ledger-mvp-prd.md](docs/prd/field-ledger-mvp-prd.md) is the
  governing MVP PRD.
- [docs/local-development.md](docs/local-development.md) explains local Supabase,
  Drizzle, and app setup.
- [docs/testing.md](docs/testing.md) documents the verification contract.
- [AGENTS.md](AGENTS.md) explains repo rules for AI-assisted implementation.

## North Star

Field Ledger should feel like a calm, capable pocket notebook for property
accountability: quick in the moment, strict where accountability matters, and
honest about what official systems still own.
