import { createStep } from '@mastra/core/workflows';
import {
  skiTouringPreprocessorOutputSchema,
  type SkiTouringPreprocessorOutput,
} from '../preprocessor';

export type SkiTouringExtractionOutput = SkiTouringPreprocessorOutput;

export const skiTouringExtractionOutputSchema = skiTouringPreprocessorOutputSchema;

export const skiTouringExtractionStep = createStep({
  id: 'ski-touring-extraction',
  description: 'Extract ski touring schema data from preprocessed ski touring reports',
  inputSchema: skiTouringPreprocessorOutputSchema,
  outputSchema: skiTouringExtractionOutputSchema,
  // Placeholder until ski touring extraction exists.
  execute: async ({ inputData }) => inputData,
});
