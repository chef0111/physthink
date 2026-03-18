import { promises as fs } from 'node:fs';
import path from 'node:path';

const MEMORY_DIR_NAME = '.memory';
const DEFAULT_CORE_MEMORY = [
  '# Core Memory',
  '',
  '- Record stable, high-value user preferences and constraints.',
  '- Keep entries short and factual.',
].join('\n');

type MemoryContext = {
  workspaceId: string;
  userId: string;
};

type MemoryFilePath = 'core.md' | 'notes.md' | 'conversations.jsonl';

const ALLOWED_MEMORY_FILES = new Set<MemoryFilePath>([
  'core.md',
  'notes.md',
  'conversations.jsonl',
]);

export type MemoryCommand =
  | { action: 'view'; path?: string }
  | { action: 'create'; path: string; content: string }
  | {
      action: 'update';
      path: string;
      content: string;
      mode?: 'append' | 'overwrite';
    }
  | {
      action: 'search';
      query: string;
      path?: string;
      limit?: number;
    };

function getMemoryRoot(context: MemoryContext): string {
  void context;
  return path.resolve(process.cwd(), MEMORY_DIR_NAME);
}

function assertSafeMemoryPath(
  memoryRoot: string,
  requestedPath: string
): string {
  const normalizedRequested = requestedPath.trim().replace(/\\/g, '/');
  if (!normalizedRequested) {
    throw new Error('Path is required.');
  }

  if (!ALLOWED_MEMORY_FILES.has(normalizedRequested as MemoryFilePath)) {
    throw new Error(
      `Path is not allowed. Allowed files: ${[...ALLOWED_MEMORY_FILES].join(', ')}`
    );
  }

  const absolutePath = path.resolve(memoryRoot, normalizedRequested);
  const normalizedRoot = path.resolve(memoryRoot);
  if (
    absolutePath !== normalizedRoot &&
    !absolutePath.startsWith(normalizedRoot + path.sep)
  ) {
    throw new Error('Path escapes .memory directory.');
  }

  return absolutePath;
}

export async function ensureMemoryStore(context: MemoryContext) {
  const memoryRoot = getMemoryRoot(context);
  await fs.mkdir(memoryRoot, { recursive: true });

  const corePath = path.resolve(memoryRoot, 'core.md');
  const notesPath = path.resolve(memoryRoot, 'notes.md');
  const conversationsPath = path.resolve(memoryRoot, 'conversations.jsonl');

  await Promise.all([
    fs
      .access(corePath)
      .catch(() => fs.writeFile(corePath, DEFAULT_CORE_MEMORY + '\n', 'utf8')),
    fs.access(notesPath).catch(() => fs.writeFile(notesPath, '', 'utf8')),
    fs
      .access(conversationsPath)
      .catch(() => fs.writeFile(conversationsPath, '', 'utf8')),
  ]);

  return {
    memoryRoot,
    corePath,
    notesPath,
    conversationsPath,
  };
}

export async function readCoreMemory(context: MemoryContext): Promise<string> {
  const { corePath } = await ensureMemoryStore(context);
  return fs.readFile(corePath, 'utf8');
}

export async function appendConversationMemory(
  context: MemoryContext,
  entry: {
    role: 'user' | 'assistant';
    content: string;
    at?: string;
  }
): Promise<void> {
  const { conversationsPath } = await ensureMemoryStore(context);
  const line = JSON.stringify({
    at: entry.at ?? new Date().toISOString(),
    workspaceId: context.workspaceId,
    userId: context.userId,
    role: entry.role,
    content: entry.content,
  });

  await fs.appendFile(conversationsPath, line + '\n', 'utf8');
}

export async function runMemoryCommand(
  context: MemoryContext,
  command: MemoryCommand
): Promise<Record<string, unknown>> {
  const { memoryRoot } = await ensureMemoryStore(context);

  if (command.action === 'view') {
    const targetPath = command.path?.trim() || 'core.md';
    const absolutePath = assertSafeMemoryPath(memoryRoot, targetPath);
    const content = await fs.readFile(absolutePath, 'utf8');
    return {
      ok: true,
      action: 'view',
      path: targetPath,
      content,
    };
  }

  if (command.action === 'create') {
    const absolutePath = assertSafeMemoryPath(memoryRoot, command.path);
    try {
      await fs.access(absolutePath);
      return {
        ok: false,
        action: 'create',
        path: command.path,
        error: 'File already exists.',
      };
    } catch {
      await fs.writeFile(absolutePath, command.content, 'utf8');
      return {
        ok: true,
        action: 'create',
        path: command.path,
      };
    }
  }

  if (command.action === 'update') {
    const absolutePath = assertSafeMemoryPath(memoryRoot, command.path);
    const mode = command.mode ?? 'append';

    if (mode === 'overwrite') {
      await fs.writeFile(absolutePath, command.content, 'utf8');
    } else {
      await fs.appendFile(absolutePath, command.content, 'utf8');
    }

    return {
      ok: true,
      action: 'update',
      mode,
      path: command.path,
    };
  }

  const query = command.query.trim().toLowerCase();
  if (!query) {
    return {
      ok: false,
      action: 'search',
      error: 'Query is required.',
      results: [],
    };
  }

  const searchCandidates: MemoryFilePath[] = command.path
    ? [command.path as MemoryFilePath]
    : ['core.md', 'notes.md', 'conversations.jsonl'];

  const filesToSearch = searchCandidates.filter((filePath) =>
    ALLOWED_MEMORY_FILES.has(filePath)
  );

  const limit = Math.min(Math.max(command.limit ?? 10, 1), 50);
  const results: Array<{
    path: string;
    line: number;
    snippet: string;
  }> = [];

  for (const filePath of filesToSearch) {
    const absolutePath = assertSafeMemoryPath(memoryRoot, filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.toLowerCase().includes(query)) continue;
      results.push({ path: filePath, line: index + 1, snippet: line.trim() });
      if (results.length >= limit) {
        return {
          ok: true,
          action: 'search',
          query: command.query,
          results,
          limited: true,
        };
      }
    }
  }

  return {
    ok: true,
    action: 'search',
    query: command.query,
    results,
    limited: false,
  };
}
