import { describe, expect, it, vi } from 'vitest';
import {
  computeActiveToolsFromSteps,
  computeToolExecutionPolicyFromSteps,
} from './chat-stream-utils';

vi.mock('server-only', () => ({}));

describe('computeActiveToolsFromSteps', () => {
  it('disables tools that repeatedly return errors', () => {
    const active = computeActiveToolsFromSteps([
      {
        toolCalls: [{ toolName: 'setSceneSettings' }],
        toolResults: [
          { toolName: 'setSceneSettings', isError: true },
          { toolName: 'setSceneSettings', isError: true },
        ],
      },
    ]);

    expect(active.includes('setSceneSettings')).toBe(false);
  });

  it('disables scene mutation tools on scene-tool error storm', () => {
    const active = computeActiveToolsFromSteps([
      {
        toolResults: [
          { toolName: 'addElements', isError: true },
          { toolName: 'addElements', isError: true },
          { toolName: 'addElement', isError: true },
          { toolName: 'setSceneSettings', isError: true },
        ],
      },
    ]);

    expect(active.includes('addElements')).toBe(false);
    expect(active.includes('addElement')).toBe(false);
    expect(active.includes('setSceneSettings')).toBe(false);
  });

  it('forces text-only fallback when one tool exceeds strict attempt cap', () => {
    const policy = computeToolExecutionPolicyFromSteps([
      {
        toolCalls: [
          { toolName: 'addElements' },
          { toolName: 'addElements' },
          { toolName: 'addElements' },
        ],
      },
    ]);

    expect(policy.forceTextOnly).toBe(true);
    expect(policy.reason).toBe('per-tool-cap');
    expect(policy.activeTools).toHaveLength(0);
  });

  it('forces text-only fallback when total tool attempts exceed cap', () => {
    const policy = computeToolExecutionPolicyFromSteps([
      {
        toolCalls: [
          { toolName: 'runProblemRagPipeline' },
          { toolName: 'setSceneSettings' },
          { toolName: 'addElements' },
        ],
      },
      {
        toolCalls: [
          { toolName: 'searchProblemExamples' },
          { toolName: 'setStatus' },
          { toolName: 'addElement' },
          { toolName: 'getPhysicsConstants' },
        ],
      },
    ]);

    expect(policy.forceTextOnly).toBe(true);
    expect(policy.reason).toBe('total-cap');
    expect(policy.activeTools).toHaveLength(0);
  });

  it('respects capability allowlist when computing active tools', () => {
    const policy = computeToolExecutionPolicyFromSteps(
      [],
      ['addElement', 'addElements', 'setSceneSettings']
    );

    expect(policy.forceTextOnly).toBe(false);
    expect(policy.activeTools).toEqual([
      'addElement',
      'addElements',
      'setSceneSettings',
    ]);
  });
});
