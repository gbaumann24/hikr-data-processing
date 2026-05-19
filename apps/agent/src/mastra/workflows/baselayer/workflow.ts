import { createWorkflow } from '@mastra/core/workflows';
import { baseLayerInputSchema, baseLayerOutputSchema, baseLayerStep } from './preprocessor';

export const baseLayerWorkflow = createWorkflow({
  id: 'baselayer',
  description: 'Processes a single HIKR post through baselayer normalisation',
  inputSchema: baseLayerInputSchema,
  outputSchema: baseLayerOutputSchema,
})
  .then(baseLayerStep)
  .commit();
