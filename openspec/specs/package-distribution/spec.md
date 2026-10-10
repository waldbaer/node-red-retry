# package-distribution Specification

## Purpose
Define what the published npm package `@waldbaer/node-red-retry` provides to a Node-RED installation: the node type it registers, the example flow it ships and the runtime versions it declares support for.

## Requirements

### Requirement: Package provides the retry node type
The package `@waldbaer/node-red-retry` SHALL register exactly one node type, `retry`, with the Node-RED runtime and editor when it is installed.

#### Scenario: Package installed
- **WHEN** the package is installed into a Node-RED instance through the palette manager or with npm
- **THEN** flows can use nodes of type `retry`

### Requirement: Bundled example flow
The package SHALL ship the example flow `Simple Catch and Retry`, importable through the editor's examples import. The example SHALL show the recommended wiring: a retry node in front of a node that may fail, a catch node limited to that node feeding the retry node, a consumer on the second output, and a separate catch node for errors raised by the retry node itself.

#### Scenario: Example is importable
- **WHEN** the user opens the examples import of an editor that has the package installed
- **THEN** `Simple Catch and Retry` is offered under `@waldbaer/node-red-retry`

#### Scenario: Example runs without further setup
- **WHEN** the user imports and deploys the example and triggers its inject node
- **THEN** the injected message passes the retry node into a function node that fails at random
- **AND** failures are retried up to 2 times after a random delay of 1 to 3 seconds
- **AND** errors beyond that reach the debug nodes on the second output and behind the catch node watching the retry node

### Requirement: Supported runtime versions
The package SHALL declare compatibility with Node-RED 1.3.0 or newer and with Node.js 8 or newer.

#### Scenario: Compatibility metadata
- **WHEN** the package metadata is inspected
- **THEN** it states Node-RED `>=1.3.0` and Node.js `>=8` as supported
