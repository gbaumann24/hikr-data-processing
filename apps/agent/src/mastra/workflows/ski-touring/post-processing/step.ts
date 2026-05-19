import { createStep } from '@mastra/core/workflows';
import {
  skiTouringExtractionOutputSchema,
  type SkiTouringExtractionOutput,
} from '../extraction';

export type SkiTouringPostProcessingOutput = SkiTouringExtractionOutput;

export const skiTouringPostProcessingOutputSchema = skiTouringExtractionOutputSchema;
export const skiTouringOutputSchema = skiTouringPostProcessingOutputSchema;

export const skiTouringPostProcessingStep = createStep({
  id: 'ski-touring-post-processing',
  description: 'Apply final ski touring output normalization before persistence',
  inputSchema: skiTouringExtractionOutputSchema,
  outputSchema: skiTouringPostProcessingOutputSchema,
  // Placeholder for final output shaping once extraction returns richer data.
  execute: async ({ inputData }) => inputData,
});
