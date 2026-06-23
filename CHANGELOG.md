# Changelog


## [1.0.3] — 2026-06-22

### Changed

- Migrated to CortexPrism v0.51.0 plugin API
- Renamed `ToolResult` → `ToolCallResult` to match SDK types
- Switched type imports from local `types.ts` to `cortex/plugins` module
- Updated `peerDependencies.cortex` to `>=0.51.0`
- Standardized UI settings: `default` → `defaultValue`, `enum` → `options` for select fields
- All code passes `deno fmt` and `deno lint`
## [Unreleased]

### Added

- Unit test suite for all tools

### Changed

- Renamed manifest file from `cortex.json` to `manifest.json` for consistency with Cortex standard
- Standardized UI section structure to `ui.settings` format
- Normalized parameter naming: `defaultValue` → `default`, `options` → `enum`
- Added `homepage` field with repository URL
- Added `dependencies` field to manifest

### Fixed

- Replaced `console.log` with `ctx.logger.info()` in lifecycle hooks

## [1.0.1] — 2026-06-15

### Added

- Initial release

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
