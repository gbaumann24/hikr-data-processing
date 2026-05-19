import { createStep } from '@mastra/core/workflows';
import {
  climbingPreprocessorOutputSchema,
  type ClimbingPreprocessorOutput,
} from '../preprocessor';

export type ClimbingExtractionOutput = ClimbingPreprocessorOutput;

export const climbingExtractionOutputSchema = climbingPreprocessorOutputSchema;

export const climbingExtractionStep = createStep({
  id: 'climbing-extraction',
  description: 'Extract climbing-specific schema data from preprocessed climbing reports',
  inputSchema: climbingPreprocessorOutputSchema,
  outputSchema: climbingExtractionOutputSchema,
  // Placeholder until extraction is split out from preprocessing.
  execute: async ({ inputData }) => inputData,
});
