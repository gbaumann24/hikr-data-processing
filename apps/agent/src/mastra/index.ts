import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
import { baseLayerWorkflow } from './workflows/baselayer';
import { climbingPipelineWorkflow } from './workflows/climbing';
import { skiTouringPipelineWorkflow } from './workflows/ski-touring';

loadRootEnv();

export { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
export { baseLayerWorkflow } from './workflows/baselayer';
export { climbingPipelineWorkflow } from './workflows/climbing';
export { skiTouringPipelineWorkflow } from './workflows/ski-touring';
export { runBaseLayerPipelineService } from './services/baselayer-pipeline-service';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';

export { ACTIVITY } from '@hikr/shared';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from '@hikr/shared';
export { runClimbingDataPipeline } from './workflows/climbing';
export type {
  ClimbingDataPipelineDatabase,
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from '@hikr/shared';

export const mastra = new Mastra({
  agents: {
    'climbing-subactivity-agent': climbingSubActivityAgent,
  },
  workflows: {
    baselayer: baseLayerWorkflow,
    'climbing-pipeline': climbingPipelineWorkflow,
    'ski-touring-pipeline': skiTouringPipelineWorkflow,
  },
});
