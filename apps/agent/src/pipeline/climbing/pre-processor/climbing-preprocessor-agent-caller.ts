import {
  climbingSubActivityClassificationSchema,
  type ClimbingSubActivityClassifier,
} from './types';

type StructuredOutputAgent = {
	generate: (
		messages: string,
		options: {
			structuredOutput: { schema: typeof climbingSubActivityClassificationSchema };
			modelSettings?: { temperature?: number; maxOutputTokens?: number };
			providerOptions?: { openai?: { reasoningEffort?: 'low' | 'medium' | 'high' } };
		},
	) => Promise<{ object?: unknown; finishReason?: string }>;
};

export function createMastraClimbingSubActivityClassifier(
  agent: StructuredOutputAgent,
): ClimbingSubActivityClassifier {
  return async ({ title, description }) => {
    const response = await agent.generate(
      [
        'Klassifiziere den HIKR-Kletterbericht.',
        'Gib alle Schema-Felder zurück. Nutze null für Felder, die zur gewählten subActivity nicht gehören.',
        '',
        `Titel: ${title}`,
        '',
        `Beschreibung: ${description}`,
      ].join('\n'),
      {
        structuredOutput: {
          schema: climbingSubActivityClassificationSchema,
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
        `Mastra climbing sub-activity classifier returned undefined object; finishReason=${response.finishReason ?? 'unknown'}`,
      );
    }

    return response.object;
  };
}
