# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view {{TASK_ID}}`. If it has a parent PRD, pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# REQUIRED CONTEXT

Before implementation, read:

1. `AGENTS.md`
2. `CONTEXT.md`
3. `.sandcastle/CODING_STANDARDS.md`
4. Relevant files in `docs/adr/`
5. Any docs linked from the issue or parent PRD

Use these as the source of truth for product boundaries, module boundaries, testing expectations, and UI expectations.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

Pay extra attention to test files that touch the relevant parts of the code.

# EXECUTION

If applicable, use RGR to complete the task.

1. RED: write one test
2. GREEN: write the implementation to pass that test
3. REPEAT until done
4. REFACTOR the code

Do not invent product decisions or architecture changes that are not supported by the issue, parent PRD, or repo docs. If something is ambiguous, choose the smallest implementation that satisfies the issue without crossing Field Ledger boundaries.

# FEEDBACK LOOPS

Before committing, run `pnpm verify:sandcastle`.

Run additional targeted tests when the issue clearly touches a test-covered behavior. Do not require local Supabase, Docker-in-Docker, RLS tests, or broad end-to-end tests unless the issue explicitly depends on those surfaces.

# COMMIT

Make a git commit. The commit message must:

1. Start with `Sandcastle:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# THE ISSUE

If the task is not complete, leave a comment on the issue with what was done.

Do not close the issue - this will be done later.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
