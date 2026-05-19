import {
  CLIMBING_EXTRACTION_SCHEMA_VERSION,
  climbingExtractionAgentResultSchema,
  type ClimbingExtractionAgentResult,
  type ClimbingExtractor,
} from './types';

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
        'Extract structured climbing data from the preprocessed HIKR report.',
        'The current extraction schema is a scaffold. Return the requested schema version exactly.',
        '',
        `Title: ${title ?? ''}`,
        '',
        `Sub-activity: ${preprocessed.base.subActivity ?? ''}`,
        `Route name: ${preprocessed.climbingTourBase?.routeName ?? ''}`,
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
          maxOutputTokens: 1000,
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
        `Mastra climbing extraction agent returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    if (!isClimbingExtractionAgentResult(response.object)) {
      throw new Error('Mastra climbing extraction agent returned invalid scaffold output');
    }

    return response.object;
  };
}

function isClimbingExtractionAgentResult(value: unknown): value is ClimbingExtractionAgentResult {
  return (
    Boolean(value && typeof value === 'object') &&
    (value as { schemaVersion?: unknown }).schemaVersion === CLIMBING_EXTRACTION_SCHEMA_VERSION
  );
}
