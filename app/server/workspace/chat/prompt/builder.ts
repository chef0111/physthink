import { WORKSPACE_CHAT_SYSTEM_PROMPT } from './system';
import { ELEMENT_REFERENCE } from '../agent/tools/element-reference';

type BuildChatSystemPromptInput = {
  capabilitySystemContext: string;
  skillsPrompt: string;
  coreMemory: string;
  sceneContext: string;
};

export function buildChatSystemPrompt({
  capabilitySystemContext,
  skillsPrompt,
  coreMemory,
  sceneContext,
}: BuildChatSystemPromptInput): string {
  const sections = [
    WORKSPACE_CHAT_SYSTEM_PROMPT,
    ELEMENT_REFERENCE,
    capabilitySystemContext.trim(),
    skillsPrompt.trim(),
  ].filter((section) => section.length > 0);

  if (coreMemory.trim()) {
    sections.push(`## Core Memory\n${coreMemory.trim()}`);
  }

  sections.push(`## Current Scene\n${sceneContext}`);

  return sections.join('\n\n');
}
