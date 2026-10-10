# node-configuration Specification

## Purpose
Define the settings a retry node is configured with in a flow, the defaults that apply when a setting is absent, and how the node behaves when it is started with settings that are invalid or contradict each other.

## Requirements

### Requirement: Retry limit setting
The node SHALL take the maximum number of retries from the `retryAttempts` setting, which MUST be a number of at least 1, given either as a number or as numeric text. When the setting is absent the node SHALL use 3.

#### Scenario: Explicit retry limit
- **WHEN** a node is started with `retryAttempts` set to 2
- **THEN** it performs at most 2 retries per valid message

#### Scenario: Retry limit given as text
- **WHEN** a node is started with `retryAttempts` set to the text `2`
- **THEN** it behaves as if the number 2 had been configured

#### Scenario: Retry limit absent
- **WHEN** a node is started without a `retryAttempts` setting
- **THEN** it uses a retry limit of 3

#### Scenario: Retry limit below 1
- **WHEN** a node is started with `retryAttempts` set to 0
- **THEN** its configuration is invalid

#### Scenario: Non-numeric retry limit
- **WHEN** a node is started with `retryAttempts` set to `not_a_number`
- **THEN** its configuration is invalid

### Requirement: Retry strategy setting
The node SHALL take its retry strategy from the `retryStrategy` setting, which MUST be one of `immediate`, `fixed_delay` or `random_delay`. A node started without this setting or with any other value SHALL be treated as invalidly configured.

#### Scenario: Supported strategy
- **WHEN** a node is started with `retryStrategy` set to `random_delay`
- **THEN** it uses the random delay strategy

#### Scenario: Unknown strategy
- **WHEN** a node is started with `retryStrategy` set to `invalid_retry_strategy`
- **THEN** its configuration is invalid

#### Scenario: Strategy absent
- **WHEN** a node is started without a `retryStrategy` setting
- **THEN** its configuration is invalid

### Requirement: Fixed delay settings
The node SHALL take the fixed delay from `retryStrategyFixedDelay`, which MUST be numeric, and its unit from `retryStrategyFixedDelayUnit`, which MUST be one of `ms`, `sec`, `min` or `h`. When absent, the delay SHALL default to 5 and the unit to `sec`.

#### Scenario: Fixed delay settings absent
- **WHEN** a node is started with the fixed delay strategy and without fixed delay settings
- **THEN** a fixed delay of 5 seconds applies

#### Scenario: Non-numeric fixed delay
- **WHEN** a node is started with `retryStrategyFixedDelay` set to `not_a_number`
- **THEN** its configuration is invalid

#### Scenario: Unknown fixed delay unit
- **WHEN** a node is started with `retryStrategyFixedDelayUnit` set to `invalid_duration_unit`
- **THEN** its configuration is invalid

### Requirement: Random delay settings
The node SHALL take the random delay range from `retryStrategyRandomDelayMin` and `retryStrategyRandomDelayMax`, which MUST be numeric with the minimum not greater than the maximum, and its unit from `retryStrategyRandomDelayUnit`, which MUST be one of `ms`, `sec`, `min` or `h`. When absent, the range SHALL default to 3 to 10 and the unit to `sec`.

#### Scenario: Random delay settings absent
- **WHEN** a node is started with the random delay strategy and without random delay settings
- **THEN** a random delay between 3 and 10 seconds applies

#### Scenario: Minimum greater than maximum
- **WHEN** a node is started with a minimum of 5 and a maximum of 4
- **THEN** its configuration is invalid

#### Scenario: Minimum equal to maximum
- **WHEN** a node is started with a minimum of 5 and a maximum of 5
- **THEN** its configuration is valid

#### Scenario: Non-numeric range value
- **WHEN** a node is started with `retryStrategyRandomDelayMin` or `retryStrategyRandomDelayMax` set to `not_a_number`
- **THEN** its configuration is invalid

#### Scenario: Unknown random delay unit
- **WHEN** a node is started with `retryStrategyRandomDelayUnit` set to `invalid_duration_unit`
- **THEN** its configuration is invalid

### Requirement: Re-throw setting
The node SHALL take the choice whether to raise an error once the retry limit is exceeded from the `throwAsErrorOnLimitExceeded` setting, which MUST be a boolean. When the setting is absent, raising the error SHALL be enabled.

#### Scenario: Re-throw setting absent
- **WHEN** a node is started without a `throwAsErrorOnLimitExceeded` setting
- **THEN** it raises an error once the retry limit is exceeded

#### Scenario: Non-boolean re-throw setting
- **WHEN** a node is started with `throwAsErrorOnLimitExceeded` set to the text `text_instead_boolean`
- **THEN** its configuration is invalid

### Requirement: Settings of unused strategies are checked too
The node SHALL validate all of its settings when it is started, including the delay settings of strategies that are not selected.

#### Scenario: Invalid setting of an unused strategy
- **GIVEN** a node configured with the immediate strategy
- **WHEN** it is started with a non-numeric `retryStrategyRandomDelayMin`
- **THEN** its configuration is invalid

### Requirement: Invalid configuration disables the node
A node whose configuration is invalid SHALL report this once when it is started, by logging the error `[Retry] Incorrect or inconsistent configuration of retry node '<name>' with ID <id>. Skipping further processing.`, and SHALL then ignore every incoming message.

#### Scenario: Error is reported at start
- **WHEN** a node named `my retry` with the ID `abc123` is started with an invalid configuration
- **THEN** the error `[Retry] Incorrect or inconsistent configuration of retry node 'my retry' with ID abc123. Skipping further processing.` is logged for the node

#### Scenario: Messages are ignored
- **GIVEN** a node that was started with an invalid configuration
- **WHEN** valid or error messages arrive
- **THEN** nothing is sent on either output
