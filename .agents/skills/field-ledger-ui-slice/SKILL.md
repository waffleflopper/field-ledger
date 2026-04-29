---
name: field-ledger-ui-slice
description: Build or audit Field Ledger UI slices against the mock-derived app shell, responsive rules, route map, and product UX constraints.
---

# Field Ledger UI Slice

Use this skill for app shell, route layout, or feature UI work.

## Required Reading

1. `docs/ui-spec.md`
2. `docs/product-foundation.md`
3. `AGENTS.md`
4. Relevant module docs or ADRs

## UI Rules

- Phone uses bottom nav.
- Tablet/desktop use collapsible left sidebar.
- Dashboard priority is overdue/upcoming requirements, quick actions, signed-out items.
- Use the mock as workflow/layout truth, not pixel-perfect law.
- Use shadcn/ui and Tailwind v4.
- Apply high-quality UI judgment where shadcn/ui does not prescribe behavior, prioritizing consistent spacing, clear hierarchy, responsive layout, and accessible interaction states.
- Build into real `/app/...` routes.
- Do not create a feature-only mega-route.
- Item screens must work well without photos.
- Active 2062s means formal 2062 assignments only.
- Signed-out surfaces include formal and manual signed-to items, visually distinguished.

## Verification

For meaningful UI work:

- check mobile and desktop layouts
- verify no text overflow or incoherent overlap
- verify route shell behavior
- run relevant tests/checks
