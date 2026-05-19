import type { RequestContext } from '@mastra/core/request-context';
import {
  CLIMBING_SUB_ACTIVITY,
  climbingPreprocessorAgentOutputSchema,
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
  return async ({ title, description, canton }) => {
    const response = await agent.generate(
      [
        `Canton: ${canton}`,
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

    return parseSubActivityClassification(response.object);
  };
}

function parseSubActivityClassification(
  classification: unknown,
): ClimbingPreprocessorAgentOutput | null {
  if (!classification || typeof classification !== 'object') {
    return null;
  }

  const record = classification as Record<string, unknown>;

  if (record.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR) {
    const routeName = normalizeRequiredString(record.routeName);
    const summit = normalizeRequiredString(record.summit);

    return routeName && summit
      ? {
          subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
          routeName,
          summit,
        }
      : null;
  }

  if (record.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    const name = normalizeRequiredString(record.name);

    return name
      ? {
          subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
          name,
        }
      : null;
  }

  if (record.subActivity === null) {
    return { subActivity: null };
  }

  return null;
}

function normalizeRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized === '' ? null : normalized;
}
