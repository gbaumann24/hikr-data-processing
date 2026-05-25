import type { RequestContext } from '@mastra/core/request-context';
import {
  climbingPreprocessorAgentOutputSchema,
  parseClimbingPreprocessorAgentOutput,
  type ClimbingPreprocessorAgentOutput,
  type ClimbingPreprocessorAgentRunner,
} from './types';

type StructuredOutputAgent = {
  generate: (
    messages: string,
    options: {
      requestContext?: RequestContext;
      maxSteps?: number;
      toolChoice?: 'auto' | 'none' | 'required';
      structuredOutput: {
        schema: typeof climbingPreprocessorAgentOutputSchema;
        model?: string;
      };
      modelSettings?: { temperature?: number; maxOutputTokens?: number };
      providerOptions?: { openai?: { reasoningEffort?: 'low' | 'medium' | 'high' } };
    },
  ) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraClimbingPreprocessorAgentRunner(
  agent: StructuredOutputAgent,
  options: { requestContext?: RequestContext } = {},
): ClimbingPreprocessorAgentRunner {
  return async ({ title, description, canton, difficultyScales }) => {
    const difficultyScaleSummary =
      difficultyScales.length > 0
        ? difficultyScales.map(({ scale, value }) => `- ${scale}: ${value}`).join('\n')
        : '- none';

    const response = await agent.generate(
      [
        `Canton: ${canton}`,
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
        maxSteps: 6,
        toolChoice: 'auto',
        structuredOutput: {
          schema: climbingPreprocessorAgentOutputSchema,
          model: 'openai/gpt-5-mini',
        },
        modelSettings: {
          temperature: 0,
          maxOutputTokens: 8000,
        },
        providerOptions: {
          openai: {
            reasoningEffort: 'low',
          },
        },
      },
    );

    if (response.object === undefined) {
      throw new Error(
        `Mastra climbing preprocessor agent returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    return parseClimbingPreprocessorAgentOutput(response.object);
  };
}
