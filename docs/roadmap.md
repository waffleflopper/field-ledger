# Roadmap

## Phase 0: Documentation Foundation

- Product/context docs
- Domain model
- Architecture rules
- UI spec from mock
- Testing strategy
- ADRs
- Agent workflow rules
- Repo-local skills
- Issue slice template

## Phase 1: Scaffold-Only Commit

- Next.js latest App Router
- TypeScript
- Tailwind v4
- shadcn/ui
- Supabase local setup
- Drizzle setup
- tRPC/TanStack Query setup
- app shell routes with placeholder content only
- lint/typecheck/test command foundation

## Phase 2: App Shell + Auth/Account/Access

- Better Auth
- account record
- trial/access state
- responsive app shell from mock
- mobile bottom nav
- desktop/tablet collapsible sidebar

## Phase 3: Audit/Activity Foundation

- audit event model
- audit logger boundary
- simple user-visible activity surfaces
- workflow rules for event emission

## Phase 4: Hand Receipts + Billing Capability

- create/edit/archive/restore hand receipts
- capability checks for trial/Base/Pro hand receipt limits
- account-paused read-only behavior

## Phase 5: Items Core

- item identifier validation
- create/edit/archive/restore/move
- global search basics
- duplicate warnings

## Phase 6: Contacts + Locations

- account-wide reusable contacts
- account-wide reusable locations
- inline create/select flows

## Phase 7: Requirements

- item-level recurring requirements
- completion history
- dashboard overdue/due-soon/upcoming

## Phase 8: 2062 Assignments + Documents

- private document storage
- single-item upload flow
- multi-item upload flow
- active 2062s list
- close/remove link behavior

## Early Post-MVP

- CSV/XLSX import/export
- report exports
- read-only offline cache
- Stripe checkout/webhooks
- email reminders
- OCR exploration
- item photos
- requirement templates
