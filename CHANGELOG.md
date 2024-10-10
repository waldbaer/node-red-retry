# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-10-10

### Features
- Add a second output port where subsequent error messages are routed if the retry limit is exceeded.

### Improvements
- Config editor CSS settings
- Development infrastructure

## [1.0.0] - 2024-09-05

Initial version of the retry node!

### Features
- Limit number of retry approaches.
- Supported retry strategies:
  - 'Immediate'
  - 'Fixed Delay'
  - 'Random Delay'
