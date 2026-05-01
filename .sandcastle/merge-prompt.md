# TASK

Merge the following branches into the current branch:

{{BRANCHES}}

For each branch:

1. Run `git merge <branch> --no-edit`
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the correct resolution
3. After resolving conflicts, run `pnpm verify:sandcastle` to verify the merged result
4. If tests fail, fix the issues before proceeding to the next branch

Do not run `pnpm install`, `npm install`, `corepack install`, or any other dependency install/refresh command inside the sandbox.

Do not run `pnpm test`, `pnpm test:*`, `pnpm exec vitest`, `pnpm exec playwright`, Playwright, local Supabase, Docker-in-Docker, RLS tests, or broad end-to-end tests. If verification is blocked by missing optional native packages, browser binaries, Supabase, Docker, or another sandbox dependency issue, report it as a verification limitation and do not try to repair sandbox dependencies.

After all branches are merged, make a single commit summarizing the merge.

# CLOSE ISSUES

For each issue that was successfully merged, close the matching issue number from the list below.

Use this command shape:

`gh issue close <issue-number> --comment "Completed by Sandcastle"`

Here are all the issues:

{{ISSUES}}

Once you've merged everything you can, output <promise>COMPLETE</promise>.
