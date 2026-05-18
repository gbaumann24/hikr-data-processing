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
		},
	) => Promise<{ object?: unknown }>;
};

export function createMastraClimbingSubActivityClassifier(
  agent: StructuredOutputAgent,
): ClimbingSubActivityClassifier {
  return async ({ title, description }) => {
    const response = await agent.generate(
      [
        'Klassifiziere den HIKR-Kletterbericht.',
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
          maxOutputTokens: 300,
        },
      },
    );

    return response.object;
  };
}
