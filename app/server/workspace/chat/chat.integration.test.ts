import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getRetryAdviceFromStreamState, responseToUIParts } from './utils';
import { discoverSkills } from './agent/skills';
import { createChatTools } from './agent/tools';
import {
  getCapabilityAllowedTools,
  resolveCapabilityIntent,
} from './stream/capabilities';

vi.mock('server-only', () => ({}));

describe('workspace chat integration behavior', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
    );
  });

  it('shapes heavy tool-call responses without dropping tool parts', () => {
    const heavyElements = Array.from({ length: 40 }, (_, index) => ({
      type: 'vector',
      label: `v${index}`,
      from: [index, 0, 0],
      to: [index, 1, 0],
    }));

    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-1',
            toolName: 'addElements',
            args: { elements: heavyElements },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'tc-1',
            output: {
              action: 'addElements',
              elements: heavyElements,
            },
          },
        ],
      },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe('tool-addElements');
    expect(parts[0].state).toBe('output-available');
    expect((parts[0].output as { elements: unknown[] }).elements).toHaveLength(
      40
    );
  });

  it('moves retry advice from preliminary to final during stream lifecycle', () => {
    const preliminary = getRetryAdviceFromStreamState(
      {
        textContent: '',
        reasoningContent: 'Thinking...',
        hasToolCalls: false,
        stopReason: 'unknown',
      },
      'preliminary'
    );

    const final = getRetryAdviceFromStreamState(
      {
        textContent: 'Final useful answer',
        reasoningContent: 'Thinking...',
        hasToolCalls: true,
        stopReason: 'stop',
      },
      'final'
    );

    expect(preliminary.stage).toBe('preliminary');
    expect(preliminary.shouldRetry).toBe(true);

    expect(final.stage).toBe('final');
    expect(final.shouldRetry).toBe(false);
  });

  it('preserves tool error states instead of coercing them to completed', () => {
    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-err',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh' }] },
            state: 'output-error',
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-error',
            toolCallId: 'tc-err',
            output: { message: 'Invalid schema' },
          },
        ],
      },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe('tool-addElements');
    expect(parts[0].state).toBe('output-error');
    expect(parts[0]).not.toHaveProperty('output');
  });

  it('deduplicates repeated assistant tool-call parts by toolCallId', () => {
    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-dup',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh' }] },
          },
          {
            type: 'tool-call',
            toolCallId: 'tc-dup',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh' }] },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'tc-dup',
            output: { action: 'addElements', elements: [{ type: 'mesh' }] },
          },
        ],
      },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].toolCallId).toBe('tc-dup');
    expect(parts[0].state).toBe('output-available');
  });

  it('drops unresolved input-only tool calls from persisted parts', () => {
    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-pending',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh' }] },
            state: 'input-available',
          },
        ],
      },
    ]);

    expect(parts).toHaveLength(0);
  });

  it('deduplicates repeated scene tool calls with same input and skips scene tool errors', () => {
    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-a1',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh', position: [0, 0, 0] }] },
          },
          {
            type: 'tool-call',
            toolCallId: 'tc-a2',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh', position: [0, 0, 0] }] },
          },
          {
            type: 'tool-call',
            toolCallId: 'tc-a3',
            toolName: 'addElements',
            args: { elements: [{ type: 'mesh', position: [1, 0, 0] }] },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'tc-a1',
            output: { action: 'addElements' },
          },
          {
            type: 'tool-error',
            toolCallId: 'tc-a2',
            output: { message: 'invalid' },
          },
          {
            type: 'tool-result',
            toolCallId: 'tc-a3',
            output: { action: 'addElements' },
          },
        ],
      },
    ]);

    const addElementsParts = parts.filter((p) => p.type === 'tool-addElements');
    expect(addElementsParts).toHaveLength(2);
    expect(addElementsParts.every((p) => p.state === 'output-available')).toBe(
      true
    );
  });

  it('maps threejs capability to scene-only tool allowlist', () => {
    const resolution = resolveCapabilityIntent('threejs');
    const allowedTools = getCapabilityAllowedTools(resolution.capability);

    expect(resolution.unknownRequested).toBe(false);
    expect(allowedTools).toEqual([
      'addElement',
      'addElements',
      'editElement',
      'removeElement',
      'setSceneSettings',
    ]);
  });

  it('downgrades unknown capability request to safe default mode', () => {
    const resolution = resolveCapabilityIntent('nonexistent-skill');
    const allowedTools = getCapabilityAllowedTools(resolution.capability);

    expect(resolution.capability).toBe('default');
    expect(resolution.unknownRequested).toBe(true);
    expect(resolution.requestedRaw).toBe('nonexistent-skill');
    expect(allowedTools.length).toBeGreaterThan(5);
  });

  it('loads runtime skill content through loadSkill tool call', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'skills-load-ok-'));
    tempDirs.push(root);

    const skillDir = path.resolve(root, 'cook');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      path.resolve(skillDir, 'SKILL.md'),
      [
        '---',
        'name: cook',
        'description: orchestrator',
        '---',
        '',
        '# Cook',
        'Do steps.',
      ].join('\n'),
      'utf8'
    );

    const skills = await discoverSkills([root]);
    const tools = createChatTools({
      skills,
      context: { workspaceId: 'ws_1', userId: 'usr_1' },
    });

    const executeLoadSkill = tools.loadSkill.execute as unknown as (
      input: { name: string },
      options?: unknown
    ) => Promise<Record<string, unknown>>;
    const result = await executeLoadSkill({ name: 'cook' });

    expect(result.found).toBe(true);
    expect(result.content).toContain('# Cook');
  });

  it('returns not-found response for unknown loadSkill request', async () => {
    const tools = createChatTools({
      skills: [],
      context: { workspaceId: 'ws_1', userId: 'usr_1' },
    });

    const executeLoadSkill = tools.loadSkill.execute as unknown as (
      input: { name: string },
      options?: unknown
    ) => Promise<Record<string, unknown>>;
    const result = await executeLoadSkill({ name: 'missing-skill' });

    expect(result.found).toBe(false);
    expect(String(result.message)).toContain('not found');
  });

  it('supports memory tool write/read/search flow', async () => {
    const tools = createChatTools({
      skills: [],
      context: { workspaceId: 'ws_mem', userId: 'usr_mem' },
    });

    const executeMemory = tools.memory.execute as unknown as (
      input: {
        action: 'view' | 'create' | 'update' | 'search';
        path?: string;
        content?: string;
        mode?: 'append' | 'overwrite';
        query?: string;
      },
      options?: unknown
    ) => Promise<Record<string, unknown>>;

    const update = await executeMemory({
      action: 'update',
      path: 'notes.md',
      mode: 'append',
      content: 'memory-flow-token\n',
    });
    expect(update.ok).toBe(true);

    const view = await executeMemory({ action: 'view', path: 'notes.md' });
    expect(String(view.content)).toContain('memory-flow-token');

    const search = await executeMemory({
      action: 'search',
      query: 'memory-flow-token',
    });
    expect(Array.isArray(search.results)).toBe(true);
    expect((search.results as unknown[]).length).toBeGreaterThan(0);
  });

  it('keeps memory tool available in default mode and restricted in threejs mode', () => {
    const defaultAllowed = getCapabilityAllowedTools('default', [
      'addElement',
      'memory',
      'loadSkill',
    ]);
    const threejsAllowed = getCapabilityAllowedTools('threejs', [
      'addElement',
      'memory',
      'loadSkill',
    ]);

    expect(defaultAllowed).toContain('memory');
    expect(threejsAllowed).not.toContain('memory');
  });
});
