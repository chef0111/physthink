import { afterEach, describe, expect, it, vi } from 'vitest';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { ensureMemoryStore, readCoreMemory, runMemoryCommand } from './memory';

const TEST_CONTEXT = {
  workspaceId: 'test-workspace',
  userId: 'test-user',
};

vi.mock('server-only', () => ({}));

describe('memory store', () => {
  afterEach(async () => {
    await rm(path.resolve(process.cwd(), '.memory'), {
      recursive: true,
      force: true,
    });
  });

  it('bootstraps default .memory files', async () => {
    const store = await ensureMemoryStore(TEST_CONTEXT);
    expect(store.memoryRoot.endsWith('.memory')).toBe(true);

    const core = await readCoreMemory(TEST_CONTEXT);
    expect(core).toContain('# Core Memory');
  });

  it('supports view/create/update/search commands with path guards', async () => {
    await ensureMemoryStore(TEST_CONTEXT);

    const createResult = await runMemoryCommand(TEST_CONTEXT, {
      action: 'create',
      path: 'notes.md',
      content: 'first line\n',
    });
    expect(createResult.ok).toBe(false);

    const updateResult = await runMemoryCommand(TEST_CONTEXT, {
      action: 'update',
      path: 'notes.md',
      mode: 'append',
      content: 'physics note\n',
    });
    expect(updateResult.ok).toBe(true);

    const searchResult = await runMemoryCommand(TEST_CONTEXT, {
      action: 'search',
      query: 'physics',
    });
    expect(Array.isArray(searchResult.results)).toBe(true);
    expect((searchResult.results as Array<{ snippet: string }>).length).toBe(1);

    await expect(
      runMemoryCommand(TEST_CONTEXT, {
        action: 'view',
        path: '../outside.md',
      })
    ).rejects.toThrow();
  });
});
