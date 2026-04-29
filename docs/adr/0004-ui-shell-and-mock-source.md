# ADR 0004: UI Shell and Mock Source

## Status

Accepted

## Context

The MVP must be a real product UI, not a placeholder vertical-slice demo. The
repo-local mockup exists at:

`mocks/HandReceipt Concepts _standalone_.html`

The original mock component export is also preserved under `mocks/HandReceipt/`.

## Decision

Treat the mockup as source of truth for layout, route responsibility, and workflow intent. Do not treat it as pixel-perfect styling law.

Use:

- phone bottom navigation
- tablet/desktop collapsible left sidebar
- dashboard as home
- route map under `/app/...`
- mobile-first layouts that adapt for tablet/desktop instead of stretching phone UI

## Consequences

- Feature slices must build into the app shell.
- UI implementation may adapt to shadcn/ui, accessibility, and real data constraints.
- Major shell/navigation changes require a new ADR.

## Rejected Alternatives

- One giant MVP route.
- Desktop top nav as the main app shell.
- Treating the mock as only vague inspiration.
