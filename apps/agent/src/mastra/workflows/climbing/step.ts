import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  preprocessPreparedBaseLayerForClimbing,
  createMastraClimbingSubActivityClassifier,
  type ClimbingPreprocessorOutput,
} from '.';
import { mapHikrOrgPostToPreprocessorInput } from '../baselayer';
import { baseLayerOutputSchema, hikrOrgPostSchema } from '../baselayer/step';

type HikrOrgPostInput = z.infer<typeof hikrOrgPostSchema>;

export const climbingOutputSchema = z.custom<ClimbingPreprocessorOutput>();

export const climbingStep = createStep({
  id: 'climbing',
  description: 'Classify climbing sub-activity using baselayer output and AI agent',
  inputSchema: baseLayerOutputSchema,
  outputSchema: climbingOutputSchema,
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
