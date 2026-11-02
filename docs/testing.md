# Testing

[Back to README](../README.md)

## Strategy

The goal is a small suite where every test earns its place: each one protects a rule or a user flow whose failure someone would notice. There is no coverage target and no test written just to mirror the implementation.

Two layers, each used where it gives the most confidence for the least code:

| Layer      | Tool       | Tests | What it proves                                                                                                                                                                                        |
| ---------- | ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest     | 20    | Business rules and the API contract: ids and timestamps, description normalization, not-found errors, cursor pagination edge cases, input validation, semantic error codes and field errors over HTTP |
| End-to-end | Playwright | 13    | The user flows on a production build: server-rendered list with no API request, infinite scroll, create, edit, delete and not found, including the pending, error and double-click paths              |

## Principles

- **Behaviour through public interfaces.** Unit tests call the service and the tRPC router the way real callers do. E2E tests drive the browser by roles and labels, the way a user or a screen reader would.
- **No mocks of our own code.** Unit tests run against a real in-memory repository, fresh for each test, and E2E tests hit the real server. The only stand-ins are a controlled clock in the unit tests (to check timestamps) and, in the browser, a few simulated network failures and one simulated server response to reach error paths.
- **Each test owns its data.** E2E tests create what they need through the API, with unique titles, and never rely on global counts. They share one in-memory store, which is also why they run one at a time.
- **Fast feedback first.** `npm run check` (lint, typecheck, unit tests) runs in seconds. The slower E2E suite is a separate script.

Deliberately not tested:

- **shadcn/ui primitives and third-party libraries.** They are not our code.
- **Components in isolation** (no React Testing Library, no snapshots). The E2E suite checks the same behaviour from the user's side without tying tests to markup.
- **Performance of the in-memory store.** It stands in for a database.

## Do the tests catch bugs?

A passing suite only matters if it fails when the code is wrong, so the suite was checked by breaking the code on purpose:

| Deliberate bug                             | Result                                                   |
| ------------------------------------------ | -------------------------------------------------------- |
| Cursor comparison changed from `<` to `<=` | 4 pagination tests fail                                  |
| Domain error mapping removed               | `NOT_FOUND` becomes a 500 and 2 tests fail               |
| Title `min(1)` rule removed                | 3 validation tests fail                                  |
| `updatedAt` no longer set on update        | 1 test fails                                             |
| Double-click guard removed from delete     | The E2E double-click test fails (expected 1, received 2) |

The last bug exposed a weak test. Its first version still passed with the bug, because it asserted that a second toast was hidden before that toast had time to appear. It now counts the delete operations actually sent.

## Running the tests

```bash
npm test                          # unit tests
npx playwright install chromium   # once, before the first E2E run
npm run test:e2e                  # builds the app and runs it on port 3100
```
