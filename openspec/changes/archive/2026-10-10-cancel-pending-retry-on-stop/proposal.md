# Proposal

## Why

A retry node that is waiting for a delay keeps its timer when the node is stopped, so the retry still fires after a redeploy, after the node was disabled or removed, or while Node-RED is shutting down. The message is then sent by a node instance that is no longer part of the running flow, at a moment the user has just told the flow to stop or change. With delays of minutes or hours this can happen long after the deploy.

## What Changes

- Stopping a retry node cancels a retry that is still waiting for its delay. A stopped node sends nothing.
- Stopping a retry node clears its node status. Without this, the editor would keep showing `Retry 1 of 3 in 5.0 sec` for a retry that was just cancelled, because Node-RED keeps the last status of a node until the node publishes a new one. The same already applies today to `Stored valid msg` and `Failed after retrying ...` after a restart: the restarted node has no remembered message and no retry count, but the old status stays visible.
- No change to behavior while the node is running, and no change to what a restarted node knows: it starts without a remembered message, as today.

## Capabilities

### New Capabilities

- `node-lifecycle`: what happens to a retry node's pending retry and status when the node is stopped (deploy that restarts it, disabling, removal, Node-RED shutdown).

### Modified Capabilities

None.

## Impact

- Code: `nodes/retry.js`, node registration gains stop handling.
- Tests: `test/retry_spec.js` gains tests that stop the node during a pending retry and check outputs and status.
- Docs: entry in `CHANGELOG.md` under Unreleased.
- Other open change: `isolate-resent-messages` touches the same three files in different places. The two changes are independent and can be applied in either order.
- No change to node settings, stored flows, dependencies or supported versions.
