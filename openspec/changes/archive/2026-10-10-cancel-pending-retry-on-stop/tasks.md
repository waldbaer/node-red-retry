# Tasks

## 1. Stop handling

- [x] 1.1 In `test/retry_spec.js` add a test with the fixed delay strategy (300 ms) that sends a valid message and an error message, calls `helper.unload()` about 50 ms later, waits until well after the delay has passed and asserts that exactly one send was observed through the `call:send` event (the forward of the valid message). Verify with `npm test -- -g "<test name>"` that it fails against the current code because a second send is observed.
- [x] 1.2 In `nodes/retry.js` register a `close` handler next to the `input` handler that calls `stopTimer(node)`. Verify the test from 1.1 now passes.
- [x] 1.3 Add tests asserting that the last status the node published after `helper.unload()` is exactly `{}`, once for a node stopped during a pending retry and once for a node stopped after a valid message. Verify they fail against the code from 1.2.
- [x] 1.4 Extend the `close` handler to call `node.status({})` after cancelling the timer. Verify the tests from 1.3 pass.
- [x] 1.5 Add an entry to the `Fixes` section under `[Unreleased]` in `CHANGELOG.md` (create the section if it does not exist yet) stating that a pending delayed retry is cancelled and the node status is cleared when the node is stopped or redeployed. Verify the entry renders under the Unreleased heading.

## 2. Verification

- [x] 2.1 Run `npm run lint` and `npm run coverage`. Verify lint is clean, all tests pass and the 100% coverage thresholds hold.
- [x] 2.2 Run `openspec validate cancel-pending-retry-on-stop --strict`. Verify it passes.
