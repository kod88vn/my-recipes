---
name: pr-description
category: coding
tags: [git, pr, changelog, commit, diff]
execution-mode: tool-call
description: 'Write a clear, well-structured pull request description from changed files and commits. Use when asked to write, draft, or improve a PR description, changelog entry, or commit message.'
argument-hint: 'Branch name, PR number, or paste the diff'
---

# PR Description Writer

## When to Use
- "Write a PR description for this branch"
- "Summarize what changed in this diff"
- "Draft a changelog entry"
- "Improve the description of this PR"

## Procedure

1. **Gather context**
   - Use `get_changed_files` or `git diff` to see what changed.
   - Read linked issue numbers or existing PR title if available.
   - Skim modified files to understand *why* the change was made, not just *what*.

2. **Identify the change type** — feature, bug fix, refactor, docs, chore, breaking change.

3. **Draft the description** using the template below.

4. **Review for clarity** — ensure a reviewer with no context could understand the goal and impact.

## Output Template

```markdown
## What and Why
<!-- 2–4 sentences: what problem this solves and why this approach was chosen -->

## Changes
<!-- Bullet list of meaningful changes. Group by area if large. -->
- 

## Testing
<!-- How was this tested? Unit tests, manual steps, screenshots? -->
- [ ] Tests added/updated
- [ ] Manually verified on <environment>

## Notes for Reviewers
<!-- Anything tricky, assumptions made, or areas needing extra attention -->

## Related
<!-- Issues, tickets, or other PRs -->
Closes #
```

## Notes
- Keep "What and Why" free of implementation jargon — write for the reviewer, not the compiler.
- Omit sections that don't apply rather than leaving them blank.
- For breaking changes, add a `## Breaking Changes` section at the top.
