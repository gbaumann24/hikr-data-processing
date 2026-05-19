import { createWorkflow } from '@mastra/core/workflows';
import { baseLayerStep, hikrOrgPostSchema } from '../baselayer/preprocessor';
import { skiTouringExtractionStep } from './extraction';
import { skiTouringPostProcessingStep, skiTouringOutputSchema } from './post-processing';
import { skiTouringPreprocessorStep } from './preprocessor';

export const skiTouringPipelineWorkflow = createWorkflow({
  id: 'ski-touring-pipeline',
  description:
    'Processes a single HIKR post through baselayer normalisation and the ski touring workflow',
  inputSchema: hikrOrgPostSchema,
  outputSchema: skiTouringOutputSchema,
})
  // Activity workflows share the same baselayer before branching.
  .then(baseLayerStep)
  .then(skiTouringPreprocessorStep)
  .then(skiTouringExtractionStep)
  .then(skiTouringPostProcessingStep)
  .commit();
