# Issue Tracker: GitHub

Issues and PRDs for this repo live in GitHub Issues for `waffleflopper/field-ledger`.

Use the `gh` CLI for issue operations from inside this repo unless a user explicitly asks for a different tool.

## Conventions

- **Create an issue:** `gh issue create --repo waffleflopper/field-ledger --title "..." --body "..."`
- **Read an issue:** `gh issue view <number> --repo waffleflopper/field-ledger --comments`
- **List issues:** `gh issue list --repo waffleflopper/field-ledger --state open --json number,title,body,labels,comments`
- **Comment on an issue:** `gh issue comment <number> --repo waffleflopper/field-ledger --body "..."`
- **Apply or remove labels:** `gh issue edit <number> --repo waffleflopper/field-ledger --add-label "..."` or `--remove-label "..."`
- **Close an issue:** `gh issue close <number> --repo waffleflopper/field-ledger --comment "..."`

When a skill says "publish to the issue tracker," create a GitHub issue in `waffleflopper/field-ledger`.

When a skill says "fetch the relevant ticket," run:

```sh
gh issue view <number> --repo waffleflopper/field-ledger --comments
```
