import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildSkillsPrompt,
  discoverSkills,
  readSkillResourceByName,
  stripFrontmatter,
} from './skills';

vi.mock('server-only', () => ({}));

describe('agent skills runtime', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
    );
  });

  it('discovers skills and deduplicates by first name wins', async () => {
    const rootA = await mkdtemp(path.join(os.tmpdir(), 'skills-a-'));
    const rootB = await mkdtemp(path.join(os.tmpdir(), 'skills-b-'));
    tempDirs.push(rootA, rootB);

    const skillOneA = path.resolve(rootA, 'threejs');
    const skillOneB = path.resolve(rootB, 'threejs-alt');

    await mkdir(skillOneA, { recursive: true });
    await mkdir(skillOneB, { recursive: true });

    const firstSkillFile = path.resolve(skillOneA, 'SKILL.md');
    const secondSkillFile = path.resolve(skillOneB, 'SKILL.md');

    await writeFile(
      firstSkillFile,
      [
        '---',
        'name: threejs',
        'description: Build Three.js scenes',
        '---',
        '',
        '# Three.js',
      ].join('\n'),
      'utf8'
    );

    await writeFile(
      secondSkillFile,
      [
        '---',
        'name: threejs',
        'description: Duplicate should be ignored',
        '---',
        '',
        '# Duplicate',
      ].join('\n'),
      'utf8'
    );

    const skills = await discoverSkills([rootA, rootB]);

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('threejs');
    expect(skills[0].description).toBe('Build Three.js scenes');
    expect(skills[0].directory).toContain(rootA);
  });

  it('strips frontmatter and builds prompt list', () => {
    const raw = [
      '---',
      'name: cook',
      'description: Feature orchestrator',
      '---',
      '',
      '# Cook',
      'Use this to orchestrate.',
    ].join('\n');

    expect(stripFrontmatter(raw)).toContain('# Cook');

    const prompt = buildSkillsPrompt([
      {
        name: 'cook',
        description: 'Feature orchestrator',
        filePath: '/tmp/cook/SKILL.md',
        directory: '/tmp/cook',
      },
    ]);

    expect(prompt).toContain('Runtime Skills');
    expect(prompt).toContain('- cook: Feature orchestrator');
    expect(prompt).toContain('loadSkill');
  });

  it('reads skill resource files with path guard', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'skills-resource-'));
    tempDirs.push(root);

    const skillDir = path.resolve(root, 'cook');
    await mkdir(path.resolve(skillDir, 'docs'), { recursive: true });

    await writeFile(
      path.resolve(skillDir, 'SKILL.md'),
      [
        '---',
        'name: cook',
        'description: orchestrate',
        '---',
        '',
        '# Cook',
      ].join('\n'),
      'utf8'
    );
    await writeFile(
      path.resolve(skillDir, 'docs', 'guide.md'),
      'guide body',
      'utf8'
    );

    const skills = await discoverSkills([root]);
    const allowed = await readSkillResourceByName(
      skills,
      'cook',
      'docs/guide.md'
    );
    const blocked = await readSkillResourceByName(
      skills,
      'cook',
      '../outside.md'
    );

    expect(allowed?.content).toBe('guide body');
    expect(blocked).toBeNull();
  });
});
