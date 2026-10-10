# Design

## Context

See proposal.md - Why.

Current state:

- `nodes/retry.js` registers only an `input` handler. The delay timer handle lives in `node.timerHandle` and is cleared by `stopTimer(node)` when another message arrives, never when the node closes.
- Node-RED calls a node's `close` handlers when it stops the node (deploy that restarts it, disable, removal, flows stopped, shutdown) and removes the `input` listeners afterwards. Timers a node created are left alone.
- Observed with a probe against the current code (fixed delay 300 ms, flows unloaded 50 ms after the error message): `send@0`, `unload@50`, `unloaded@50`, `send@301`. The retry is sent 250 ms after the node was closed.
- Node-RED retains the last status per node id and does not clear it when the node stops. The editor shows it until the node publishes another status. The core delay and trigger nodes clear or reset their status in their own `close` handlers for this reason.

## Goals / Non-Goals

**Goals:**

- No timer of a retry node outlives the node instance.
- The status shown in the editor never refers to state of a stopped instance.

**Non-Goals:**

- Keeping the remembered message or the retry count across a restart. A restarted node starts empty, as today.
- Flushing a pending retry when the node stops. Sending during a stop would target nodes that are stopping too.
- Any change to status handling while the node is running.
- The other findings from the spec reverse-engineering (`retryStrategy` default, editor/runtime validation differences).

## Decisions

### One `close` handler that cancels the timer and clears the status

Register `node.on('close', ...)` next to the `input` handler. It calls the existing `stopTimer(node)` and then `node.status({})`.

- Reusing `stopTimer` keeps a single place that knows how a pending retry is cancelled. It already handles the cases with no timer (immediate strategy, nothing pending).
- The handler is registered after the configuration check, together with the `input` handler. A node with invalid configuration never starts a timer or sets a status, so it needs no stop handling.

Alternative considered: guard the timer callback with a "closed" flag instead of clearing the timer. Rejected because the timer would stay alive for up to hours for nothing, together with the stopped instance and the message it remembers.

### Synchronous handler without `done`

Cancelling a timer and publishing a status are synchronous. Taking the `done` callback would only add a way to hang the stop.

### Clear the status unconditionally

The status is cleared on every stop, not only when a retry was pending. All three status texts describe state of the instance that is going away (remembered message, announced retry, exceeded limit), and the replacement instance starts without any of it.

Alternative considered: clear only when a retry was pending. Rejected because `Stored valid msg` after a restart is just as wrong, and a conditional adds a branch for no benefit.

### Tests stop the node through the test helper

Tests call `helper.unload()` while a delayed retry is pending, wait until the delay has passed, and assert on the node's `send` and `status` spies. This exercises the same close path Node-RED uses, and matches the probe that showed the defect. Each test is first run against the current code to confirm it fails for the right reason.

## Risks / Trade-offs

- [A flow depends on a retry that arrives after a redeploy] → That retry came from a node instance that was no longer part of the running flow, so nothing can depend on it on purpose. Called out in the changelog as a fix.
- [Status disappears on deploy for users who liked seeing the last state] → Only nodes that are actually restarted lose their status; with "modified nodes" or "modified flows" deploys, untouched retry nodes keep running and keep their status. The cleared status is the accurate one.
- [Overlap with `isolate-resent-messages` in `nodes/retry.js`, `test/retry_spec.js` and `CHANGELOG.md`] → Different places in each file. Whichever change is applied second adds to the `Fixes` section the first one created.

## Migration Plan

No migration. The fix ships with the next release and needs no change to settings or stored flows. Rollback is removing the `close` handler.
