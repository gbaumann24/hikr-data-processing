import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { climbingExtractionAgent } from './agents/climbing-extraction-agent';
import { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
import { baseLayerWorkflow } from './workflows/baselayer';
import { climbingPipelineWorkflow } from './workflows/climbing';
import { skiTouringPipelineWorkflow } from './workflows/ski-touring';

loadRootEnv();

export { climbingExtractionAgent } from './agents/climbing-extraction-agent';
export { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
export { baseLayerWorkflow } from './workflows/baselayer';
export { climbingPipelineWorkflow } from './workflows/climbing';
export { skiTouringPipelineWorkflow } from './workflows/ski-touring';
export { runBaseLayerPipelineService } from './services/baselayer-pipeline-service';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';

export { ACTIVITY } from '@hikr/shared';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from '@hikr/shared';
export type {
  ClimbingDataPipelineDatabase,
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from '@hikr/shared';

export const mastra = new Mastra({
  agents: {
    'climbing-extraction-agent': climbingExtractionAgent,
    'climbing-preprocessor-agent': climbingPreprocessorAgent,
  },
  workflows: {
    baselayer: baseLayerWorkflow,
    'climbing-pipeline': climbingPipelineWorkflow,
    'ski-touring-pipeline': skiTouringPipelineWorkflow,
  },
});
