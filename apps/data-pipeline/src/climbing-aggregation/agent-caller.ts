import {
  climbingTourAggregationAgentOutputSchema,
  type ClimbingTourAggregationAgentOutput,
} from 'agent/mastra/agents/climbing-tour-aggregation-agent';
import type { ClimbingTourAggregationAgentInput } from './types';

type StructuredOutputAgent = {
  generate: (
    messages: string,
    options: {
      structuredOutput: { schema: typeof climbingTourAggregationAgentOutputSchema };
      modelSettings?: { temperature?: number; maxOutputTokens?: number };
      providerOptions?: { openai?: { reasoningEffort?: 'low' | 'medium' | 'high' } };
    },
  ) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraClimbingTourAggregationSummarizer(
  agent: StructuredOutputAgent,
): (input: ClimbingTourAggregationAgentInput) => Promise<ClimbingTourAggregationAgentOutput> {
  return async (input) => {
    const response = await agent.generate(
      [
        'Aggregate the text evidence for this climbing route.',
        'Return only the requested structured output.',
        '',
        JSON.stringify(input),
      ].join('\n'),
      {
        structuredOutput: {
          schema: climbingTourAggregationAgentOutputSchema,
        },
        modelSettings: {
          temperature: 0,
          maxOutputTokens: 60000,
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
        `Mastra climbing tour aggregation agent returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    const parsedResult = climbingTourAggregationAgentOutputSchema.safeParse(response.object);

    if (!parsedResult.success) {
      throw new Error('Mastra climbing tour aggregation agent returned invalid structured output');
    }

    return parsedResult.data;
  };
}
