import { promises as fs } from 'node:fs';
import path from 'node:path';

type SkillFrontmatter = {
  name: string;
  description: string;
};

export type DiscoveredSkill = SkillFrontmatter & {
  filePath: string;
  directory: string;
};

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseFrontmatterValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || null;
  }
  return trimmed;
}

function parseSkillFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return null;

  let name: string | null = null;
  let description: string | null = null;

  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim().toLowerCase();
    const value = parseFrontmatterValue(trimmed.slice(separator + 1));
    if (!value) continue;

    if (key === 'name') name = value;
    if (key === 'description') description = value;
  }

  if (!name || !description) return null;
  return { name, description };
}

export function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_RE, '').trim();
}

async function findSkillFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(rootDir, entry.name, 'SKILL.md');
    try {
      const stat = await fs.stat(skillPath);
      if (stat.isFile()) results.push(skillPath);
    } catch {
      // Skip skill folders without SKILL.md.
    }
  }

  return results;
}

export async function discoverSkills(
  directories: string[]
): Promise<DiscoveredSkill[]> {
  const found = new Map<string, DiscoveredSkill>();

  for (const dir of directories) {
    const absDir = path.resolve(process.cwd(), dir);
    try {
      const skillFiles = await findSkillFiles(absDir);
      for (const filePath of skillFiles) {
        const raw = await fs.readFile(filePath, 'utf8');
        const frontmatter = parseSkillFrontmatter(raw);
        if (!frontmatter) continue;

        const dedupKey = frontmatter.name.trim().toLowerCase();
        if (found.has(dedupKey)) continue;

        found.set(dedupKey, {
          ...frontmatter,
          filePath,
          directory: path.dirname(filePath),
        });
      }
    } catch {
      // Skip missing skill directories.
    }
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSkillByName(
  skills: DiscoveredSkill[],
  name: string
): Promise<{ skillDirectory: string; content: string } | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const skill = skills.find(
    (item) => item.name.trim().toLowerCase() === normalized
  );
  if (!skill) return null;

  const raw = await fs.readFile(skill.filePath, 'utf8');
  return {
    skillDirectory: skill.directory,
    content: stripFrontmatter(raw),
  };
}

export async function readSkillResourceByName(
  skills: DiscoveredSkill[],
  skillName: string,
  relativePath: string
): Promise<{
  skillDirectory: string;
  relativePath: string;
  content: string;
} | null> {
  const normalizedSkill = skillName.trim().toLowerCase();
  if (!normalizedSkill) return null;

  const skill = skills.find(
    (item) => item.name.trim().toLowerCase() === normalizedSkill
  );
  if (!skill) return null;

  const requestedPath = relativePath.trim();
  if (!requestedPath) return null;

  const absolutePath = path.resolve(skill.directory, requestedPath);
  const normalizedSkillRoot = path.resolve(skill.directory);
  if (!absolutePath.startsWith(normalizedSkillRoot + path.sep)) {
    return null;
  }

  const stat = await fs.stat(absolutePath);
  if (!stat.isFile() || stat.size > 150_000) return null;

  const content = await fs.readFile(absolutePath, 'utf8');
  return {
    skillDirectory: skill.directory,
    relativePath: requestedPath,
    content,
  };
}

export function buildSkillsPrompt(skills: DiscoveredSkill[]): string {
  if (skills.length === 0) {
    return [
      '## Runtime Skills',
      '- No runtime skills discovered.',
      '- Continue with built-in behavior and tools only.',
    ].join('\n');
  }

  const lines = skills.map((skill) => `- ${skill.name}: ${skill.description}`);

  return [
    '## Runtime Skills',
    '- Skills are discoverable at runtime.',
    '- Call the loadSkill tool with an exact skill name before following that skill instructions.',
    ...lines,
  ].join('\n');
}

export const DEFAULT_SKILL_DIRECTORIES = ['.agents/skills', '.github/skills'];
