import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
import { climbingPipelineWorkflow } from './workflows/climbing-pipeline-workflow';

loadRootEnv();

export { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
export { climbingPipelineWorkflow } from './workflows/climbing-pipeline-workflow';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';

export { ACTIVITY } from '../pipeline/baselayer';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from '../pipeline/baselayer';
export { runClimbingDataPipeline } from '../pipeline/climbing/pipeline';
export type { ClimbingDataPipelineDatabase } from '../pipeline/climbing/pipeline';

export const mastra = new Mastra({
  agents: {
    climbingSubActivityAgent,
  },
  workflows: {
    climbingPipelineWorkflow,
  },
});
