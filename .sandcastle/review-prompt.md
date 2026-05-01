# TASK

Review the code changes on branch `{{BRANCH}}` and improve code clarity, consistency, and maintainability while preserving exact functionality.

# CONTEXT

## Branch diff

!`git diff {{SOURCE_BRANCH}}...{{BRANCH}}`

## Commits on this branch

!`git log {{SOURCE_BRANCH}}..{{BRANCH}} --oneline`

# REVIEW PROCESS

1. **Understand the change**: Read the diff and commits above to understand the intent.

2. **Check project boundaries first**:
   - Does the change satisfy the issue and any parent PRD without broadening scope?
   - Does business behavior stay in `src/modules/<domain>/` instead of routes or raw UI?
   - Do UI/domain files avoid direct Better Auth, Supabase, Stripe, storage, email, or notification calls?
   - Are account-owned reads/writes protected by `account_id`, app services, and RLS expectations?
   - Are meaningful state changes covered by audit/activity behavior where relevant?
   - Does the change avoid hard deletes for accountable records unless explicitly required?
   - If UI changed, does it land in the real app shell and follow Field Ledger's mobile-first product shape?
   - Were relevant docs or ADRs updated when behavior, boundaries, or terminology changed?

3. **Check correctness**:
   - Does the implementation match the issue intent? Are edge cases handled?
   - Are new/changed behaviours covered by tests?
   - Are there unsafe casts, `any` types, or unchecked assumptions?
   - Does the change introduce injection vulnerabilities, credential leaks, or other security issues?

4. **Analyze for focused improvements**: Look for opportunities to:
   - Reduce unnecessary complexity and nesting
   - Eliminate redundant code and abstractions
   - Improve readability through clear variable and function names
   - Consolidate related logic
   - Remove unnecessary comments that describe obvious code
   - Avoid nested ternary operators - prefer switch statements or if/else chains
   - Choose clarity over brevity - explicit code is often better than overly compact code

5. **Maintain balance**: Avoid over-simplification or broad refactors that could:
   - Reduce code clarity or maintainability
   - Create overly clever solutions that are hard to understand
   - Combine too many concerns into single functions or components
   - Remove helpful abstractions that improve code organization
   - Make the code harder to debug or extend

6. **Apply project standards**: Follow the coding standards defined in @.sandcastle/CODING_STANDARDS.md

7. **Preserve functionality**: Never change what the code does unless required to satisfy the issue. All original features, outputs, and behaviors must remain intact.

# EXECUTION

If you find improvements to make:

1. Make the changes directly on this branch
2. Run `pnpm verify:sandcastle`
3. Commit describing the refinements

Do not run `pnpm install`, `npm install`, `corepack install`, or any other dependency install/refresh command inside the sandbox.

Do not run `pnpm test`, `pnpm test:*`, Playwright, local Supabase, Docker-in-Docker, RLS tests, or broad end-to-end tests unless the review finding explicitly depends on those surfaces and the needed dependencies/services already work without install repair.

If a targeted check is blocked by missing optional native packages, browser binaries, Supabase, Docker, or another sandbox dependency issue, report it as a verification limitation. Do not try to repair sandbox dependencies.

If the code is already clean and well-structured, do nothing.

Once complete, output <promise>COMPLETE</promise>.
