# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-06-17

## [1.0.0] — 2026-06-15

### Added

- Initial release of cortex-plugin-swarm (Multi-Agent Swarm Orchestrator)
- `swarm_create` tool — Create swarms of specialist sub-agents with role specialization
- `swarm_delegate` tool — Delegate sub-tasks to specific agents by role
- `swarm_coordinate` tool — Coordinate agent results with configurable merge strategies (consensus,
  best, sequential)
- `swarm_status` tool — Check the status of running swarms
- `swarm_terminate` tool — Terminate swarms and clean up resources
- In-memory swarm management with agent state tracking
- Configurable default max agents (1-20) via plugin settings
- Configurable default merge strategy via plugin settings
- Module-level configuration loaded at plugin startup via onLoad
- Input validation on all tool parameters with descriptive error messages
