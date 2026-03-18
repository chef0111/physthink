import { sceneTools } from './scene-tools';
import { knowledgeTools } from './knowledge-tools';
import { ragPipelineTools } from './rag-tools';
import { createAgentSkillsTools } from './agent-skills-tools';
import { createMemoryTools } from './memory-tools';
import type { DiscoveredSkill } from '../chat/agent/skills';

export type ChatToolContext = {
  workspaceId: string;
  userId: string;
};

type CreateChatToolsOptions = {
  skills?: DiscoveredSkill[];
  context?: ChatToolContext;
};

function createBaseTools() {
  return {
    // Scene manipulation
    addElement: sceneTools.addElement,
    addElements: sceneTools.addElements,
    editElement: sceneTools.editElement,
    removeElement: sceneTools.removeElement,
    setSceneSettings: sceneTools.setSceneSettings,
    // Local RAG pipeline (primary for textbook-style problems)
    runProblemRagPipeline: ragPipelineTools.runProblemRagPipeline,
    searchProblemExamples: knowledgeTools.searchProblemExamples,
    getProblemExampleByKey: knowledgeTools.getProblemExampleByKey,
    // Knowledge helpers
    getPhysicsConstants: knowledgeTools.getPhysicsConstants,
    searchPhysicsKnowledge: knowledgeTools.searchPhysicsKnowledge,
    getInteractionPattern: knowledgeTools.getInteractionPattern,
    fetchWebContent: knowledgeTools.fetchWebContent,
  };
}

export type ChatTools = ReturnType<typeof createBaseTools> &
  ReturnType<typeof createAgentSkillsTools> &
  ReturnType<typeof createMemoryTools>;

export function createChatTools(
  options: CreateChatToolsOptions = {}
): ChatTools {
  const skills = options.skills ?? [];

  return {
    ...createBaseTools(),
    ...createAgentSkillsTools(skills),
    ...createMemoryTools(options.context),
  };
}

export const allTools = createChatTools();
