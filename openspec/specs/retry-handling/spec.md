# retry-handling Specification

## Purpose
Define how the retry node reacts to incoming messages at runtime: forwarding and remembering valid messages, re-sending the last valid message when an error is reported, and handing errors on once the configured number of retries is used up.

## Requirements

### Requirement: Message classification
The node SHALL treat an incoming message that carries an `error` property as an error message and every other incoming message as a valid message. The value of the `error` property SHALL NOT affect this classification.

#### Scenario: Message without error property
- **WHEN** a message without an `error` property arrives
- **THEN** the node handles it as a valid message

#### Scenario: Message caught by a catch node
- **WHEN** a message arrives whose `error` property is the error object attached by a catch node
- **THEN** the node handles it as an error message

#### Scenario: Error property without details
- **WHEN** a message arrives whose `error` property is an empty object or a plain string
- **THEN** the node handles it as an error message

### Requirement: Valid messages are forwarded and remembered
The node SHALL forward every valid message unchanged on its first output and SHALL remember a copy of it as the last valid message, replacing any previously remembered message. The remembered copy SHALL be detached from the forwarded message, so that changes made to the forwarded message further down the flow do not alter it.

#### Scenario: Valid message is passed through
- **WHEN** a valid message arrives
- **THEN** the message is sent on the first output with all of its properties intact
- **AND** nothing is sent on the second output

#### Scenario: Newer valid message replaces the remembered one
- **GIVEN** the node has remembered valid message A
- **WHEN** valid message B arrives and an error message arrives afterwards
- **THEN** message B is re-sent, not message A

#### Scenario: Forwarded message is modified downstream
- **GIVEN** a valid message was forwarded and a downstream node changed its payload
- **WHEN** an error message arrives
- **THEN** the re-sent message carries the payload as it was when the valid message arrived

### Requirement: Error messages trigger a retry
While fewer retries than the configured retry limit have been performed since the last valid message, the node SHALL answer an error message by re-sending the remembered last valid message on its first output, timed according to the configured retry strategy, and SHALL count this as one retry. The error message itself SHALL NOT be forwarded.

#### Scenario: First error after a valid message
- **GIVEN** a retry limit of 3 and a remembered valid message
- **WHEN** an error message arrives
- **THEN** the remembered valid message is re-sent on the first output
- **AND** the error message is sent on neither output

#### Scenario: Repeated errors up to the limit
- **GIVEN** a retry limit of 3 and a remembered valid message
- **WHEN** three error messages arrive, each after the previous retry was sent
- **THEN** the remembered valid message is re-sent three times in total

### Requirement: Retry count restarts with every valid message
The node SHALL count retries relative to the most recent valid message and SHALL reset the count to zero whenever a valid message arrives.

#### Scenario: Valid message after some retries
- **GIVEN** a retry limit of 2 and one retry already performed
- **WHEN** a valid message arrives and two error messages follow
- **THEN** both error messages trigger a retry of the new valid message

#### Scenario: Valid message after the limit was exceeded
- **GIVEN** the retry limit has been exceeded
- **WHEN** a valid message arrives and an error message follows
- **THEN** the new valid message is forwarded and then re-sent as retry 1

### Requirement: Errors before any valid message are skipped
The node SHALL NOT attempt a retry when an error message arrives before any valid message has been received. It SHALL log a warning and send nothing, and SHALL keep working normally for later messages.

#### Scenario: Error message arrives first
- **GIVEN** the node has not received a valid message since it was started
- **WHEN** an error message arrives
- **THEN** nothing is sent on either output
- **AND** the warning `[Retry] Error reported before any valid msg. Skipping retry attempts.` is logged for the node

#### Scenario: Recovery after a skipped error
- **GIVEN** an error message was skipped because no valid message was known
- **WHEN** a valid message arrives
- **THEN** it is forwarded and remembered as usual

### Requirement: Incoming messages cancel a pending retry
The node SHALL cancel a retry that is still waiting for its delay to elapse as soon as any further message arrives, and SHALL then handle the new message by the normal rules. A cancelled retry SHALL still count towards the retry limit.

#### Scenario: Valid message during a pending retry
- **GIVEN** a retry is waiting for its delay to elapse
- **WHEN** a valid message arrives
- **THEN** the pending retry is never sent
- **AND** only the new valid message is forwarded

#### Scenario: Error message during a pending retry
- **GIVEN** a retry limit of 2 and retry 1 waiting for its delay to elapse
- **WHEN** another error message arrives
- **THEN** retry 1 is never sent
- **AND** retry 2 is scheduled with a freshly started delay

#### Scenario: Error message while the last allowed retry is pending
- **GIVEN** a retry limit of 1 and retry 1 waiting for its delay to elapse
- **WHEN** another error message arrives
- **THEN** retry 1 is never sent
- **AND** the new error message is handled as exceeding the retry limit

### Requirement: Errors beyond the retry limit go to the second output
Once the configured number of retries has been performed since the last valid message, the node SHALL stop re-sending and SHALL forward every further error message on its second output, sending nothing on the first output. This SHALL continue until the next valid message arrives.

#### Scenario: Retry limit exceeded
- **GIVEN** a retry limit of 2 and two retries already performed
- **WHEN** a third error message arrives
- **THEN** the error message is sent on the second output
- **AND** nothing is sent on the first output

#### Scenario: Further errors after the limit was exceeded
- **GIVEN** the retry limit has been exceeded
- **WHEN** more error messages arrive
- **THEN** each of them is sent on the second output without any retry

### Requirement: Exhausted retries are noted in the error message
When an error message exceeds the retry limit and has an `error.message`, the node SHALL extend that text to `<original message> ([Retry] Failed after retrying <N> times.)`, where `<N>` is the number of retries performed. Error messages without an `error.message` SHALL be passed on unchanged.

#### Scenario: Error with a message text
- **GIVEN** a retry limit of 2 that has been used up
- **WHEN** an error message with `error.message` set to `boom` arrives
- **THEN** the message sent on the second output has `error.message` set to `boom ([Retry] Failed after retrying 2 times.)`
- **AND** its other properties are unchanged

#### Scenario: Error without a message text
- **GIVEN** the retry limit has been used up
- **WHEN** an error message arrives whose `error` property has no `message`
- **THEN** the message is sent on the second output unchanged

### Requirement: Optional re-throw when the retry limit is exceeded
When the option to throw on an exceeded retry limit is enabled, the node SHALL, in addition to using the second output, raise a Node-RED error for every error message beyond the limit, attaching that message so that a catch node watching the retry node receives it. When the option is disabled, the node SHALL NOT raise an error.

#### Scenario: Re-throw enabled
- **GIVEN** the option is enabled and a retry limit of 2 has been used up
- **WHEN** an error message with `error.message` set to `boom` arrives
- **THEN** the node raises the error `boom ([Retry] Failed after retrying 2 times.)` with the error message attached
- **AND** the error message is also sent on the second output

#### Scenario: Re-throw enabled for an error without message text
- **GIVEN** the option is enabled and a retry limit of 2 has been used up
- **WHEN** an error message without `error.message` arrives
- **THEN** the node raises the error `Failed after retrying 2 times.`

#### Scenario: Re-throw disabled
- **GIVEN** the option is disabled and the retry limit has been used up
- **WHEN** an error message arrives
- **THEN** the node raises no error
- **AND** the error message is sent on the second output

### Requirement: Node status shows the retry state
The node SHALL publish its state as node status: a green dot reading `Stored valid msg` after a valid message, a yellow dot reading `Retry <n> of <limit>` when a retry is triggered, and a red dot reading `Failed after retrying <N> times.` when the retry limit is exceeded. For a delayed retry the yellow status SHALL also state the delay with one decimal place and its unit.

#### Scenario: Valid message received
- **WHEN** a valid message arrives
- **THEN** the status is a green dot with the text `Stored valid msg`

#### Scenario: Immediate retry
- **GIVEN** the immediate strategy and a retry limit of 3
- **WHEN** the first error message arrives
- **THEN** the status is a yellow dot with the text `Retry 1 of 3`

#### Scenario: Delayed retry
- **GIVEN** the fixed delay strategy with a delay of 5 seconds and a retry limit of 3
- **WHEN** the first error message arrives
- **THEN** the status is a yellow dot with the text `Retry 1 of 3 in 5.0 sec`

#### Scenario: Retry limit exceeded
- **GIVEN** a retry limit of 2 that has been used up
- **WHEN** another error message arrives
- **THEN** the status is a red dot with the text `Failed after retrying 2 times.`
