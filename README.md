# Cortex Plugin Swarm

Multi-Agent Swarm Orchestrator — Coordinates swarms of sub-agents with role specialization
(architect, coder, reviewer, tester). Each sub-agent gets scoped tools and a dedicated AGENT.md
policy.

## Installation

```bash
cortex plugin install marketplace:cortex-plugin-swarm

cortex plugin install github:CortexPrism/cortex-plugin-swarm

cortex plugin install ./manifest.json
```

## Quick Start

```bash
cortex plugin enable cortex-plugin-swarm
cortex tools list
```

## Capabilities

| Capability  | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `tools`     | required | Core tool registration                         |
| `shell:run` | optional | Shell execution for agent task automation      |
| `fs:read`   | optional | Filesystem access for reading policy documents |

## Tools

### swarm_create

Create a swarm of specialist sub-agents for a task.

**Parameters:**

- `task` (string, required) — The main task description for the swarm
- `roles` (string, required) — Comma-separated list of roles (e.g.
  `architect,coder,reviewer,tester`)
- `max_agents` (number, optional) — Maximum number of agents in the swarm (default: 4)
- `policy` (string, optional) — Custom AGENT.md policy content for the swarm agents

**Example:**

```bash
cortex tool call swarm_create \
  --task "Build a REST API for user management" \
  --roles "architect,coder,reviewer,tester" \
  --max_agents 4
```

---

### swarm_delegate

Delegate a sub-task to a specific agent in the swarm.

**Parameters:**

- `swarm_id` (string, required) — The swarm ID to delegate to
- `agent_role` (string, required) — The role of the agent (e.g. `architect`, `coder`)
- `sub_task` (string, required) — The sub-task to delegate
- `context` (string, optional) — Additional context for the sub-task

**Example:**

```bash
cortex tool call swarm_delegate \
  --swarm_id "swarm-1-1718400000000" \
  --agent_role "architect" \
  --sub_task "Design the database schema for users table" \
  --context "Use PostgreSQL with UUID primary keys"
```

---

### swarm_coordinate

Coordinate results from all agents and synthesize a final answer.

**Parameters:**

- `swarm_id` (string, required) — The swarm ID to coordinate
- `merge_strategy` (string, optional) — Strategy for merging results: `consensus`, `best`,
  `sequential` (default: `best`)

**Example:**

```bash
cortex tool call swarm_coordinate \
  --swarm_id "swarm-1-1718400000000" \
  --merge_strategy "consensus"
```

---

### swarm_status

Check the status of a running swarm.

**Parameters:**

- `swarm_id` (string, required) — The swarm ID to check

**Example:**

```bash
cortex tool call swarm_status --swarm_id "swarm-1-1718400000000"
```

---

### swarm_terminate

Terminate a swarm and clean up resources.

**Parameters:**

- `swarm_id` (string, required) — The swarm ID to terminate

**Example:**

```bash
cortex tool call swarm_terminate --swarm_id "swarm-1-1718400000000"
```

## Configuration

Configure in `~/.cortex/config.json`:

```json
{
  "plugins": {
    "cortex-plugin-swarm": {
      "enabled": true,
      "config": {
        "defaultMaxAgents": 4,
        "defaultMergeStrategy": "best"
      }
    }
  }
}
```

### Settings

| Setting                | Type   | Default | Description                                   |
| ---------------------- | ------ | ------- | --------------------------------------------- |
| `defaultMaxAgents`     | number | 4       | Default maximum agents per swarm (1-20)       |
| `defaultMergeStrategy` | select | `best`  | Default merge strategy for swarm coordination |

## Usage Examples

### Full Workflow

```bash
SWARM=$(cortex tool call swarm_create \
  --task "Implement user authentication" \
  --roles "architect,coder,reviewer,tester")

cortex tool call swarm_delegate \
  --swarm_id "$SWARM_ID" \
  --agent_role "architect" \
  --sub_task "Design auth flow with JWT tokens"

cortex tool call swarm_delegate \
  --swarm_id "$SWARM_ID" \
  --agent_role "coder" \
  --sub_task "Implement login endpoint" \
  --context "Use the architect's design document"

cortex tool call swarm_coordinate \
  --swarm_id "$SWARM_ID" \
  --merge_strategy "best"

cortex tool call swarm_status --swarm_id "$SWARM_ID"
cortex tool call swarm_terminate --swarm_id "$SWARM_ID"
```

## AI Disclosure

This plugin was developed with AI assistance. See [AI.md](./AI.md) for details.

## License

MIT — See [LICENSE](./LICENSE) file

## Support

- [Developing Plugins](../docs/developing.md)
- [Plugin Best Practices](../docs/best-practices.md)
- [Manifest Reference](../docs/manifest-reference.md)
- [Discord Community](https://discord.gg/y7DkaEbPQC)
- [Report Issues](https://github.com/CortexPrism/cortex-plugin-swarm/issues)
