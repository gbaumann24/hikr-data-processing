import { createWorkflow } from '@mastra/core/workflows';
import { baseLayerInputSchema, baseLayerStep } from '../baselayer/preprocessor';
import { climbingExtractionStep } from './extraction';
import { climbingPostProcessingStep, climbingOutputSchema } from './post-processing';
import { climbingPreprocessorStep } from './preprocessor';

export const climbingPipelineWorkflow = createWorkflow({
  id: 'climbing-pipeline',
  description:
    'Processes a single HIKR post through baselayer normalisation and the climbing workflow',
  inputSchema: baseLayerInputSchema,
  outputSchema: climbingOutputSchema,
})
  // Activity workflows share the same baselayer before branching.
  .then(baseLayerStep)
  .then(climbingPreprocessorStep)
  .then(climbingExtractionStep)
  .then(climbingPostProcessingStep)
  .commit();
