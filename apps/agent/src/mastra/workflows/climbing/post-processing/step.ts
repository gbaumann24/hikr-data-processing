import { createStep } from '@mastra/core/workflows';
import {
  climbingExtractionOutputSchema,
  type ClimbingExtractionOutput,
} from '../extraction';

export type ClimbingPostProcessingOutput = ClimbingExtractionOutput;

export const climbingPostProcessingOutputSchema = climbingExtractionOutputSchema;
export const climbingOutputSchema = climbingPostProcessingOutputSchema;

export const climbingPostProcessingStep = createStep({
  id: 'climbing-post-processing',
  description: 'Apply final climbing output normalization before persistence',
  inputSchema: climbingExtractionOutputSchema,
  outputSchema: climbingPostProcessingOutputSchema,
  // Placeholder for final output shaping once extraction returns richer data.
  execute: async ({ inputData }) => inputData,
});
