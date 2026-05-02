# ADR 0006: Requirement Pause State

## Status

Accepted

## Context

Requirements can be paused and resumed without being archived or deleted. Pause
is a temporary suppression of active requirement behavior: paused requirements
stay visible on item detail, are excluded from dashboard work, and cannot be
completed until resumed.

The first requirements implementation represents pause with a nullable
`pausedAt` timestamp. Review feedback raised the question of whether pause
should instead be represented as a `status` enum value, such as `paused`.

## Decision

Keep requirement pause state timestamp-driven. A requirement is paused when
`pausedAt` is not null and unpaused when `pausedAt` is null.

The requirement `status` field remains reserved for broader record lifecycle
states, not the pause/resume toggle. Requirement pause/resume actions emit audit
events, and `pausedAt` records the current pause start time on the requirement
row for filtering and display.

## Consequences

- Pause can be queried directly without introducing another lifecycle enum value.
- The product keeps the timestamp of the current pause available without reading
  audit history.
- Pause remains distinct from archive. Archive removes a record from normal
  workflows for history preservation; pause temporarily suppresses active
  requirement behavior.
- Concurrency-sensitive pause/resume writes should condition updates on the
  expected `pausedAt` state: pause only when `pausedAt` is null, and resume only
  when the stored `pausedAt` still matches the timestamp read by the service.
- If requirements later gain more mutually exclusive lifecycle states, a future
  ADR should revisit whether `status` should absorb pause state.

## Rejected Alternatives

- Model pause as `status = 'paused'`. This would align with some lifecycle enum
  patterns, but it adds schema and migration churn without a current need for a
  broader requirement status machine.
- Remove requirement-level pause. MVP requirements explicitly need a reversible
  way to suppress active requirement work without deleting history.
