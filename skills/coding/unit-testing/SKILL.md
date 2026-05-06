---
name: unit-testing
category: coding
tags: [testing, unit-tests, smoke-tests, jest, vitest, quality]
execution-mode: tool-call
description: 'Write and run lightweight unit tests for every coding task. Enforces the rule that smoke tests ship with every change and must pass before finishing.'
argument-hint: 'File, function, module, or feature to write tests for'
---

# Unit Testing

## When to Use
- After implementing any new function, module, or API route
- After fixing a bug
- After modifying existing behavior
- Any time a coding task is considered "done" — always run tests before finishing

## Rules

1. **Always write a smoke test** — minimum one test per new or changed function/module before the task is complete.
2. **Always run the tests** — use the project's test command (check `package.json` scripts). Fix all failures before finishing.
3. **Never defer tests** — "add tests later" is not acceptable. Tests ship with the change.
4. **If no test infrastructure exists**, create minimum scaffolding (e.g. a Jest config) rather than skipping.
5. **When adding or updating a package/dependency**, run a local Docker build (for example `docker build .`) before finishing to catch image/runtime dependency issues early.

## Minimum Test Coverage

Keep tests fast and focused. No real network calls or filesystem access unless the feature is specifically about those — use mocks.

| Change type | Minimum test |
|---|---|
| New pure function | Correct output for 1–2 inputs; throws/returns error for bad input |
| New API route handler | Mock request → assert response shape + status code |
| New React component | `render(<Component />)` without crashing |
| New external service call | Mock the call, assert return value is handled correctly |
| Bug fix | Regression test that reproduces the original bug |
| New module | Smoke test that imports it and exercises the main export |

## Procedure

1. **Identify what changed** — list every new or modified function/module.
2. **Write smoke tests** for each — cover happy path + at least one edge/error case.
3. **Run the test suite** (`npm test` / `yarn test` / `jest` — check `package.json`).
4. **If dependencies changed**, run a local Docker build and resolve any build/runtime failures.
5. **Fix failures** — do not finish the task with red tests or broken Docker builds.
6. **Report** — briefly note which tests were added and that they pass.

## Test Style Guidelines

- One `describe` block per module, one `it`/`test` per behavior.
- Name tests as behavior: `'returns null when input is empty'` not `'test1'`.
- Mock external dependencies at the boundary — don't let tests hit real APIs or databases.
- Prefer `expect(fn()).toBe(value)` over snapshot tests for unit-level checks.

## Examples

### Pure function
```js
import { formatDate } from '../lib/utils';

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });
  it('returns null for invalid input', () => {
    expect(formatDate(null)).toBeNull();
  });
});
```

### API route handler
```js
import { POST } from '../app/api/chat/route';

it('returns 400 when messages is missing', async () => {
  const req = new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const res = await POST(req);
  expect(res.status).toBe(400);
});
```

### React component
```jsx
import { render } from '@testing-library/react';
import ChatMessage from '../components/ChatMessage';

it('renders without crashing', () => {
  render(<ChatMessage role="assistant" content="Hello" />);
});
```
