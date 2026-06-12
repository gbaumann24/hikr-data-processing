import { climbingExtractionAgentResultSchema, type ClimbingExtractor } from './types';

type StructuredOutputAgent = {
  generate: (
    messages: string,
    options: {
      structuredOutput: { schema: typeof climbingExtractionAgentResultSchema };
      modelSettings?: { temperature?: number; maxOutputTokens?: number };
      providerOptions?: { openai?: { reasoningEffort?: 'low' | 'medium' | 'high' } };
    },
  ) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraClimbingExtractor(agent: StructuredOutputAgent): ClimbingExtractor {
  return async ({ title, preprocessed }) => {
    const response = await agent.generate(
      [
        'Extract structured climbing data from the preprocessed HIKR report below.',
        `Title: ${title ?? ''}`,
        '',
        `Sub-activity: ${preprocessed.base.subActivity ?? ''}`,
        `Route name: ${preprocessed.climbingTourBase?.routeName ?? ''}`,
        `Route names: ${(preprocessed.climbingTourBase?.routeNames ?? []).join(', ')}`,
        `Summit: ${preprocessed.climbingTourBase?.summit ?? ''}`,
        `Climbing garden: ${preprocessed.climbingGardenBase?.name ?? ''}`,
        '',
        `Description: ${preprocessed.normalizedDescription}`,
      ].join('\n'),
      {
        structuredOutput: {
          schema: climbingExtractionAgentResultSchema,
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
        `Mastra climbing extraction agent returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    const parsedResult = climbingExtractionAgentResultSchema.safeParse(response.object);

    if (!parsedResult.success) {
      throw new Error('Mastra climbing extraction agent returned invalid structured output');
    }

    return parsedResult.data;
  };
}
