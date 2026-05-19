import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { baseLayerOutputSchema, hikrOrgPostSchema } from '../../baselayer/preprocessor';
import { mapHikrOrgPostToPreprocessorInput } from '../../baselayer';
import { createMastraClimbingSubActivityClassifier } from './agent-caller';
import { preprocessPreparedBaseLayerForClimbing } from './preprocessor';
import type { ClimbingPreprocessorOutput } from './types';

type HikrOrgPostInput = z.infer<typeof hikrOrgPostSchema>;

export const climbingPreprocessorOutputSchema = z.custom<ClimbingPreprocessorOutput>();

export const climbingPreprocessorStep = createStep({
  id: 'climbing-preprocessor',
  description: 'Classify climbing sub-activity using baselayer output and AI agent',
  inputSchema: baseLayerOutputSchema,
  outputSchema: climbingPreprocessorOutputSchema,
  execute: async ({ inputData: baseLayer, getInitData, mastra }) => {
    const post = getInitData<HikrOrgPostInput>();
    const input = mapHikrOrgPostToPreprocessorInput(post);

    const agent = mastra.getAgent('climbing-subactivity-agent');
    const classifySubActivity = createMastraClimbingSubActivityClassifier(agent);

    return preprocessPreparedBaseLayerForClimbing(input, baseLayer, {
      classifySubActivity,
    });
  },
});

// Temporary compatibility export for older climbing imports.
export const climbingStep = climbingPreprocessorStep;
