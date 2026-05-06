---
name: component-architecture
category: coding
tags: [react, nextjs, clean-code, separation-of-concerns, data-access, hooks, srp]
execution-mode: tool-call
description: 'Enforce clean React/Next.js component architecture: components contain only rendering and lifecycle; all business logic, API calls, and data transforms live in a separate layer (hooks, data-access modules, or utilities).'
argument-hint: 'Component file(s) or feature to audit/refactor for architecture separation'
---

# Component Architecture (React / Next.js)

## When to Use
- Reviewing or writing any React component
- Component contains `fetch`, `axios`, or direct API calls inline
- Component file mixes UI logic with data transformation or validation
- "Keep the component clean"
- "Move business logic out of the component"
- "Apply separation of concerns to React code"

## Core Rule

**A component is responsible for two things only:**
1. **Rendering** — JSX, conditional display, styling, layout
2. **Lifecycle / wiring** — `useState`, `useEffect`, event handler *wiring* (not the handler body itself)

Everything else must be extracted.

## What Does NOT Belong in a Component

| Concern | Wrong place | Right place |
|---|---|---|
| `fetch` / API calls | component body | `lib/api/*.js` data-access module |
| Response parsing / transforms | component body | data-access or `lib/utils` |
| Business rules / validation | component body | `lib/` utility or custom hook |
| Complex derived state logic | component body | custom hook (`useXxx`) |
| Multi-step async orchestration | component body | custom hook or server action |
| Error formatting / mapping | component body | `lib/errors.js` or custom hook |

## Layers

```
app/ or pages/          ← routing, layout only
  └─ components/        ← rendering + lifecycle wiring ONLY
  └─ hooks/             ← stateful logic, side-effects, derived state
lib/
  └─ api/               ← all fetch/HTTP — one file per resource
  └─ utils/             ← pure transforms, formatters, validators
  └─ errors.js          ← error types and message maps
```

## Procedure

### 1. Audit the component
- Scan for `fetch`, `await`, data transforms, validation, or multi-branch logic blocks.
- Each one is a candidate for extraction.

### 2. Extract API calls → `lib/api/`
- Create `lib/api/<resource>.js` (e.g. `lib/api/me.js`, `lib/api/chat.js`).
- Functions are plain `async` functions that call the API and return typed data.
- No React imports. No hooks. No JSX.

```js
// lib/api/me.js
export async function fetchMe() {
  const res = await fetch('/api/me')
  if (!res.ok) return null
  return res.json()
}
```

### 3. Extract stateful logic → custom hooks (`hooks/useXxx.js`)
- A custom hook owns `useState`, `useEffect`, derived values, and calls data-access functions.
- Returns only what the component needs (data, handlers, loading, error).
- No JSX. No className.

```js
// hooks/useMe.js
import { useState, useEffect } from 'react'
import { fetchMe } from '@/lib/api/me'

export function useMe() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetchMe().then(setUser).catch(() => {})
  }, [])
  return user
}
```

### 4. Simplify the component
- Replace inline logic with hook calls.
- Component body should read as plain English: get data, handle event, return JSX.

```jsx
// components/Header.js — after
import { useMe } from '@/hooks/useMe'

export function Header() {
  const user = useMe()
  return <header>{user?.name ?? null}</header>
}
```

### 5. Verify
- Component file: no `fetch`, no complex conditionals beyond render branching.
- Each extracted module has its own focused test.
- Run existing tests. Add unit tests for new hooks/data-access functions.

## Anti-Patterns to Reject

- `useEffect` bodies with 20+ lines of logic
- `fetch` called directly inside a component
- Inline `JSON.parse`, response mapping, or error message strings inside JSX
- Handler functions that contain business decisions rather than just calling a hook method
- `page.js` or `layout.js` files importing from `lib/api` directly (route through a hook)

## Checklist (apply on every component review)

- [ ] No `fetch` / HTTP calls in the component body
- [ ] No data transforms in the component body
- [ ] `useEffect` delegates to a hook or data-access function
- [ ] Each custom hook has a single purpose
- [ ] `lib/api/` functions are pure, testable without React
- [ ] Tests exist for hooks and data-access layers
