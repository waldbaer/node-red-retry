# Proposal

## Why

The retry node hands its stored last valid message to the flow by reference when it retries. Any change a downstream node makes to a re-sent message therefore lands in the stored message and is carried into every following retry, so retry 2 no longer re-sends what originally arrived. A flow that sets, appends or counts something on the message before the failing node (a typical change or function node in front of an HTTP request) gets a different input on each retry, which defeats the purpose of "re-send the last valid message".

## What Changes

- Every retry re-sends its own copy of the last valid message, so the content of a re-sent message is always the content the valid message had when it arrived, no matter what downstream nodes did to earlier re-sent messages.
- The stored message is never handed out, so it stays unchanged until the next valid message replaces it.
- Behavior change for existing flows: modifications made downstream during one retry no longer show up in the next retry. A flow that relied on this (for example a counter kept on the message across retries) will see the original content each time.
- No change to the first forward of a valid message, to retry timing and counting, or to the handling of errors beyond the retry limit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retry-handling`: adds the requirement that re-sent messages are isolated from the stored message and from each other.

## Impact

- Code: `nodes/retry.js`, the point where a retry is sent.
- Tests: `test/retry_spec.js` gains coverage for a downstream node that modifies the messages it receives.
- Docs: entry in `CHANGELOG.md` under Unreleased. README, editor help and the example flow already describe the intended behavior and stay as they are.
- Runtime cost: one additional message copy per retry.
- No change to node settings, stored flows, dependencies or supported versions.
