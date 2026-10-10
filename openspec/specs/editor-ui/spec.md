# editor-ui Specification

## Purpose
Define how the retry node presents itself in the Node-RED editor: its palette entry and ports, the label shown in the workspace, the edit dialog with its strategy-dependent fields, the validation applied while editing, and the built-in help text.

## Requirements

### Requirement: Palette entry and ports
The editor SHALL offer the node as `retry` in the `function` palette category with a repeat icon, one input and two outputs. The ports SHALL be labelled: input `valid or error msg`, first output `valid or repeated last valid input msg`, second output `error msg if retry limit is exceeded`.

#### Scenario: Node in the palette
- **WHEN** the user opens the palette of an editor that has the package installed
- **THEN** the `retry` node is listed in the `function` category

#### Scenario: Port labels
- **WHEN** the user hovers over the ports of a retry node in the workspace
- **THEN** the input shows `valid or error msg`, the first output `valid or repeated last valid input msg` and the second output `error msg if retry limit is exceeded`

### Requirement: Defaults for new nodes
A retry node newly added to a flow SHALL be preset with 3 retries, the Fixed Delay strategy with a delay of 5 seconds, a random delay range of 3 to 10 seconds, re-throwing on an exceeded retry limit enabled, and no name.

#### Scenario: Node dragged from the palette
- **WHEN** the user drags a retry node into the workspace and opens its edit dialog
- **THEN** Retries is 3, Strategy is Fixed Delay and Delay is 5 `sec`
- **AND** `Throw as Error If Retry Limit Is Exceeded` is ticked

#### Scenario: Random delay preset
- **WHEN** the user switches a newly added node to the Random Delay strategy
- **THEN** the range reads 3 .. 10 `sec`

### Requirement: Node label
The editor SHALL label a retry node with its name if one is set. Otherwise the label SHALL summarise the configuration as `<N> retries` (`1 retry` for a single retry), followed by ` (<delay> <unit>)` for the Fixed Delay strategy or ` (<min>..<max> <unit>)` for the Random Delay strategy, and by nothing for the Immediate strategy.

#### Scenario: Named node
- **WHEN** a retry node has the name `Retry HTTP request`
- **THEN** its label is `Retry HTTP request`

#### Scenario: Unnamed node with fixed delay
- **WHEN** an unnamed node is configured with 3 retries and a fixed delay of 5 `sec`
- **THEN** its label is `3 retries (5 sec)`

#### Scenario: Unnamed node with random delay
- **WHEN** an unnamed node is configured with 2 retries and a random delay of 1 to 3 `sec`
- **THEN** its label is `2 retries (1..3 sec)`

#### Scenario: Unnamed node with a single immediate retry
- **WHEN** an unnamed node is configured with 1 retry and the Immediate strategy
- **THEN** its label is `1 retry`

### Requirement: Edit dialog settings
The edit dialog SHALL let the user set: Name; Retries; Strategy with the choices Immediate, Fixed Delay and Random Delay; a Delay with unit for the Fixed Delay strategy; a Between range (minimum .. maximum) with unit for the Random Delay strategy; and the checkbox `Throw as Error If Retry Limit Is Exceeded`. Units SHALL be selectable from `ms`, `sec`, `min` and `h`.

#### Scenario: Strategy choices
- **WHEN** the user opens the Strategy list
- **THEN** it offers Immediate, Fixed Delay and Random Delay

#### Scenario: Unit choices
- **WHEN** the user opens the unit list of the Delay or the Between range
- **THEN** it offers `ms`, `sec`, `min` and `h`

#### Scenario: Stored settings are shown
- **WHEN** the user opens the dialog of a node configured with 2 retries and a random delay of 1 to 3 `sec`
- **THEN** Retries is 2, Strategy is Random Delay and the range reads 1 .. 3 `sec`

### Requirement: Strategy-specific fields
The edit dialog SHALL show only the delay fields that belong to the currently selected strategy, both when the dialog opens and whenever the selection changes: none for Immediate, the Delay and its unit for Fixed Delay, the Between range and its unit for Random Delay.

#### Scenario: Immediate selected
- **WHEN** the user selects the Immediate strategy
- **THEN** neither the Delay nor the Between range is shown

#### Scenario: Fixed Delay selected
- **WHEN** the user selects the Fixed Delay strategy
- **THEN** the Delay and its unit are shown and the Between range is hidden

#### Scenario: Random Delay selected
- **WHEN** the user selects the Random Delay strategy
- **THEN** the Between range and its unit are shown and the Delay is hidden

#### Scenario: Dialog opened for a stored strategy
- **WHEN** the user opens the dialog of a node configured with the Random Delay strategy
- **THEN** the Between range is shown and the Delay is hidden

### Requirement: Validation while editing
The editor SHALL mark a node as invalid when Retries is not a number of at least 1, when Fixed Delay is selected and the Delay is not a number of at least 1, or when Random Delay is selected and the minimum or maximum is not a number of at least 1 or the minimum exceeds the maximum. Delay fields of a strategy that is not selected SHALL NOT be validated.

#### Scenario: Retries below 1
- **WHEN** the user enters 0 as Retries
- **THEN** the field is marked as invalid

#### Scenario: Fixed delay below 1
- **WHEN** Fixed Delay is selected and the user enters 0.5 as Delay
- **THEN** the field is marked as invalid

#### Scenario: Random delay minimum above maximum
- **WHEN** Random Delay is selected and the user enters a minimum of 5 and a maximum of 4
- **THEN** the range fields are marked as invalid

#### Scenario: Random delay with identical bounds
- **WHEN** Random Delay is selected and the user enters 5 as both minimum and maximum
- **THEN** the range fields are valid

#### Scenario: Fields of an unselected strategy
- **WHEN** Immediate is selected while the hidden Delay and Between fields hold values that would otherwise be rejected
- **THEN** the node is not marked as invalid because of them

### Requirement: Numeric fields can be stepped
The edit dialog SHALL offer step controls on the numeric fields Retries, Delay and the Between minimum and maximum, and stepping SHALL NOT take a value below 1.

#### Scenario: Stepping down at the lower bound
- **WHEN** Retries is 1 and the user steps the value down
- **THEN** the value stays at 1

### Requirement: Built-in help
The editor SHALL provide help text for the retry node in the help sidebar, covering its settings, the meaning of the `error` property on incoming messages, both outputs, the intended wiring with a catch node and a step-by-step usage guide.

#### Scenario: Help for a selected node
- **WHEN** the user selects a retry node and opens the help sidebar
- **THEN** the help explains the settings, the input, both outputs and how to wire the node together with a catch node
