import { createWorkflow } from '@mastra/core/workflows';
import { baseLayerOutputSchema, baseLayerStep, hikrOrgPostSchema } from './preprocessor';

export const baseLayerWorkflow = createWorkflow({
  id: 'baselayer',
  description: 'Processes a single HIKR post through baselayer normalisation',
  inputSchema: hikrOrgPostSchema,
  outputSchema: baseLayerOutputSchema,
})
  .then(baseLayerStep)
  .commit();
