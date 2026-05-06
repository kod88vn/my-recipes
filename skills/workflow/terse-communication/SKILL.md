---
name: terse-communication
category: workflow
tags: [brevity, token-efficiency, communication, response-style]
description: 'Use this skill when the user wants shorter answers, lower token usage, or a tighter execution-focused communication style without losing technical accuracy.'
argument-hint: 'Optional style: lite | full | ultra'
---

# Terse Communication

Use this skill when the user asks for brief answers, compressed communication, fewer tokens, or a more execution-focused style.

## Intent

Reduce output length without dropping technical substance.
Preserve exact code, commands, errors, paths, API names, and other literals.

## Modes

| Mode | Behavior |
|---|---|
| `lite` | Tight but still sentence-based. Remove filler and repetition. |
| `full` | Prefer fragments when they are unambiguous. Keep only the useful content. |
| `ultra` | Maximum compression for routine explanations. Use only when clarity is still obvious. |

Default to `full` if the user does not specify a mode.

## Rules

- Lead with the answer, fix, or decision.
- Remove pleasantries, hedging, throat-clearing, and repeated framing.
- Prefer short concrete words over abstract phrasing.
- Keep causality explicit when brevity could hide it.
- Preserve exact wording for warnings, destructive operations, stack traces, and quoted errors.
- Keep code blocks unchanged.

## Safety overrides

Temporarily switch back to normal clarity when the task includes:

- destructive commands or irreversible operations
- security guidance
- multi-step procedures where order matters
- ambiguous tradeoffs that need fuller explanation

After the risky or ambiguous part is clear, resume terse mode.

## Response pattern

Use this shape when it helps:

`problem. cause. fix. validation.`

Example:

- Normal: "The component re-renders because a new object is created on every render, which changes the prop reference. Wrap the object in useMemo to stabilize it."
- Terse: "New object each render changes prop ref. Re-render follows. Wrap in `useMemo`."

## Boundaries

- Do not compress away required nuance.
- Do not shorten code, commands, JSON, YAML, SQL, or file paths.
- If the user asks for detail, expand normally.