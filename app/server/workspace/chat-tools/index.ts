import { sceneTools } from './scene-tools';
import { knowledgeTools } from './knowledge-tools';
import { ragPipelineTools } from './rag-tools';

export const allTools = {
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
