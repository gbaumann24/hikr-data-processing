import type { RequestContext } from '@mastra/core/request-context';
import {
  baseLayerGateAgentOutputSchema,
  parseBaseLayerGateAgentOutput,
  type BaseLayerGateAgentOutput,
  type BaseLayerGateAgentRunner,
} from './types';

type StructuredOutputAgent = {
  generate: (
    messages: string,
    options: {
      requestContext?: RequestContext;
      maxSteps?: number;
      toolChoice?: 'auto' | 'none' | 'required';
      structuredOutput: {
        schema: typeof baseLayerGateAgentOutputSchema;
        model?: string;
      };
      modelSettings?: { temperature?: number; maxOutputTokens?: number };
      providerOptions?: { openai?: { reasoningEffort?: 'low' | 'medium' | 'high' } };
    },
  ) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraBaseLayerGateAgentRunner(
  agent: StructuredOutputAgent,
  options: { requestContext?: RequestContext } = {},
): BaseLayerGateAgentRunner {
  return async ({ title, description, canton, region, tourDate, difficultyScales }) => {
    const difficultyScaleSummary =
      difficultyScales.length > 0
        ? difficultyScales.map(({ scale, value }) => `- ${scale}: ${value}`).join('\n')
        : '- none';

    const response = await agent.generate(
      [
        `Canton: ${canton ?? 'unknown'}`,
        `Region: ${region ?? 'unknown'}`,
        `Tour date: ${tourDate ?? 'unknown'}`,
        '',
        'Difficulty scales:',
        difficultyScaleSummary,
        '',
        `Title: ${title}`,
        '',
        `Description: ${description}`,
      ].join('\n'),
      {
        requestContext: options.requestContext,
        maxSteps: 1,
        toolChoice: 'none',
        structuredOutput: {
          schema: baseLayerGateAgentOutputSchema,
          model: 'openai/gpt-5.4-mini',
        },
        modelSettings: {
          temperature: 0,
        },
        providerOptions: {
          openai: {
            reasoningEffort: 'medium',
          },
        },
      },
    );

    if (response.object === undefined) {
      throw new Error(
        `Mastra baselayer gate agent returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    return parseBaseLayerGateAgentOutput(response.object);
  };
}
