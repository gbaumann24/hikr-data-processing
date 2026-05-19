import { createStep } from '@mastra/core/workflows';
import { skiTouringExtractionOutputSchema } from '../extraction';

export const skiTouringOutputSchema = skiTouringExtractionOutputSchema;

export const skiTouringPostProcessingStep = createStep({
  id: 'ski-touring-post-processing',
  description: 'Apply final ski touring output normalization before persistence',
  inputSchema: skiTouringExtractionOutputSchema,
  outputSchema: skiTouringOutputSchema,
  // Placeholder for final output shaping once extraction returns richer data.
  execute: async ({ inputData }) => inputData,
});
