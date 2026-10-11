# Tasks

## 1. Isolate re-sent messages

- [x] 1.1 In `test/retry_spec.js` add a test with the immediate strategy and 3 retries in which the helper node on output 1 records a snapshot of every message it receives and then modifies it (change a nested payload value, add a new property). Assert that the forward and all three retries carry the original content. Verify with `npm test -- -g "<test name>"` that it fails on the second retry against the current code.
- [x] 1.2 In `nodes/retry.js` change the retry callback in `handleErrorMsg` to send `RED.util.cloneMessage(node.lastValidMsg)`, created inside the callback. Verify the test from 1.1 now passes.
- [x] 1.3 Add the same check for delayed retries using the fixed delay strategy with a short delay (100 ms). Verify the test passes.
- [x] 1.4 Add a `Fixes` entry under `[Unreleased]` in `CHANGELOG.md` stating that every retry now re-sends its own copy of the last valid message and that downstream modifications no longer carry over into later retries. Verify the entry renders under the Unreleased heading.

## 2. Verification

- [x] 2.1 Run `npm run lint` and `npm run coverage`. Verify lint is clean, all tests pass and the 100% coverage thresholds hold.
- [x] 2.2 Run `openspec validate isolate-resent-messages --strict`. Verify it passes.
