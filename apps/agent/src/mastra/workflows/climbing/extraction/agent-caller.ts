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
        '',
        'Output rules:',
        '- Return the schema version and only the fields explicitly supported by the report. Omit categories and fields without evidence; never emit empty objects or placeholder values.',
        '- Write ALL free-text values in German. Preserve the climbing jargon of the report verbatim (Einstieg, Ausstieg, Seillaenge, Stand, Verhauer, Exen, Bohrhaken, Sanduhr, ...). Do not translate or genericize these terms.',
        '- Keep free-text values concise: condense to the relevant statement instead of copying full sentences.',
        '- Enum values must match the schema exactly (lowercase).',
        '- Do not guess or infer. Only apply obvious normalizations: durations to minutes ("1 h 30" -> 90), numbers without units (the unit is in the field name), "2x60m" rope -> 60 per strand.',
        '- If statements conflict, prefer the more specific or more recent passage; if unresolvable, omit the field.',
        '- Deduplicate array values.',
        '- The route runs from Einstieg to Ausstieg. Zustieg and Abstieg are not part of the route; the Abstieg begins at the summit or Ausstieg.',
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

    const parsedResult = climbingExtractionAgentResultSchema.safeParse(response.object);

    if (!parsedResult.success) {
      throw new Error('Mastra climbing extraction agent returned invalid structured output');
    }

    return parsedResult.data;
  };
}
