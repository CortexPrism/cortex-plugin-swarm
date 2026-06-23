import type { PluginContext, Tool, ToolCallResult } from 'cortex/plugins';

const VALID_MERGE_STRATEGIES = ['consensus', 'best', 'sequential'] as const;

interface SwarmAgent {
  role: string;
  policy: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  task?: string;
  result?: string;
  error?: string;
}

interface Swarm {
  id: string;
  task: string;
  roles: string[];
  maxAgents: number;
  policy?: string;
  agents: SwarmAgent[];
  status: 'active' | 'completed' | 'error' | 'terminated';
  createdAt: number;
}

let maxAgentsConfig = 4;
let mergeStrategyConfig = 'best';

const swarms = new Map<string, Swarm>();

let nextSwarmId = 1;

function generateId(): string {
  return `swarm-${nextSwarmId++}-${Date.now()}`;
}

function nowMs(): number {
  return Date.now();
}

const DEFAULT_POLICY =
  `You are a specialized sub-agent in a swarm orchestration system. Follow instructions precisely and report results clearly.`;

function buildPolicy(role: string, customPolicy?: string): string {
  const base = customPolicy || DEFAULT_POLICY;
  return `${base}\n\nCurrent Role: ${role}`;
}

function createAgent(role: string, policy: string): SwarmAgent {
  return {
    role,
    policy,
    status: 'idle',
  };
}

function validateMergeStrategy(
  strategy: unknown,
): strategy is typeof VALID_MERGE_STRATEGIES[number] {
  return typeof strategy === 'string' &&
    VALID_MERGE_STRATEGIES.includes(strategy as typeof VALID_MERGE_STRATEGIES[number]);
}

const swarmCreateTool: Tool = {
  definition: {
    name: 'swarm_create',
    description: 'Create a swarm of specialist sub-agents for a task',
    params: [
      {
        name: 'task',
        type: 'string',
        description: 'The main task description for the swarm',
        required: true,
      },
      {
        name: 'roles',
        type: 'string',
        description: 'Comma-separated list of roles (e.g. architect,coder,reviewer,tester)',
        required: true,
      },
      {
        name: 'max_agents',
        type: 'number',
        description: 'Maximum number of agents in the swarm',
        required: false,
      },
      {
        name: 'policy',
        type: 'string',
        description: 'Custom AGENT.md policy content for the swarm agents',
        required: false,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: PluginContext): Promise<ToolCallResult> => {
    const start = nowMs();
    try {
      const task = args.task;
      const roles = args.roles;
      const maxAgents = args.max_agents !== undefined ? Number(args.max_agents) : maxAgentsConfig;
      const policy = typeof args.policy === 'string' ? args.policy : undefined;

      if (!task || typeof task !== 'string') {
        return {
          toolName: 'swarm_create',
          success: false,
          output: '',
          error: 'task must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }
      if (!roles || typeof roles !== 'string') {
        return {
          toolName: 'swarm_create',
          success: false,
          output: '',
          error: 'roles must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }
      if (!Number.isFinite(maxAgents) || maxAgents < 1 || maxAgents > 20) {
        return {
          toolName: 'swarm_create',
          success: false,
          output: '',
          error: 'max_agents must be a number between 1 and 20',
          durationMs: nowMs() - start,
        };
      }

      const roleList = roles.split(',').map((r) => r.trim()).filter((r) => r.length > 0);

      if (roleList.length === 0) {
        return {
          toolName: 'swarm_create',
          success: false,
          output: '',
          error: 'At least one role is required',
          durationMs: nowMs() - start,
        };
      }
      if (roleList.length > maxAgents) {
        return {
          toolName: 'swarm_create',
          success: false,
          output: '',
          error: `Number of roles (${roleList.length}) exceeds max_agents (${maxAgents})`,
          durationMs: nowMs() - start,
        };
      }

      const id = generateId();
      const agents = roleList.map((role) => createAgent(role, buildPolicy(role, policy)));

      const swarm: Swarm = {
        id,
        task,
        roles: roleList,
        maxAgents,
        policy,
        agents,
        status: 'active',
        createdAt: start,
      };

      swarms.set(id, swarm);

      const agentList = agents.map((a) => `  - ${a.role} (${a.status})`).join('\n');

      return {
        toolName: 'swarm_create',
        success: true,
        output:
          `Swarm created successfully.\nSwarm ID: ${id}\nTask: ${task}\nAgents:\n${agentList}`,
        durationMs: nowMs() - start,
      };
    } catch (error) {
      return {
        toolName: 'swarm_create',
        success: false,
        output: '',
        error: `Failed to create swarm: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: nowMs() - start,
      };
    }
  },
};

const swarmDelegateTool: Tool = {
  definition: {
    name: 'swarm_delegate',
    description: 'Delegate a sub-task to a specific agent in the swarm',
    params: [
      {
        name: 'swarm_id',
        type: 'string',
        description: 'The swarm ID to delegate to',
        required: true,
      },
      {
        name: 'agent_role',
        type: 'string',
        description: 'The role of the agent to delegate to (e.g. architect, coder)',
        required: true,
      },
      { name: 'sub_task', type: 'string', description: 'The sub-task to delegate', required: true },
      {
        name: 'context',
        type: 'string',
        description: 'Additional context for the sub-task',
        required: false,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: PluginContext): Promise<ToolCallResult> => {
    const start = nowMs();
    try {
      const swarmId = args.swarm_id;
      const agentRole = args.agent_role;
      const subTask = args.sub_task;
      const context = typeof args.context === 'string' ? args.context : undefined;

      if (!swarmId || typeof swarmId !== 'string') {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: 'swarm_id must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }
      if (!agentRole || typeof agentRole !== 'string') {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: 'agent_role must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }
      if (!subTask || typeof subTask !== 'string') {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: 'sub_task must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }

      const swarm = swarms.get(swarmId);
      if (!swarm) {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: `Swarm not found: ${swarmId}`,
          durationMs: nowMs() - start,
        };
      }
      if (swarm.status !== 'active') {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: `Swarm ${swarmId} is not active (status: ${swarm.status})`,
          durationMs: nowMs() - start,
        };
      }

      const agent = swarm.agents.find((a) => a.role === agentRole);
      if (!agent) {
        const availableRoles = swarm.agents.map((a) => a.role).join(', ');
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: `Agent with role "${agentRole}" not found. Available roles: ${availableRoles}`,
          durationMs: nowMs() - start,
        };
      }

      if (agent.status === 'working') {
        return {
          toolName: 'swarm_delegate',
          success: false,
          output: '',
          error: `Agent ${agentRole} is already working on a task`,
          durationMs: nowMs() - start,
        };
      }

      agent.task = subTask;
      agent.status = 'working';

      const contextNote = context ? `\nContext: ${context}` : '';

      return {
        toolName: 'swarm_delegate',
        success: true,
        output:
          `Task delegated to ${agentRole}.\nSwarm: ${swarmId}\nTask: ${subTask}${contextNote}`,
        durationMs: nowMs() - start,
      };
    } catch (error) {
      return {
        toolName: 'swarm_delegate',
        success: false,
        output: '',
        error: `Failed to delegate task: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: nowMs() - start,
      };
    }
  },
};

const swarmCoordinateTool: Tool = {
  definition: {
    name: 'swarm_coordinate',
    description: 'Coordinate results from all agents and synthesize a final answer',
    params: [
      {
        name: 'swarm_id',
        type: 'string',
        description: 'The swarm ID to coordinate',
        required: true,
      },
      {
        name: 'merge_strategy',
        type: 'string',
        description: 'Strategy for merging agent results: consensus, best, or sequential',
        required: false,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: PluginContext): Promise<ToolCallResult> => {
    const start = nowMs();
    try {
      const swarmId = args.swarm_id;
      const mergeStrategy = args.merge_strategy !== undefined
        ? String(args.merge_strategy)
        : mergeStrategyConfig;

      if (!swarmId || typeof swarmId !== 'string') {
        return {
          toolName: 'swarm_coordinate',
          success: false,
          output: '',
          error: 'swarm_id must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }
      if (!validateMergeStrategy(mergeStrategy)) {
        return {
          toolName: 'swarm_coordinate',
          success: false,
          output: '',
          error: `merge_strategy must be one of: ${VALID_MERGE_STRATEGIES.join(', ')}`,
          durationMs: nowMs() - start,
        };
      }

      const swarm = swarms.get(swarmId);
      if (!swarm) {
        return {
          toolName: 'swarm_coordinate',
          success: false,
          output: '',
          error: `Swarm not found: ${swarmId}`,
          durationMs: nowMs() - start,
        };
      }
      if (swarm.status === 'terminated') {
        return {
          toolName: 'swarm_coordinate',
          success: false,
          output: '',
          error: `Swarm ${swarmId} has been terminated`,
          durationMs: nowMs() - start,
        };
      }

      const idleAgents = swarm.agents.filter((a) => a.status === 'idle');
      if (idleAgents.length > 0) {
        const idleRoles = idleAgents.map((a) => a.role).join(', ');
        return {
          toolName: 'swarm_coordinate',
          success: false,
          output: '',
          error: `Cannot coordinate: agents still idle: ${idleRoles}. Delegate tasks first.`,
          durationMs: nowMs() - start,
        };
      }

      const results: { role: string; result: string }[] = [];
      for (const agent of swarm.agents) {
        if (agent.status === 'completed' && agent.result) {
          results.push({ role: agent.role, result: agent.result });
        } else if (agent.status === 'error' && agent.error) {
          results.push({ role: agent.role, result: `[ERROR] ${agent.error}` });
        } else if (agent.status === 'working') {
          results.push({
            role: agent.role,
            result: `[PENDING] ${agent.role} is still working on: ${agent.task || 'unknown task'}`,
          });
        }
      }

      let finalResult: string;
      switch (mergeStrategy) {
        case 'consensus':
          finalResult = `=== Consensus Report ===\nSwarm: ${swarmId}\nTask: ${swarm.task}\n\n` +
            results.map((r) => `[${r.role}]\n${r.result}`).join('\n\n') +
            '\n\n---\nConsensus synthesis requires aligning results from all agents.';
          break;
        case 'best':
          finalResult = `=== Best Result Report ===\nSwarm: ${swarmId}\nTask: ${swarm.task}\n\n` +
            results.map((r) => `[${r.role}]\n${r.result}`).join('\n\n');
          break;
        case 'sequential':
          finalResult = `=== Sequential Report ===\nSwarm: ${swarmId}\nTask: ${swarm.task}\n\n` +
            results.map((r, i) => `Step ${i + 1} [${r.role}]\n${r.result}`).join('\n\n');
          break;
        default:
          finalResult = `=== Coordination Report ===\nSwarm: ${swarmId}\nTask: ${swarm.task}\n\n` +
            results.map((r) => `[${r.role}]\n${r.result}`).join('\n\n');
      }

      swarm.status = 'completed';

      return {
        toolName: 'swarm_coordinate',
        success: true,
        output: finalResult,
        durationMs: nowMs() - start,
      };
    } catch (error) {
      return {
        toolName: 'swarm_coordinate',
        success: false,
        output: '',
        error: `Failed to coordinate swarm: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: nowMs() - start,
      };
    }
  },
};

const swarmStatusTool: Tool = {
  definition: {
    name: 'swarm_status',
    description: 'Check the status of a running swarm',
    params: [
      { name: 'swarm_id', type: 'string', description: 'The swarm ID to check', required: true },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: PluginContext): Promise<ToolCallResult> => {
    const start = nowMs();
    try {
      const swarmId = args.swarm_id;

      if (!swarmId || typeof swarmId !== 'string') {
        return {
          toolName: 'swarm_status',
          success: false,
          output: '',
          error: 'swarm_id must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }

      const swarm = swarms.get(swarmId);
      if (!swarm) {
        return {
          toolName: 'swarm_status',
          success: false,
          output: '',
          error: `Swarm not found: ${swarmId}`,
          durationMs: nowMs() - start,
        };
      }

      const agentStatus = swarm.agents.map((a) => {
        let line = `  - ${a.role}: ${a.status}`;
        if (a.task) line += ` (task: ${a.task})`;
        if (a.result) line += ` (has result)`;
        if (a.error) line += ` (error: ${a.error})`;
        return line;
      }).join('\n');

      const ageMs = nowMs() - swarm.createdAt;
      const ageSec = (ageMs / 1000).toFixed(1);

      const output = `Swarm: ${swarm.id}\n` +
        `Status: ${swarm.status}\n` +
        `Task: ${swarm.task}\n` +
        `Roles: ${swarm.roles.join(', ')}\n` +
        `Max Agents: ${swarm.maxAgents}\n` +
        `Age: ${ageSec}s\n` +
        `Agents:\n${agentStatus}`;

      return {
        toolName: 'swarm_status',
        success: true,
        output,
        durationMs: nowMs() - start,
      };
    } catch (error) {
      return {
        toolName: 'swarm_status',
        success: false,
        output: '',
        error: `Failed to check swarm status: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: nowMs() - start,
      };
    }
  },
};

const swarmTerminateTool: Tool = {
  definition: {
    name: 'swarm_terminate',
    description: 'Terminate a swarm and clean up resources',
    params: [
      {
        name: 'swarm_id',
        type: 'string',
        description: 'The swarm ID to terminate',
        required: true,
      },
    ],
    capabilities: [],
  },

  execute: async (args: Record<string, unknown>, _ctx: PluginContext): Promise<ToolCallResult> => {
    const start = nowMs();
    try {
      const swarmId = args.swarm_id;

      if (!swarmId || typeof swarmId !== 'string') {
        return {
          toolName: 'swarm_terminate',
          success: false,
          output: '',
          error: 'swarm_id must be a non-empty string',
          durationMs: nowMs() - start,
        };
      }

      const swarm = swarms.get(swarmId);
      if (!swarm) {
        return {
          toolName: 'swarm_terminate',
          success: false,
          output: '',
          error: `Swarm not found: ${swarmId}`,
          durationMs: nowMs() - start,
        };
      }

      swarm.status = 'terminated';

      for (const agent of swarm.agents) {
        if (agent.status === 'working') {
          agent.status = 'idle';
        }
      }

      const completedAgents = swarm.agents.filter((a) => a.status === 'completed').length;
      const totalAgents = swarm.agents.length;

      return {
        toolName: 'swarm_terminate',
        success: true,
        output:
          `Swarm ${swarmId} terminated.\nAgents completed: ${completedAgents}/${totalAgents}\nAll resources cleaned up.`,
        durationMs: nowMs() - start,
      };
    } catch (error) {
      return {
        toolName: 'swarm_terminate',
        success: false,
        output: '',
        error: `Failed to terminate swarm: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: nowMs() - start,
      };
    }
  },
};

export async function onLoad(ctx: PluginContext): Promise<void> {
  const rawMaxAgents = await ctx.config.get('defaultMaxAgents');
  if (
    typeof rawMaxAgents === 'number' && Number.isFinite(rawMaxAgents) && rawMaxAgents >= 1 &&
    rawMaxAgents <= 20
  ) {
    maxAgentsConfig = rawMaxAgents;
  }

  const rawMergeStrategy = await ctx.config.get('defaultMergeStrategy');
  if (validateMergeStrategy(rawMergeStrategy)) {
    mergeStrategyConfig = rawMergeStrategy;
  }

  ctx.logger.info(
    `[cortex-plugin-swarm] Loaded (maxAgents=${maxAgentsConfig}, mergeStrategy=${mergeStrategyConfig})`,
  );
}

export async function onUnload(ctx: PluginContext): Promise<void> {
  swarms.clear();
  ctx.logger.info('[cortex-plugin-swarm] Unloaded, all swarms cleaned up');
}

export const tools: Tool[] = [
  swarmCreateTool,
  swarmDelegateTool,
  swarmCoordinateTool,
  swarmStatusTool,
  swarmTerminateTool,
];
