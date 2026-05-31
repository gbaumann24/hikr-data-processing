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
        'Return the schema version and only the extraction fields that are explicitly supported by the report.',
        'Omit categories and fields with no evidence instead of filling an empty object.',
        'Do not guess. Only apply obvious normalizations such as converting hours to minutes or removing units from numeric values.',
        '',
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
          maxOutputTokens: 6000,
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
      throw new Error('Mastra climbing extraction agent returned invalid structured output');
    }

    return response.object;
  };
}

function isClimbingExtractionAgentResult(value: unknown): value is ClimbingExtractionAgentResult {
  return isObjectRecord(value) && value.schemaVersion === CLIMBING_EXTRACTION_SCHEMA_VERSION;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
