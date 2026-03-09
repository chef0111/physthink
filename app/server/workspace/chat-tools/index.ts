import { sceneTools } from './scene-tools';
import { knowledgeTools } from './knowledge-tools';

export const allTools = {
  // Scene manipulation
  addElement: sceneTools.addElement,
  addElements: sceneTools.addElements,
  editElement: sceneTools.editElement,
  removeElement: sceneTools.removeElement,
  setSceneSettings: sceneTools.setSceneSettings,
  // Knowledge (lean set — avoid unnecessary lookups)
  lookupPhysics: knowledgeTools.lookupPhysics,
  getInteractionPattern: knowledgeTools.getInteractionPattern,
  fetchWebContent: knowledgeTools.fetchWebContent,
};
