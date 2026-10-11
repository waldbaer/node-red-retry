# Design

## Context

See proposal.md - Why.

Current state in `nodes/retry.js`:

- A valid message is stored as `RED.util.cloneMessage(msg)` and the original is forwarded. The store is therefore detached from the first forward.
- A retry calls `node.send(node.lastValidMsg)`, either directly or from the delay timer. Node-RED's `send` delivers the object itself to the first wired node and only clones for additional recipients, so the first downstream node works on the stored object.

Observed with a probe against the current code (downstream node increments `payload.touched`): output 1 sees `{a:1}`, `{a:1}`, `{a:1,touched:1}`, `{a:1,touched:2}` for the forward and three retries.

## Goals / Non-Goals

**Goals:**

- The stored message is never reachable from outside the node.
- One code path for immediate and delayed retries.

**Non-Goals:**

- Giving re-sent messages a new `_msgid`. Copies keep the id of the valid message, as today.
- Any change to how valid messages are stored or forwarded.
- The other findings from the spec reverse-engineering (missing close handler, `retryStrategy` default, editor/runtime validation differences).

## Decisions

### Copy the stored message at the moment a retry is sent

The retry callback sends `RED.util.cloneMessage(node.lastValidMsg)` instead of the stored object. The copy is made inside the callback, so it happens when the retry actually leaves the node, for immediate and delayed retries alike.

Alternatives considered:

- **Copy when the retry is scheduled.** Same result, but keeps a second copy alive for the whole delay and copies messages for retries that are later cancelled.
- **Send the stored object and replace the store with a fresh copy beforehand.** Equivalent isolation with more state handling and no benefit.
- **Deep-freeze the stored message.** Would make downstream nodes that legitimately modify messages throw.
- **Rely on Node-RED cloning in `send`.** Not available: the first recipient always gets the object itself (`cloneMessage: false` for a single wire, and for the first wire otherwise).

### Use `RED.util.cloneMessage`

It is the same utility that creates the store, so the forward, the store and every retry follow identical copy semantics: deep copy of the message, `_msgid` preserved. No new dependency.

Alternative considered: `structuredClone`. Rejected because it rejects values that `cloneMessage` handles, such as functions, and would give retries different copy semantics than the store.

### Tests observe the message at the downstream node

Existing tests watch `call:send` on the retry node, which cannot show a leak. The new tests use the helper node already wired to output 1, record a snapshot of each received message, then modify it (change a nested value, add a property). Assertions compare all snapshots to the original content.

## Risks / Trade-offs

- [A flow relies on modifications carrying over between retries, for example a counter kept on the message] → Called out in the changelog as a fix with changed behavior. Such state belongs in node or flow context.
- [One more deep copy per retry, noticeable for very large payloads] → Same cost as the copy already made for every valid message, and only paid when a retry is sent.
- [Values that do not survive a deep copy unchanged, such as class instances or handles] → Already true for the stored message today, since it is a copy of the original. No new class of problem.

## Migration Plan

No migration. The fix ships with the next release and needs no change to settings or stored flows. Rollback is reverting the single send call.
