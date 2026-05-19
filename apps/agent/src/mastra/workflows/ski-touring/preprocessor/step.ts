import { createStep } from '@mastra/core/workflows';
import {
  baseLayerOutputSchema,
  type BaseLayerPreprocessorOutput,
} from '../../baselayer';

export type SkiTouringPreprocessorOutput = BaseLayerPreprocessorOutput;

export const skiTouringPreprocessorOutputSchema = baseLayerOutputSchema;

export const skiTouringPreprocessorStep = createStep({
  id: 'ski-touring-preprocessor',
  description: 'Prepare baselayer output for ski touring extraction',
  inputSchema: baseLayerOutputSchema,
  outputSchema: skiTouringPreprocessorOutputSchema,
  // Placeholder until ski touring activity checks are implemented.
  execute: async ({ inputData }) => inputData,
});
