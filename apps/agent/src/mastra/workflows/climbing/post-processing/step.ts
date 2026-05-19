import { createStep } from '@mastra/core/workflows';
import { climbingExtractionOutputSchema } from '../extraction';

export const climbingOutputSchema = climbingExtractionOutputSchema;

export const climbingPostProcessingStep = createStep({
  id: 'climbing-post-processing',
  description: 'Apply final climbing output normalization before persistence',
  inputSchema: climbingExtractionOutputSchema,
  outputSchema: climbingOutputSchema,
  // Placeholder for final output shaping once extraction returns richer data.
  execute: async ({ inputData }) => inputData,
});
