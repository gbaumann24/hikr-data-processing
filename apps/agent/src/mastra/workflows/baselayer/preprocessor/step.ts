import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import type { BaseLayerPreprocessorOutput, HikrOrgPostBaseLayerInput } from '../types';
import { prepareBaseLayer } from './preprocessor';

// Mastra needs a schema object; the input shape itself comes from Prisma.
export const baseLayerInputSchema = z.custom<HikrOrgPostBaseLayerInput>();
export const baseLayerOutputSchema = z.custom<BaseLayerPreprocessorOutput>();

export const baseLayerStep = createStep({
  id: 'base-layer-preprocessor',
  description: 'Normalise raw HIKR post into base-layer preprocessor output',
  inputSchema: baseLayerInputSchema,
  outputSchema: baseLayerOutputSchema,
  execute: async ({ inputData }) => {
    return prepareBaseLayer(inputData);
  },
});
