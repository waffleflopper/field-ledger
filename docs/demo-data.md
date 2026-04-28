# Demo Data Specification

Future seed data should represent real workflows and edge cases.

## Accounts

- one active trial account
- one Base account near hand receipt limit
- one paused/read-only account

## Hand Receipts

- 2-3 active hand receipts
- 1 archived hand receipt
- optional metadata present on one hand receipt and absent on another

## Items

Include:

- duplicate nomenclature across multiple items
- ECN-only item
- serial-only item
- ECN + serial item
- generated-ID-only item
- archived item
- item moved between hand receipts in history

## Contacts

Include:

- similar names to test duplicate warnings
- contact with active 2062 items
- contact with manual signed-to items

## Locations

Include:

- shared location used by items from multiple hand receipts
- item with no location

## Requirements

Include:

- overdue requirement
- due-soon requirement
- upcoming requirement
- requirement beyond dashboard window
- paused requirement
- completed requirement with notes

## 2062 Assignments

Include:

- active single-item 2062
- active multi-item 2062
- closed historical 2062
- manual signed-to item with no 2062

