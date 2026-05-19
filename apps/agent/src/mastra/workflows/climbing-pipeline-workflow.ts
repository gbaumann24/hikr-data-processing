import { createWorkflow } from '@mastra/core/workflows';
import { baselayerStep, hikrOrgPostSchema } from './baselayer/step';
import { climbingStep, climbingOutputSchema } from './climbing/step';

export const climbingPipelineWorkflow = createWorkflow({
  id: 'climbing-pipeline',
  description: 'Processes a single HIKR post through baselayer normalisation and climbing classification',
  inputSchema: hikrOrgPostSchema,
  outputSchema: climbingOutputSchema,
})
  .then(baselayerStep)
  .then(climbingStep)
  .commit();
