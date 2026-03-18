import { tool } from 'ai';
import { z } from 'zod';
import type { DiscoveredSkill } from '../chat/agent/skills';
import { loadSkillByName, readSkillResourceByName } from '../chat/agent/skills';

export function createAgentSkillsTools(skills: DiscoveredSkill[]) {
  return {
    loadSkill: tool({
      description:
        'Load full instructions for a discovered runtime skill by its exact name.',
      strict: true,
      inputSchema: z.object({
        name: z.string().describe('Skill name to load, exactly as listed.'),
      }),
      execute: async ({ name }) => {
        const loaded = await loadSkillByName(skills, name);
        if (!loaded) {
          return {
            found: false,
            message: `Skill "${name}" was not found. Use a listed skill name.`,
          };
        }

        return {
          found: true,
          skillDirectory: loaded.skillDirectory,
          content: loaded.content,
        };
      },
    }),
    readSkillFile: tool({
      description:
        'Read a file from inside a discovered skill directory. Use only for files referenced by that skill.',
      strict: true,
      inputSchema: z.object({
        name: z.string().describe('Skill name as listed in runtime skills.'),
        relativePath: z
          .string()
          .describe(
            'Relative path inside the skill directory, for example docs/rules.md.'
          ),
      }),
      execute: async ({ name, relativePath }) => {
        const loaded = await readSkillResourceByName(
          skills,
          name,
          relativePath
        );
        if (!loaded) {
          return {
            found: false,
            message:
              'Requested skill file was not found or is outside the allowed skill directory.',
          };
        }

        return {
          found: true,
          skillDirectory: loaded.skillDirectory,
          relativePath: loaded.relativePath,
          content: loaded.content,
        };
      },
    }),
  };
}
