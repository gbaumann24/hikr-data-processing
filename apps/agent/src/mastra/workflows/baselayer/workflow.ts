import { createWorkflow } from '@mastra/core/workflows';
import { baseLayerGateOutputSchema, baseLayerGateStep } from './gate';
import { baseLayerInputSchema, baseLayerStep } from './preprocessor';

export const baseLayerWorkflow = createWorkflow({
  id: 'baselayer',
  description: 'Processes a single HIKR post through baselayer normalisation and gating',
  inputSchema: baseLayerInputSchema,
  outputSchema: baseLayerGateOutputSchema,
})
  .then(baseLayerStep)
  .then(baseLayerGateStep)
  .commit();
