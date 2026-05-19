import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  mapHikrOrgPostToPreprocessorInput,
  prepareBaseLayer,
  type BaseLayerPreprocessorOutput,
} from '.';

export const hikrOrgPostSchema = z.object({
  id: z.union([z.bigint(), z.number(), z.string()]),
  title: z.string().nullable().optional(),
  regionPathCsv: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tourDate: z.union([z.date(), z.string()]).nullable().optional(),
  hikingDifficulty: z.string().nullable().optional(),
  alpineTourDifficulty: z.string().nullable().optional(),
  climbingDifficulty: z.string().nullable().optional(),
  snowshoeTourDifficulty: z.string().nullable().optional(),
  viaFerrataDifficulty: z.string().nullable().optional(),
  skiDifficulty: z.string().nullable().optional(),
  iceClimbingDifficulty: z.string().nullable().optional(),
  mountainBikeDifficulty: z.string().nullable().optional(),
});

export const baseLayerOutputSchema = z.custom<BaseLayerPreprocessorOutput>();

export const baselayerStep = createStep({
  id: 'baselayer',
  description: 'Normalise raw HIKR post into base-layer preprocessor output',
  inputSchema: hikrOrgPostSchema,
  outputSchema: baseLayerOutputSchema,
  execute: async ({ inputData }) => {
    const input = mapHikrOrgPostToPreprocessorInput(inputData);
    return prepareBaseLayer(input);
  },
});
