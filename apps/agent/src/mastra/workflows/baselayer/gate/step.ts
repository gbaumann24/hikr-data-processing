import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { baseLayerOutputSchema } from '../preprocessor';
import { createMastraBaseLayerGateAgentRunner } from './agent-caller';
import { gatePreparedBaseLayer } from './gate';
import type { BaseLayerGateOutput, HikrOrgPostBaseLayerInput } from '../types';

export const baseLayerGateOutputSchema = z.custom<BaseLayerGateOutput>();

export const baseLayerGateStep = createStep({
  id: 'base-layer-gate',
  description: 'Run the baselayer gate agent using normalized report output',
  inputSchema: baseLayerOutputSchema,
  outputSchema: baseLayerGateOutputSchema,
  execute: async ({ inputData: baseLayer, getInitData, mastra, requestContext }) => {
    const post = getInitData<HikrOrgPostBaseLayerInput>();

    if (baseLayer.isInsufficient) {
      return gatePreparedBaseLayer(post, baseLayer);
    }

    const agent = mastra.getAgent('baselayer-gate-agent');
    const runBaseLayerGateAgent = createMastraBaseLayerGateAgentRunner(agent, {
      requestContext,
    });

    return gatePreparedBaseLayer(post, baseLayer, {
      runBaseLayerGateAgent,
    });
  },
});
