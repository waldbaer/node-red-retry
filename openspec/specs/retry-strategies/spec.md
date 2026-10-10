# retry-strategies Specification

## Purpose
Define when a triggered retry is actually re-sent: the selectable retry strategies (immediate, fixed delay, random delay) and the time units in which their delays are expressed.

## Requirements

### Requirement: Selectable retry strategy
The node SHALL apply exactly one of three retry strategies to every retry it triggers, as selected in its configuration: immediate (`immediate`), fixed delay (`fixed_delay`) or random delay (`random_delay`).

#### Scenario: Strategy applies to all retries
- **GIVEN** a node configured with the fixed delay strategy
- **WHEN** several retries are triggered one after another
- **THEN** every one of them is re-sent after the configured fixed delay

### Requirement: Immediate strategy
With the immediate strategy the node SHALL re-send the last valid message without any waiting time, as part of handling the error message that triggered the retry.

#### Scenario: Retry without delay
- **GIVEN** the immediate strategy
- **WHEN** an error message triggers a retry
- **THEN** the last valid message is re-sent right away

### Requirement: Fixed delay strategy
With the fixed delay strategy the node SHALL re-send the last valid message once the configured delay has elapsed since the triggering error message arrived. The same delay SHALL be used for every retry.

#### Scenario: Retry after the configured delay
- **GIVEN** the fixed delay strategy with a delay of 5 seconds
- **WHEN** an error message triggers a retry
- **THEN** the last valid message is re-sent 5 seconds later

#### Scenario: Fractional delay value
- **GIVEN** the fixed delay strategy with a delay of 0.6 seconds
- **WHEN** an error message triggers a retry
- **THEN** the last valid message is re-sent 600 milliseconds later

### Requirement: Random delay strategy
With the random delay strategy the node SHALL pick a new random waiting time for every retry, anywhere between the configured minimum and maximum (both included) with millisecond resolution, and SHALL re-send the last valid message once that time has elapsed.

#### Scenario: Delay within the configured range
- **GIVEN** the random delay strategy with a range of 3 to 10 seconds
- **WHEN** an error message triggers a retry
- **THEN** the last valid message is re-sent no earlier than 3 seconds and no later than 10 seconds afterwards

#### Scenario: New delay for every retry
- **GIVEN** the random delay strategy with a range of 3 to 10 seconds
- **WHEN** two retries are triggered one after another
- **THEN** the waiting time is determined separately for each of them

#### Scenario: Identical minimum and maximum
- **GIVEN** the random delay strategy with minimum and maximum both set to 500 milliseconds
- **WHEN** an error message triggers a retry
- **THEN** the last valid message is re-sent 500 milliseconds later

### Requirement: Delay time units
The node SHALL interpret delay values in the unit configured for the strategy: milliseconds (`ms`), seconds (`sec`), minutes (`min`) or hours (`h`). The fixed delay and the random delay range SHALL each have their own unit, and the unit of the random delay SHALL apply to both its minimum and its maximum.

#### Scenario: Milliseconds
- **WHEN** a delay of 200 is configured with the unit `ms`
- **THEN** the delay lasts 200 milliseconds

#### Scenario: Seconds
- **WHEN** a delay of 2 is configured with the unit `sec`
- **THEN** the delay lasts 2,000 milliseconds

#### Scenario: Minutes
- **WHEN** a delay of 2 is configured with the unit `min`
- **THEN** the delay lasts 120,000 milliseconds

#### Scenario: Hours
- **WHEN** a delay of 1 is configured with the unit `h`
- **THEN** the delay lasts 3,600,000 milliseconds

#### Scenario: Random delay range in minutes
- **GIVEN** the random delay strategy with a range of 1 to 3 and the unit `min`
- **WHEN** an error message triggers a retry
- **THEN** the waiting time lies between 60,000 and 180,000 milliseconds
