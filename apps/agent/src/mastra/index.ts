import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
import { climbingPipelineWorkflow } from './workflows/climbing';
import { skiTouringPipelineWorkflow } from './workflows/ski-touring';

loadRootEnv();

export { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';
export { climbingPipelineWorkflow } from './workflows/climbing';
export { skiTouringPipelineWorkflow } from './workflows/ski-touring';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';

export { ACTIVITY } from './workflows/baselayer';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from './workflows/baselayer';
export { runClimbingDataPipeline } from './workflows/climbing';
export type {
  ClimbingDataPipelineDatabase,
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from './workflows/climbing';

export const mastra = new Mastra({
  agents: {
    'climbing-subactivity-agent': climbingSubActivityAgent,
  },
  workflows: {
    'climbing-pipeline': climbingPipelineWorkflow,
    'ski-touring-pipeline': skiTouringPipelineWorkflow,
  },
});
