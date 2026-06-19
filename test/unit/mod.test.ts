// deno-lint-ignore-file require-await, no-unused-vars
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { tools } from '../../mod.ts';
import type { PluginContext } from 'cortex/plugins';

const mockContext: PluginContext = {
  pluginId: 'cortex-plugin-swarm',
  pluginDir: '/tmp/plugins/cortex-plugin-swarm',
  state: {
    get: async () => null,
    set: async () => {},
  },
  config: {},
};

function findTool(name: string) {
  return tools.find((t) => t.definition.name === name);
}

function extractSwarmId(output: string): string {
  const match = output.match(/Swarm ID: (swarm-\d+-\d+)/);
  if (!match) throw new Error('Could not extract swarm ID from: ' + output);
  return match[1];
}

Deno.test('swarm_create - creates a swarm successfully', async () => {
  const tool = findTool('swarm_create');
  if (!tool) throw new Error('swarm_create tool not found');

  const result = await tool.execute({
    task: 'Build a REST API',
    roles: 'architect,coder,reviewer,tester',
  }, mockContext);
  assertEquals(result.success, true);
  assertStringIncludes(result.output, 'Swarm created successfully');
  assertStringIncludes(result.output, 'architect');
  assertStringIncludes(result.output, 'coder');
  assertStringIncludes(result.output, 'reviewer');
  assertStringIncludes(result.output, 'tester');
});

Deno.test('swarm_create - respects max_agents', async () => {
  const tool = findTool('swarm_create');
  if (!tool) throw new Error('swarm_create tool not found');

  const result = await tool.execute({
    task: 'Task',
    roles: 'architect,coder,reviewer,tester',
    max_agents: 2,
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'exceeds max_agents');
});

Deno.test('swarm_create - rejects missing task', async () => {
  const tool = findTool('swarm_create');
  if (!tool) throw new Error('swarm_create tool not found');

  const result = await tool.execute({ roles: 'architect' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'task');
});

Deno.test('swarm_create - rejects missing roles', async () => {
  const tool = findTool('swarm_create');
  if (!tool) throw new Error('swarm_create tool not found');

  const result = await tool.execute({ task: 'Test' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'roles');
});

Deno.test('swarm_create - rejects invalid max_agents', async () => {
  const tool = findTool('swarm_create');
  if (!tool) throw new Error('swarm_create tool not found');

  const result = await tool.execute({ task: 'Test', roles: 'a', max_agents: 0 }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'between 1 and 20');
});

Deno.test('swarm_delegate - delegates a sub-task', async () => {
  const create = findTool('swarm_create');
  if (!create) throw new Error('swarm_create tool not found');
  const createResult = await create.execute({
    task: 'Build API',
    roles: 'architect,coder',
  }, mockContext);
  const swarmId = extractSwarmId(createResult.output);

  const tool = findTool('swarm_delegate');
  if (!tool) throw new Error('swarm_delegate tool not found');

  const result = await tool.execute({
    swarm_id: swarmId,
    agent_role: 'architect',
    sub_task: 'Design the API schema',
    context: 'Use RESTful conventions',
  }, mockContext);
  assertEquals(result.success, true);
  assertStringIncludes(result.output, 'Task delegated to architect');
});

Deno.test('swarm_delegate - rejects unknown swarm', async () => {
  const tool = findTool('swarm_delegate');
  if (!tool) throw new Error('swarm_delegate tool not found');

  const result = await tool.execute({
    swarm_id: 'nonexistent',
    agent_role: 'architect',
    sub_task: 'Test',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not found');
});

Deno.test('swarm_delegate - rejects unknown role', async () => {
  const create = findTool('swarm_create');
  if (!create) throw new Error('swarm_create tool not found');
  const createResult = await create.execute({
    task: 'Build API',
    roles: 'coder',
  }, mockContext);
  const swarmId = extractSwarmId(createResult.output);

  const tool = findTool('swarm_delegate');
  if (!tool) throw new Error('swarm_delegate tool not found');

  const result = await tool.execute({
    swarm_id: swarmId,
    agent_role: 'nonexistent',
    sub_task: 'Test',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not found');
});

Deno.test('swarm_delegate - rejects missing sub_task', async () => {
  const tool = findTool('swarm_delegate');
  if (!tool) throw new Error('swarm_delegate tool not found');

  const result = await tool.execute({ swarm_id: 'swarm-1', agent_role: 'coder' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'sub_task');
});

Deno.test('swarm_status - returns swarm status', async () => {
  const create = findTool('swarm_create');
  if (!create) throw new Error('swarm_create tool not found');
  const createResult = await create.execute({
    task: 'Build API',
    roles: 'architect,coder',
  }, mockContext);
  const swarmId = extractSwarmId(createResult.output);

  const tool = findTool('swarm_status');
  if (!tool) throw new Error('swarm_status tool not found');

  const result = await tool.execute({ swarm_id: swarmId }, mockContext);
  assertEquals(result.success, true);
  assertStringIncludes(result.output, swarmId);
  assertStringIncludes(result.output, 'active');
});

Deno.test('swarm_status - rejects missing swarm_id', async () => {
  const tool = findTool('swarm_status');
  if (!tool) throw new Error('swarm_status tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'swarm_id');
});

Deno.test('swarm_status - rejects unknown swarm', async () => {
  const tool = findTool('swarm_status');
  if (!tool) throw new Error('swarm_status tool not found');

  const result = await tool.execute({ swarm_id: 'nonexistent' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not found');
});

Deno.test('swarm_coordinate - rejects idle agents', async () => {
  const create = findTool('swarm_create');
  if (!create) throw new Error('swarm_create tool not found');
  const createResult = await create.execute({
    task: 'Build API',
    roles: 'architect,coder',
  }, mockContext);
  const swarmId = extractSwarmId(createResult.output);

  const tool = findTool('swarm_coordinate');
  if (!tool) throw new Error('swarm_coordinate tool not found');

  const result = await tool.execute({ swarm_id: swarmId }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'idle');
});

Deno.test('swarm_coordinate - rejects invalid merge_strategy', async () => {
  const tool = findTool('swarm_coordinate');
  if (!tool) throw new Error('swarm_coordinate tool not found');

  const result = await tool.execute(
    { swarm_id: 'swarm-1', merge_strategy: 'invalid' },
    mockContext,
  );
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'must be one of');
});

Deno.test('swarm_terminate - terminates a swarm', async () => {
  const create = findTool('swarm_create');
  if (!create) throw new Error('swarm_create tool not found');
  const createResult = await create.execute({
    task: 'Build API',
    roles: 'architect',
  }, mockContext);
  const swarmId = extractSwarmId(createResult.output);

  const tool = findTool('swarm_terminate');
  if (!tool) throw new Error('swarm_terminate tool not found');

  const result = await tool.execute({ swarm_id: swarmId }, mockContext);
  assertEquals(result.success, true);
  assertStringIncludes(result.output, 'terminated');
});

Deno.test('swarm_terminate - rejects missing swarm_id', async () => {
  const tool = findTool('swarm_terminate');
  if (!tool) throw new Error('swarm_terminate tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'swarm_id');
});

Deno.test('tools array exported', () => {
  assertEquals(tools.length, 5);
  assertEquals(tools[0].definition.name, 'swarm_create');
  assertEquals(tools[1].definition.name, 'swarm_delegate');
  assertEquals(tools[2].definition.name, 'swarm_coordinate');
  assertEquals(tools[3].definition.name, 'swarm_status');
  assertEquals(tools[4].definition.name, 'swarm_terminate');
});
