import { describe, expect, it, vi } from 'vitest';
import { buildChatSystemPrompt } from './builder';

vi.mock('server-only', () => ({}));

describe('chat prompt builder', () => {
  it('injects skills and core memory sections', () => {
    const prompt = buildChatSystemPrompt({
      capabilitySystemContext: '## Capability\n- threejs',
      skillsPrompt: '## Runtime Skills\n- cook: orchestrator',
      coreMemory: '# Core Memory\n- prefers concise answers',
      sceneContext: 'Scene is empty.',
    });

    expect(prompt).toContain('## Runtime Skills');
    expect(prompt).toContain('- cook: orchestrator');
    expect(prompt).toContain('## Core Memory');
    expect(prompt).toContain('prefers concise answers');
    expect(prompt).toContain('## Current Scene');
  });

  it('omits core memory section when blank', () => {
    const prompt = buildChatSystemPrompt({
      capabilitySystemContext: '',
      skillsPrompt: '## Runtime Skills\n- none',
      coreMemory: '   ',
      sceneContext: '1 element(s):\\n- e1 (mesh)',
    });

    expect(prompt).not.toContain('## Core Memory');
    expect(prompt).toContain('## Current Scene');
  });
});
