# fix-5b7afc0dce1dec73 — /addfav accepts malformed pairs with empty colon sides

**Weight:** 0.0000 (share of project budget)
**Reward:** 0 CVB

The `/addfav` command handler at `src/handlers/E3T1.ts:52` only validates that the pair string **contains** a colon (`favPair.includes(":")`) but does not check that **both sides** of the colon are non-empty. This allows storing malformed data that does not match the `<from>:<to>` format required by the task spec.

**How to reproduce:** Send `/addfav km: miles` (space after colon). The `text.trim().split(/\s+/)` call yields `parts = ["/addfav", "km:", "miles"]`. `parts[1]` is `"km:"`, which passes the `includes(":")` check, and the handler stores `"km:"` as a valid favorite — missing the `<to>` component entirely.

Similarly, `/addfav :miles` stores `":miles"` (missing `<from>`).

**Contrast with E2T1** (`src/handlers/E2T1.ts:48-55`), which properly slices on the first colon and rejects pairs where either side is empty (`if (!fromUnit || !toUnit)`).

**Fix:** After splitting on the colon, validate that both the left and right sides are non-empty and non-whitespace.

## Dialog tests

This is a FIX task: the behavior it repairs is already covered by an existing spec under `tests/specs/`. Fix the code to make that existing spec pass — do NOT author a new `tests/specs/fix-5b7afc0dce1dec73.json` (a duplicate spec for the same behavior makes the tests-gate count it twice and it can never go green). Add a new spec file ONLY if you are introducing genuinely new user-facing behavior that no existing spec covers; if so, name it `tests/specs/fix-5b7afc0dce1dec73.json` (and any new command `tests/commands/fix-5b7afc0dce1dec73.json`).


## Handler module

This is a FIX task. Find the EXISTING handler under `src/handlers/` that implements the affected command/behavior and EDIT it in place. Do NOT create a new `src/handlers/fix-5b7afc0dce1dec73.ts` — a second `Composer` binding the same command conflicts with the original and breaks the bot. Create a new handler file ONLY if the affected command does not exist anywhere yet (then name it `src/handlers/fix-5b7afc0dce1dec73.ts` and default-export a grammY `Composer`; `buildBot()` auto-loads it). NEVER edit `src/bot.ts`; the global error boundary + unknown-command fallback already live in `buildBot()`.


## Implementation contract

Ship a COMPLETE, working implementation — not a stub. A task is INCOMPLETE (and will be rejected) even if it compiles and the dialog tests pass when it does any of these:
- **Stubbed code:** empty bodies, `TODO`/`FIXME`, commented-out logic, or `throw new Error("not implemented")`.
- **Fabricated data:** `Math.random()`, hardcoded sample arrays, or canned responses standing in for real computed or fetched values.
- **No in-memory data store:** a `Map`/array/module-level variable used as a database is a defect. Anything that must survive a restart (records, subscriptions, balances, schedules, settings) MUST use the toolkit's persistent storage (Redis-backed), not process memory. (The toolkit's auto-selected session storage is only for ephemeral conversation state.)
- **Broken integrations:** call external APIs against their real contract — correct endpoints, ids and params (e.g. a coin *id* like `the-open-network`, not a ticker like `TON`) — with credentials read from env. Do not invent endpoints or fake responses.
- **Dead code:** the feature's command/handler must be registered via its default-exported `Composer` in `src/handlers/<slug>.ts` (auto-loaded) and reachable from the bot's command surface.
If the spec is genuinely under-specified, implement the smallest REAL slice you can verify and note the gap — never fake behavior to make the PR look complete.
