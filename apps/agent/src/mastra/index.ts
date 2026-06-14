import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { baseLayerGateAgent } from './agents/baselayer-gate-agent';
import { climbingExtractionAgent } from './agents/climbing-extraction-agent';
import { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
import { climbingTourAggregationAgent } from './agents/climbing-tour-aggregation-agent';
import { createObservabilityConfig, isMastraObservabilityEnabled } from './runtime/observability';
import { createMastraStorage } from './runtime/storage';
import { baseLayerWorkflow } from './workflows/baselayer';
import { climbingPipelineWorkflow } from './workflows/climbing';
import { skiTouringPipelineWorkflow } from './workflows/ski-touring';

loadRootEnv();

export { baseLayerGateAgent } from './agents/baselayer-gate-agent';
export { climbingExtractionAgent } from './agents/climbing-extraction-agent';
export { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
export {
  climbingTourAggregationAgent,
  climbingTourAggregationAgentOutputSchema,
  type ClimbingTourAggregationAgentOutput,
} from './agents/climbing-tour-aggregation-agent';
export { baseLayerWorkflow } from './workflows/baselayer';
export { climbingPipelineWorkflow } from './workflows/climbing';
export { skiTouringPipelineWorkflow } from './workflows/ski-touring';
export { runBaseLayerPipelineService } from './services/baselayer-pipeline-service';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';
export type { ClimbingPipelineProgressEvent } from './services/climbing-pipeline-service';

export { ACTIVITY } from '@hikr/shared';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from '@hikr/shared';
export type {
  ClimbingDataPipelineDatabase,
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from '@hikr/shared';

const mastraObservabilityEnabled = isMastraObservabilityEnabled();

export const mastra = new Mastra({
  storage: createMastraStorage({ observabilityEnabled: mastraObservabilityEnabled }),
  ...(mastraObservabilityEnabled ? { observability: createObservabilityConfig() } : {}),
  agents: {
    'baselayer-gate-agent': baseLayerGateAgent,
    'climbing-extraction-agent': climbingExtractionAgent,
    'climbing-preprocessor-agent': climbingPreprocessorAgent,
    'climbing-tour-aggregation-agent': climbingTourAggregationAgent,
  },
  workflows: {
    baselayer: baseLayerWorkflow,
    'climbing-pipeline': climbingPipelineWorkflow,
    'ski-touring-pipeline': skiTouringPipelineWorkflow,
  },
});
