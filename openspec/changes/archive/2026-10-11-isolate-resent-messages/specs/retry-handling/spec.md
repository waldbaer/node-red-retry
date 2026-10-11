# Spec Delta

## ADDED Requirements

### Requirement: Re-sent messages are isolated from each other
The node SHALL re-send, on every retry, a separate copy of the remembered last valid message. Changes that nodes further down the flow make to a re-sent message SHALL NOT alter the remembered message or the content of any later retry.

#### Scenario: Downstream node modifies a re-sent message
- **GIVEN** a remembered valid message and a downstream node that changes the payload of every message it receives
- **WHEN** two error messages arrive, each after the previous retry was sent
- **THEN** retry 1 and retry 2 both carry the payload as it was when the valid message arrived

#### Scenario: Nested content is modified downstream
- **GIVEN** a remembered valid message whose payload is an object with nested properties
- **WHEN** a downstream node changes a nested property of a re-sent message and another error message arrives
- **THEN** the next retry carries the nested property with its original value

#### Scenario: Property added downstream
- **GIVEN** a downstream node that adds a new property to every message it receives
- **WHEN** a retry is sent after an earlier retry was already processed downstream
- **THEN** the later retry does not carry the added property

#### Scenario: Delayed retries
- **GIVEN** a delay strategy and a downstream node that modifies every message it receives
- **WHEN** several delayed retries are sent one after another
- **THEN** each of them carries the content the valid message had when it arrived
