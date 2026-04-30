# MVP Scope

MVP means the app is personally useful for managing real hand receipt data. It does not mean public launch polish or full subscription automation.

## In Scope

- Better Auth sign-in.
- Account/trial/access state.
- Simulated billing capability checks.
- Real responsive app shell.
- Hand receipt create/edit/archive/restore.
- Property item create/edit/archive/restore/move.
- ECN, serial number, and generated ID validation.
- Reusable contacts and locations.
- Manual signed-to fallback through contacts.
- Upload 2062 single-item and multi-item flows.
- Active 2062s list.
- Requirement schedules, due windows, completion history.
- Dashboard with overdue/upcoming requirements, quick actions, and signed-out items.
- Global item search.
- Activity/audit foundation and simple UI surfacing.
- RLS for account-owned data.

## Out of Scope

- Real Stripe checkout/webhooks.
- Public marketing site.
- Organization/team collaboration.
- CSV/XLSX import/export implementation.
- Offline read cache.
- Push/email reminders.
- OCR.
- Item photos.
- Dedicated Reports area.
- Requirement templates.
- Tags/categories.

## MVP UI Standard

MVP UI must build into the real app shell and mock-derived route plan. Temporary placeholders may exist inside unfinished routes only when clearly part of scaffold work. Feature slices must not land as one giant proof-of-concept page.
