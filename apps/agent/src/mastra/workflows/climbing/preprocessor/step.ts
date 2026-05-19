import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { baseLayerOutputSchema } from '../../baselayer/preprocessor';
import { createMastraClimbingPreprocessorAgentRunner } from './agent-caller';
import { preprocessPreparedBaseLayerForClimbing } from './preprocessor';
import type { HikrOrgPostBaseLayerInput } from '../../baselayer';
import type { ClimbingPreprocessorOutput } from './types';

export const climbingPreprocessorOutputSchema = z.custom<ClimbingPreprocessorOutput>();

export const climbingPreprocessorStep = createStep({
  id: 'climbing-preprocessor',
  description: 'Run the climbing preprocessor agent using baselayer output',
  inputSchema: baseLayerOutputSchema,
  outputSchema: climbingPreprocessorOutputSchema,
  execute: async ({ inputData: baseLayer, getInitData, mastra, requestContext }) => {
    const post = getInitData<HikrOrgPostBaseLayerInput>();

    const agent = mastra.getAgent('climbing-preprocessor-agent');
    const runClimbingPreprocessorAgent = createMastraClimbingPreprocessorAgentRunner(agent, {
      requestContext,
    });

    return preprocessPreparedBaseLayerForClimbing(post, baseLayer, {
      runClimbingPreprocessorAgent,
    });
  },
});
