# Spec Delta

## Purpose
Define what happens to a retry node's runtime state when the node is stopped, whether by a deploy that restarts it, by disabling or removing it, or by Node-RED shutting down: pending retries are dropped and the node status no longer reports them.

## ADDED Requirements

### Requirement: Stopping the node cancels a pending retry
The node SHALL cancel a retry that is still waiting for its delay to elapse when the node is stopped, regardless of what caused the stop. A stopped node SHALL NOT send anything on either output.

#### Scenario: Node is restarted by a deploy
- **GIVEN** a retry is waiting for its delay to elapse
- **WHEN** a deploy restarts the node and the delay elapses afterwards
- **THEN** the pending retry is never sent

#### Scenario: Node is disabled or removed
- **GIVEN** a retry is waiting for its delay to elapse
- **WHEN** the node is disabled or removed from the flow and the change is deployed
- **THEN** the pending retry is never sent

#### Scenario: Flows are stopped
- **GIVEN** a retry is waiting for its delay to elapse
- **WHEN** the flows are stopped or Node-RED shuts down
- **THEN** the pending retry is never sent

#### Scenario: Stop without a pending retry
- **GIVEN** no retry is waiting
- **WHEN** the node is stopped
- **THEN** the node stops without sending anything

### Requirement: Stopping the node clears its status
The node SHALL clear its node status when it is stopped, so that the editor does not keep showing a remembered message, an announced retry or a failure that the stopped node no longer stands for.

#### Scenario: Stop during a pending retry
- **GIVEN** the status reads `Retry 1 of 3 in 5.0 sec`
- **WHEN** the node is stopped
- **THEN** the node shows no status

#### Scenario: Restart after a valid message
- **GIVEN** the status reads `Stored valid msg`
- **WHEN** a deploy restarts the node
- **THEN** the restarted node shows no status

#### Scenario: Restart after the retry limit was exceeded
- **GIVEN** the status reads `Failed after retrying 2 times.`
- **WHEN** a deploy restarts the node
- **THEN** the restarted node shows no status
