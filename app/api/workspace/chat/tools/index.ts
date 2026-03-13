import { sceneTools } from './scene-tools';
import { knowledgeTools } from './knowledge-tools';
import { codeTools } from './code-tools';
import { ragPipelineTools } from './rag-pipeline-tools';

export const allTools = {
  ...sceneTools,
  ...knowledgeTools,
  ...codeTools,
  ...ragPipelineTools,
};
