import type { RequestContext } from '@mastra/core/request-context';
import { CLIMBING_AGENT_MODEL } from '../../../agents/models';
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
    },
  ) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraClimbingPreprocessorAgentRunner(
  agent: StructuredOutputAgent,
  options: { requestContext?: RequestContext } = {},
): ClimbingPreprocessorAgentRunner {
  return async ({ title, description, canton }) => {
    const response = await agent.generate(
      [`Canton: ${canton}`, '', `Title: ${title}`, '', `Description: ${description}`].join('\n'),
      {
        requestContext: options.requestContext,
        maxSteps: 6,
        toolChoice: 'auto',
        structuredOutput: {
          schema: climbingPreprocessorAgentOutputSchema,
          model: CLIMBING_AGENT_MODEL,
        },
        modelSettings: {
          temperature: 0,
          maxOutputTokens: 8000,
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
