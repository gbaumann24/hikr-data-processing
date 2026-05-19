import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
import { climbingPipelineWorkflow } from './workflows/climbing-pipeline-workflow';

loadRootEnv();

export { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
export { climbingPipelineWorkflow } from './workflows/climbing-pipeline-workflow';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';

export { ACTIVITY } from './workflows/baselayer';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from './workflows/baselayer';
export { runClimbingDataPipeline } from './workflows/climbing/pipeline';
export type { ClimbingDataPipelineDatabase } from './workflows/climbing/pipeline';

export const mastra = new Mastra({
  agents: {
    'climbing-subactivity-agent': climbingSubActivityAgent,
  },
  workflows: {
    'climbing-pipeline': climbingPipelineWorkflow,
  },
});
